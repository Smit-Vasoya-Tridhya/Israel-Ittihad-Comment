import { decrypt, decryptArrayOfObject, encrypt } from './../helpers/encrypt-decrypt';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IWords } from '../interfaces/HarmfullWord.interface';
import { Model } from 'mongoose';
import { HarmfullWordDto } from './HarmfullWord.dto.ts/harmfull-word.dto';
import { Harmfull_Word } from './harmfull-word.schema';
import { capitalizeFirstLetter, getKeywordType, paginationObject, returnMessage } from 'src/helpers/utils';
import { CreateSearchObjectDto } from 'src/common/search_object.dto';
import moment from 'moment-timezone';

@Injectable()
export class HarmfullWordService {
    constructor(
        @InjectModel(Harmfull_Word.name, 'SYSTEM_DB')
        private readonly harmfullWordsModel: Model<IWords>,
    ) {}

    async createHarmfullWords(createHarmfullWordDto: HarmfullWordDto, request: any): Promise<IWords> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.harmfulWords.write) {
                return returnMessage('permissionDenied');
            }

            createHarmfullWordDto.createdBy = request.user._id;
            createHarmfullWordDto.updatedBy = request.user._id;

            let checkWord = await this.harmfullWordsModel.findOne({
                site: request.user.site,
                word: createHarmfullWordDto.word,
                is_deleted: false,
            });

            if (checkWord) {
                return returnMessage('wordExists');
            }

            let oldRowID: any = await this.harmfullWordsModel.find({ site: request.user.site }).sort({ row_id: -1 });

            if (oldRowID.length === 0) {
                createHarmfullWordDto['row_id'] = 1;
            } else {
                createHarmfullWordDto['row_id'] = oldRowID[0].row_id + 1;
            }
            createHarmfullWordDto.site = request.user.site;
            return await this.harmfullWordsModel.create(createHarmfullWordDto);
        } catch (error) {
            console.log('error in create harmfullword', error);
            return error.message;
        }
    }

    async getAllWords(searchObject: CreateSearchObjectDto, request: any, reqpagination) {
        try {
            const permissions = request.user.permissions;
            if (!permissions.harmfulWords.read) {
                return returnMessage('permissionDenied');
            }
            if (reqpagination === true || reqpagination === 'true') {
                const pagination = paginationObject(searchObject);
                const queryConditions: any = {
                    is_deleted: false,
                    site: request.user.site,
                };

                if (searchObject.search && searchObject.search !== '') {
                    queryConditions['$or'] = [
                        { word: { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
                        { site: { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
                        {
                            'updatedByAdmin.firstname': {
                                $regex: encrypt(searchObject.search.toLowerCase()),
                                $options: 'i',
                            },
                        },
                        {
                            'updatedByAdmin.lastname': {
                                $regex: encrypt(searchObject.search.toLowerCase()),
                                $options: 'i',
                            },
                        },

                        {
                            'updatedByUser.firstname': {
                                $regex: encrypt(searchObject.search.toLowerCase()),
                                $options: 'i',
                            },
                        },
                        {
                            'updatedByUser.lastname': {
                                $regex: encrypt(searchObject.search.toLowerCase()),
                                $options: 'i',
                            },
                        },
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
                        queryConditions['$or'].push({ row_id: numericKeyword });
                    } else if (keywordType === 'date') {
                        const dateKeyword = new Date(searchObject.search);
                        queryConditions['$or'].push({ updatedAt: dateKeyword });
                    }
                }

                const aggregationPipeline = [
                    {
                        $lookup: {
                            from: 'admins',
                            localField: 'updatedBy',
                            foreignField: '_id',
                            as: 'updatedByAdmin',
                            pipeline: [{ $project: { firstname: 1, lastname: 1, fullname: 1 } }],
                        },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'updatedBy',
                            foreignField: '_id',
                            as: 'updatedByUser',
                            pipeline: [{ $project: { firstname: 1, lastname: 1, fullname: 1 } }],
                        },
                    },
                    {
                        $match: queryConditions,
                    },
                    {
                        $project: {
                            word: 1,
                            row_id: 1,
                            is_deleted: 1,
                            site: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            fullname: 1,
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

                const wordData = await this.harmfullWordsModel
                    .aggregate(aggregationPipeline)
                    .sort(pagination.sort)
                    .skip(pagination.skip)
                    .limit(pagination.resultPerPage);

                const pageData = await this.harmfullWordsModel.aggregate(aggregationPipeline);

                return {
                    pageCount: Math.ceil(pageData.length / pagination.resultPerPage) || 0,
                    wordData: decryptArrayOfObject(wordData, [
                        'firstname',
                        'lastname',
                        'updatedByUser',
                        'fullname',
                        'updatedByAdmin',
                    ]),
                };
            } else {
                const queryConditions: any = {
                    is_deleted: false,
                    site: request.user.site,
                };
                const wordData = await this.harmfullWordsModel.find(queryConditions);
                return { wordData };
            }
        } catch (error) {
            console.log('error in create harmfullword', error);
            return error.message;
        }
    }

    async getWordByID(id: string, request: any): Promise<IWords> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.harmfulWords.write) {
                return returnMessage('permissionDenied');
            }

            const existingWord = await this.harmfullWordsModel.findById(id).where({ is_deleted: false }).lean();

            if (!existingWord) return returnMessage('wordNotFound');

            return existingWord;
        } catch (error) {
            console.log('error in get harmfullword', error);
            return error.message;
        }
    }

    async deleteWord(id: string, request: any): Promise<IWords> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.harmfulWords.write) {
                return returnMessage('permissionDenied');
            }

            const deletedWord = await this.harmfullWordsModel.findByIdAndUpdate(id, {
                is_deleted: true,
                updatedBy: request.user._id,
            });

            if (!deletedWord) return returnMessage('default');

            return deletedWord;
        } catch (error) {
            console.log('error in get harmfullwords', error);
            return error.message;
        }
    }

    async updateWord(id: string, updateWordDto: HarmfullWordDto, request: any): Promise<IWords> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.harmfulWords.write) {
                return returnMessage('permissionDenied');
            }

            let checkWord = await this.harmfullWordsModel.findOne({
                word: updateWordDto.word,
                is_deleted: false,
            });

            updateWordDto.updatedBy = request.user._id;

            if (checkWord) {
                return returnMessage('wordExists');
            }

            const existingWord = await this.harmfullWordsModel.findByIdAndUpdate(id, updateWordDto);

            if (!existingWord) return returnMessage('wordNotFound');

            return existingWord;
        } catch (error) {
            console.log('error in create harmfullword', error);
            return error.message;
        }
    }

    async DownloadExcel(request: any): Promise<IWords> {
        try {
            const queryConditions: any = {
                is_deleted: false,
                site: request.user.site,
            };

            const aggregationPipeline = [
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
                    $match: queryConditions,
                },
                {
                    $project: {
                        _id: 0,
                        word: 1,
                        row_id: 1,
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

            const data: any = await this.harmfullWordsModel.aggregate(aggregationPipeline);

            return this.optimiseExcel(data);
        } catch (error) {
            console.log('error in create harmfullword', error);
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
                return this.optimisedHarmFullXls(element);
            });
            return [].concat.apply([], updatedData);
        } catch (error) {
            console.log('error while exporting harmfull word data', error);
            return error.message;
        }
    }

    optimisedHarmFullXls(data: any[]): any {
        try {
            const newArrayData: any[] = [];
            data.forEach((element: any) => {
                let obj = {};
                obj['Id'] = element.row_id || '-';
                obj['Word'] = element.word || '-';
                obj['Updated'] = element.updatedAt
                    ? moment(element.updatedAt).tz('Israel').format('DD.MM.YYYY HH:mm')
                    : '-';
                if (element.updatedByAdmin) {
                    obj['Updated'] =
                        obj['Updated'] +
                        '\n' +
                        capitalizeFirstLetter(decrypt(element.updatedByAdmin.firstname)) +
                        ' ' +
                        capitalizeFirstLetter(decrypt(element.updatedByAdmin.lastname));
                } else {
                    obj['Updated'] =
                        obj['Updated'] +
                        '\n ' +
                        capitalizeFirstLetter(decrypt(element.updatedByUser.firstname)) +
                        ' ' +
                        capitalizeFirstLetter(decrypt(element.updatedByUser.lastname));
                }

                newArrayData.push(obj);
            });

            return newArrayData;
        } catch (error) {
            console.log('error while exporting harmfull word data', error);
            return error.message;
        }
    }
}
