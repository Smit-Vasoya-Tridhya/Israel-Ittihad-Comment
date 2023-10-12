import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HistoryLogs } from './historyLogs.schema';
import mongoose, { Model } from 'mongoose';
import { CreateSearchObjectDto } from 'src/common/search_object.dto';
import {
    capitalizeFirstLetter,
    getKeywordType,
    paginationObject,
    transformResponseCommenthistorylog,
    transformResponsepagehistorylog,
} from 'src/helpers/utils';
import { decrypt, decryptArrayOfObject, encrypt } from 'src/helpers/encrypt-decrypt';
import moment from 'moment-timezone';

@Injectable()
export class HistoryLogsService {
    constructor(@InjectModel(HistoryLogs.name, 'SYSTEM_DB') private historyLogsModel: Model<any>) {}

    async getHistoryLogs(searchObject: CreateSearchObjectDto, logId: any): Promise<any> {
        try {
            let queryObject: any;
            let pagination: any = paginationObject(searchObject);

            queryObject = {
                module: searchObject.module,
                logId: new mongoose.Types.ObjectId(logId),
            };

            if (pagination.sort.updatedBy) {
                pagination['sort'] = { 'updatedByAdmin.firstname': pagination.sort.updatedBy };
                pagination['sort'] = { 'updatedByUser.firstname': pagination.sort.updatedBy };
            }

            if (pagination.sort.data) {
                pagination['sort'] = { 'data.status': pagination.sort.data };
            }

            if (searchObject.search && searchObject.search !== '') {
                queryObject['$or'] = [
                    { method: { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
                    { 'updatedByAdmin.firstname': { $regex: encrypt(searchObject.search), $options: 'i' } },
                    { 'updatedByUser.firstname': { $regex: encrypt(searchObject.search), $options: 'i' } },
                    {
                        'updatedByAdmin.fullname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'updatedByUser.fullname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                ];

                const keywordType = getKeywordType(searchObject.search);
                if (keywordType === 'number') {
                    const numericKeyword = parseInt(searchObject.search);
                    queryObject['$or'].push({ row_id: numericKeyword });
                } else if (keywordType === 'date') {
                    const dateKeyword = new Date(searchObject.search);
                    queryObject['$or'].push({ updatedAt: dateKeyword });
                    queryObject['$or'].push({ createdAt: dateKeyword });
                }
            }

            const pipeline = [
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'updatedBy',
                        foreignField: '_id',
                        as: 'updatedByAdmin',
                        pipeline: [{ $project: { firstname: 1, lastname: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'updatedBy',
                        foreignField: '_id',
                        as: 'updatedByUser',
                        pipeline: [{ $project: { firstname: 1, lastname: 1 } }],
                    },
                },
                {
                    $match: queryObject,
                },
                {
                    $project: {
                        row_id: 1,
                        method: 1,
                        data: 1,
                        site: 1,
                        module: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        updatedByAdmin: {
                            $cond: {
                                if: { $eq: [{ $size: '$updatedByAdmin' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$updatedByAdmin', 0] },
                            },
                        },
                        updatedByUser: {
                            $cond: {
                                if: { $eq: [{ $size: '$updatedByUser' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$updatedByUser', 0] },
                            },
                        },
                    },
                },
            ];

            let findHistoryLogs = await this.historyLogsModel
                .aggregate(pipeline)
                .sort(pagination.sort)
                .skip(pagination.skip)
                .limit(pagination.resultPerPage);

            let pageData = await this.historyLogsModel.find(queryObject);
            let pageCount = Math.ceil(pageData.length / pagination.resultPerPage);

            return {
                data: decryptArrayOfObject(findHistoryLogs, [
                    'firstname',
                    'lastname',
                    'updatedByAdmin',
                    'updatedByUser',
                ]),
                pageCount,
            };
        } catch (error) {
            console.log(error, 'error while loading history logs');
            return error.message;
        }
    }

    async addHistoryLog(historyLogsData: any) {
        try {
            let oldRowID: any = await this.historyLogsModel
                .find({ site: historyLogsData.site, module: historyLogsData.module, logId: historyLogsData.logId })
                .sort({ row_id: -1 });

            if (oldRowID.length === 0) {
                historyLogsData['row_id'] = 1;
            } else {
                historyLogsData['row_id'] = oldRowID[0].row_id + 1;
            }

            let addHistoryLog = await this.historyLogsModel.create(historyLogsData);

            return addHistoryLog;
        } catch (error) {
            console.log(error, 'error while updating  history logs');
            return error.message;
        }
    }

    async downloadExcel(request: any, module: any, id: string) {
        try {
            let queryObject: any;
            queryObject = {
                module: module,
                logId: new mongoose.Types.ObjectId(id),
            };

            const pipeline = [
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'updatedBy',
                        foreignField: '_id',
                        as: 'updatedByAdmin',
                        pipeline: [{ $project: { firstname: 1, lastname: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'updatedBy',
                        foreignField: '_id',
                        as: 'updatedByUser',
                        pipeline: [{ $project: { firstname: 1, lastname: 1 } }],
                    },
                },
                {
                    $match: queryObject,
                },
                {
                    $project: {
                        _id: 0,
                        row_id: 1,
                        method: 1,
                        module: 1,
                        pageUrl: '$data.pageUrl',
                        ittihadUrl: '$data.ittihadUrl',
                        status: '$data.status',
                        isrealUrl: '$data.isrealUrl',
                        israelPage: '$data.israelPage',
                        ittihadPage: '$data.ittihadPage',
                        comment: '$data.updatedComment',
                        data: '$data',
                        createdAt: 1,
                        updatedByAdmin: {
                            $cond: {
                                if: { $eq: [{ $size: '$updatedByAdmin' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$updatedByAdmin', 0] },
                            },
                        },
                        updatedByUser: {
                            $cond: {
                                if: { $eq: [{ $size: '$updatedByUser' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$updatedByUser', 0] },
                            },
                        },
                    },
                },
            ];

            let findHistoryLogs = await this.historyLogsModel.aggregate(pipeline);

            // findHistoryLogs.map((item: any) => {
            //     if (item.updatedByAdmin) {
            //         item['fullName'] =
            //             decrypt(item.updatedByAdmin.firstname) + ' ' + decrypt(item.updatedByAdmin.lastname);
            //     } else {
            //         item['fullName'] =
            //             decrypt(item.updatedByUser.firstname) + ' ' + decrypt(item.updatedByUser.lastname);
            //     }
            //     if (typeof item.data === 'object') {
            //         delete item.data;
            //     }
            //     delete item.updatedByUser;
            //     delete item.updatedByAdmin;
            // });

            return this.optimiseExcel(findHistoryLogs);
        } catch (error) {
            console.log(error, 'error while loading history logs');
            return error.message;
        }
    }

    optimiseExcel(data: any[]): any {
        try {
            const batchSize = Math.ceil(Math.sqrt(data.length));
            let chunkArray: any[] = [];
            for (let index = 0; index < batchSize; index++) {
                chunkArray.push(data.splice(0, batchSize));
            }

            let updatedData = chunkArray.map((element: any) => {
                return this.optimisedHistoryXls(element);
            });
            return [].concat.apply([], updatedData);
        } catch (error) {
            console.log('error while exporting users data', error);
            return error.message;
        }
    }

    optimisedHistoryXls(data: any[]): any {
        try {
            const newArrayData: any[] = [];
            data.forEach((element: any) => {
                let obj = {};
                obj['Id'] = element.row_id || '-';
                obj['Event'] = element.method || '-';
                if (element.updatedByAdmin) {
                    obj['User'] =
                        capitalizeFirstLetter(decrypt(element?.updatedByAdmin?.firstname)) +
                        ' ' +
                        capitalizeFirstLetter(decrypt(element?.updatedByAdmin?.lastname));
                } else {
                    obj['User'] =
                        capitalizeFirstLetter(decrypt(element?.updatedByUser?.firstname)) +
                        ' ' +
                        capitalizeFirstLetter(decrypt(element?.updatedByUser?.lastname));
                }
                obj['Date'] = element.createdAt
                    ? moment(element.createdAt).tz('Israel').format('DD.MM.YYYY HH:mm')
                    : '-';

                // obj['Data'] = element.data ? JSON.stringify(element.data) : '-';

                if (element.module === 'comments') {
                    obj['Data'] = transformResponseCommenthistorylog(element.data);
                } else if (element.module === 'pages') {
                    obj['Data'] = transformResponsepagehistorylog(element.data);
                }
                newArrayData.push(obj);
            });

            return newArrayData;
        } catch (error) {
            console.log('error while exporting users data', error);
            return error.message;
        }
    }
}
