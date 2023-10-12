import { Injectable } from '@nestjs/common';
import { Page } from './pages.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CreatePageDto } from './dto/create-page.dto';
import { capitalizeFirstLetter, getKeywordType, paginationObject, returnMessage } from 'src/helpers/utils';
import mongoose, { Model } from 'mongoose';
import { updatePageDto } from './dto/update-page.dto';
import { CreateSearchObjectDto } from 'src/common/search_object.dto';
import { decrypt, decryptArrayOfObject, encrypt } from 'src/helpers/encrypt-decrypt';
import { Comments } from 'src/comments/schema/comment.schema';
import { HistoryLogsService } from 'src/history-logs/history-logs.service';
import { PageSettingService } from 'src/page-setting/page-setting.service';
import { UserService } from 'src/user/user.service';
import { PageSettingDocument, page_setting } from 'src/page-setting/page-setting.schema';
import moment from 'moment-timezone';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
@Injectable()
export class PagesService {
    constructor(
        @InjectModel(Page.name, 'SYSTEM_DB') private readonly pageModel: Model<any>,
        @InjectModel(Comments.name, 'SYSTEM_DB') private readonly commentsModel: Model<any>,
        @InjectModel(page_setting.name, 'SYSTEM_DB') private readonly pageSettingModel: Model<PageSettingDocument>,
        private historyLogsService: HistoryLogsService,
        private readonly userService: UserService,
        private readonly rabbitmqService: RabbitmqService,
    ) {}

    async createPage(createPageDto: CreatePageDto, request: any) {
        try {
            const permissions = request.user.permissions;
            if (!permissions.harmfulWords.write) {
                return returnMessage('permissionDenied');
            }

            if (request.user.site === 'israelBackOffice') {
                if (createPageDto.ittihadPage) delete createPageDto.ittihadPage;
                if (createPageDto.ittihadUrl) delete createPageDto.ittihadUrl;
                if (createPageDto.ittihadStatus) delete createPageDto.ittihadStatus;
                if (createPageDto.ittihadPageScript) delete createPageDto.ittihadPageScript;
                createPageDto.israelPage = request.body.pageName;
                createPageDto.isrealUrl = request.body.pageUrl;
                createPageDto.israelStatus = request.body.status;
                // createPageDto.israelPageScript = request.body.embeddedScript;
                createPageDto.israelPageCreatedBy = request.user._id;
                createPageDto.israelPageUpdatedBy = request.user._id;
                createPageDto.israelPublishBy = request.user._id;
                createPageDto.israelPublishDate = Date.now();

                // let pageSetting: any = await this.pageSettingService.getAllPage(request);

                // if (
                //     !pageSetting ||
                //     pageSetting[0].newpage_email_from === '' ||
                //     pageSetting[0].newpage_email_reply === '' ||
                //     pageSetting[0].newpage_email_sub === '' ||
                //     pageSetting[0].newpage_email_message === ''
                // )
                //     return returnMessage('resetEmailTemplateNotAvailable');
                // this.userService.sendMail(
                //     createPageDto.isrealUrl,
                //     pageSetting[0].newpage_email_from,
                //     pageSetting[0].newpage_email_reply,
                //     pageSetting[0].newpage_email_sub,
                //     pageSetting[0].newpage_email_message,
                // );
            } else if (request.user.site === 'ittihadBackOffice') {
                if (createPageDto.israelPage) delete createPageDto.israelPage;
                if (createPageDto.isrealUrl) delete createPageDto.isrealUrl;
                if (createPageDto.israelStatus) delete createPageDto.israelStatus;
                createPageDto.ittihadPage = request.body.pageName;
                createPageDto.ittihadUrl = request.body.pageUrl;
                createPageDto.ittihadStatus = request.body.status;
                // createPageDto.ittihadPageScript = request.body.embeddedScript;

                createPageDto.ittihadPageCreatedBy = request.user._id;
                createPageDto.ittihadPageUpdatedBy = request.user._id;
                createPageDto.ittihadPublishBy = request.user._id;
                createPageDto.ittihadPublishDate = Date.now();
                // let pageSetting: any = this.pageSettingService.getAllPage(request);
            }

            let oldRowID: any = await this.pageModel.find().sort({ row_id: -1 });

            if (oldRowID.length === 0) {
                createPageDto['row_id'] = 1;
            } else {
                createPageDto['row_id'] = oldRowID[0].row_id + 1;
            }

            let createPageData = await this.pageModel.create(createPageDto);

            let historyLogsData = {
                logId: createPageData._id,
                method: 'create',
                data: 'Page Was Created',
                site: request.user.site === 'israelBackOffice' ? 'israel-today' : 'ittihad-today',
                updatedBy: request.user._id,
                module: 'pages',
            };

            await this.historyLogsService.addHistoryLog(historyLogsData);

            await this.newPageEmailNotification(request.user.site, createPageDto);

            if (request.user.site === 'israelBackOffice') {
                createPageData.israelPageScript = `<div id="app"></div>
                <div name="page_id" id ="${createPageData._id}" for="israel" page_url="${createPageData.isrealUrl}"></div>
                <script src="https://cdn.jsdelivr.net/gh/DCP121/article-pages@524f2df867eab9aaa6ce38e5df32af5b23a0acdc/index.js"></script>
                `;
            } else if (request.user.site === 'ittihadBackOffice') {
                createPageData.ittihadPageScript = `<div id="app"></div>
                <div name="page_id" id ="${createPageData._id}" for="ittihad" page_url="${createPageData.ittihadUrl}></div>
                <script src="https://cdn.jsdelivr.net/gh/DCP121/article-pages@524f2df867eab9aaa6ce38e5df32af5b23a0acdc/index.js"></script>`;
            }
            await createPageData.save();

            const site = request.user.site;
            const totalPendings = await this.userService.pendingCounts({ site });
            this.rabbitmqService.publish(`UpdatedCount:${site}`, JSON.stringify(totalPendings));
            return createPageData;
        } catch (error) {
            console.log('error in create Page', error);
            return error.message;
        }
    }

    async newPageEmailNotification(site: string, createPageDto: object): Promise<any> {
        const pageSetting = await this.pageSettingModel.findOne({ site }).lean();

        if (
            pageSetting.newpage_email_message === '' ||
            pageSetting.newpage_email_from === '' ||
            pageSetting.newpage_email_sub === '' ||
            pageSetting.newpage_email_reply === ''
        )
            return returnMessage('newPageEmailTemplateNotAvailable');

        let pageUrl: string = createPageDto['isrealUrl'];

        if (site === 'ittihadBackOffice' && createPageDto['ittihadUrl']) pageUrl = createPageDto['ittihadUrl'];

        pageSetting.newpage_email_message = pageSetting.newpage_email_message.replaceAll('{{page_url}}', pageUrl);

        let emails = pageSetting.pages_notifications[0];
        JSON.parse(emails).map((email: string) => {
            this.userService.sendMail(
                pageSetting.newpage_email_from,
                email,
                pageSetting.newpage_email_reply,
                pageSetting.newpage_email_sub,
                pageSetting.newpage_email_message,
            );
        });

        return true;
    }

    async updatepage(id: string, updatePageDto: updatePageDto, request: any): Promise<any> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.pages.write) {
                return returnMessage('permissionDenied');
            }

            if (request.user.site === 'israelBackOffice') {
                if (updatePageDto.ittihadPage) delete updatePageDto.ittihadPage;
                if (updatePageDto.ittihadUrl) delete updatePageDto.ittihadUrl;
                if (updatePageDto.ittihadStatus) delete updatePageDto.ittihadStatus;
                if (updatePageDto.israelPageScript) delete updatePageDto.israelPageScript;
                updatePageDto.israelPage = request.body.pageName;
                updatePageDto.isrealUrl = request.body.pageUrl;
                updatePageDto.israelStatus = request.body.status;
                updatePageDto.israelPageCreatedBy = request.user._id;
                updatePageDto.israelPageUpdatedBy = request.user._id;
            } else if (request.user.site === 'ittihadBackOffice') {
                if (updatePageDto.israelPage) delete updatePageDto.israelPage;
                if (updatePageDto.isrealUrl) delete updatePageDto.isrealUrl;
                if (updatePageDto.israelStatus) delete updatePageDto.israelStatus;
                if (updatePageDto.ittihadPageScript) delete updatePageDto.ittihadPageScript;
                updatePageDto.ittihadPage = request.body.pageName;
                updatePageDto.ittihadUrl = request.body.pageUrl;
                updatePageDto.ittihadStatus = request.body.status;
                updatePageDto.ittihadPageCreatedBy = request.user._id;
                updatePageDto.ittihadPageUpdatedBy = request.user._id;
            }

            if (request.user.site === 'israelBackOffice') {
                updatePageDto.israelPageScript = `<script src="https://cdn.jsdelivr.net/gh/DCP121/article-pages@524f2df867eab9aaa6ce38e5df32af5b23a0acdc/index.js"></script>
                <div name="page_id" id ="${id}" for="israel"></div>`;
            } else if (request.user.site === 'ittihadBackOffice') {
                updatePageDto.ittihadPageScript = `<script src="https://cdn.jsdelivr.net/gh/DCP121/article-pages@524f2df867eab9aaa6ce38e5df32af5b23a0acdc/index.js"></script>
                <div name="page_id" id ="${id}" for="ittihad"></div>`;
            }

            const updatedPage = await this.pageModel.findByIdAndUpdate(id, updatePageDto, { new: true });
            let historyLogsData = {
                logId: updatedPage._id,
                method: 'update',
                data: request.body,
                site: request.user.site === 'israelBackOffice' ? 'israel-today' : 'ittihad-today',
                updatedBy: request.user._id,
                module: 'pages',
            };

            await this.historyLogsService.addHistoryLog(historyLogsData);

            if (!updatedPage) return returnMessage('pageNotFound');

            const site = request.user.site;
            const totalPendings = await this.userService.pendingCounts({ site });
            this.rabbitmqService.publish(`UpdatedCount:${site}`, JSON.stringify(totalPendings));
            return updatedPage;
        } catch (error) {
            console.log('error in updating Page', error);
            return error.message;
        }
    }

    async pageList(searchObject: CreateSearchObjectDto, request: any) {
        try {
            const permissions = request.user.permissions;
            if (!permissions.pages.read) {
                return returnMessage('permissionDenied');
            }

            const pagination: any = paginationObject(searchObject);
            const queryConditions: any = {
                is_deleted: false,
                // site: request.user.site,
            };

            if (searchObject.search && searchObject.search !== '') {
                queryConditions['$or'] = [
                    { israelStatus: { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
                    { ittihadStatus: { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
                    { israelPage: { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
                    { ittihadPage: { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
                    { israelPublishDate: { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
                    {
                        ittihadPublishDate: {
                            $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''),
                            $options: 'i',
                        },
                    },
                    {
                        israelCommentCount: {
                            $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''),
                            $options: 'i',
                        },
                    },
                    {
                        ittihadCommentCount: {
                            $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''),
                            $options: 'i',
                        },
                    },
                    {
                        'israelUpdatedByAdmin.firstname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'israelUpdatedByAdmin.lastname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'israelUpdatedByAdmin.fullname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'ittihadUpdatedByAdmin.firstname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'ittihadUpdatedByAdmin.lastname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'ittihadUpdatedByAdmin.fullname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'israelUpdatedByUser.firstname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'israelUpdatedByUser.lastname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'israelUpdatedByUser.fullname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'ittihadUpdatedByUser.firstname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'ittihadUpdatedByUser.lastname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'ittihadUpdatedByUser.fullname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                ];

                const keywordType = getKeywordType(searchObject.search);
                if (keywordType === 'number') {
                    const numericKeyword = parseInt(searchObject.search);
                    queryConditions['$or'].push({ row_id: numericKeyword });
                    queryConditions['$or'].push({ isrealCommentsCount: numericKeyword });
                    queryConditions['$or'].push({ ittihadCommentCount: numericKeyword });
                } else if (keywordType === 'date') {
                    const dateKeyword = new Date(searchObject.search);
                    queryConditions['$or'].push({ israelPublishDate: dateKeyword });
                    queryConditions['$or'].push({ ittihadPublishDate: dateKeyword });
                }
            }

            const aggregationPipeline = [
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'israelPublishBy',
                        foreignField: '_id',
                        as: 'israelUpdatedByAdmin',
                        pipeline: [{ $project: { firstname: 1, lastname: 1, fullname: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'israelPublishBy',
                        foreignField: '_id',
                        as: 'israelUpdatedByUser',
                        pipeline: [{ $project: { firstname: 1, lastname: 1, fullname: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'ittihadPublishBy',
                        foreignField: '_id',
                        as: 'ittihadUpdatedByAdmin',
                        pipeline: [{ $project: { firstname: 1, lastname: 1, fullname: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'ittihadPublishBy',
                        foreignField: '_id',
                        as: 'ittihadUpdatedByUser',
                        pipeline: [{ $project: { firstname: 1, lastname: 1, fullname: 1 } }],
                    },
                },
                {
                    $match: queryConditions,
                },
                {
                    $project: {
                        row_id: 1,
                        israelStatus: 1,
                        is_deleted: 1,
                        ittihadStatus: 1,
                        israelPage: 1,
                        ittihadPage: 1,
                        ittihadCommentCount: 1,
                        isrealCommentsCount: 1,
                        israelPublishDate: 1,
                        ittihadPublishDate: 1,
                        israelPageCreatedBy: 1,
                        israelPageUpdatedBy: 1,
                        ittihadPageCreatedBy: 1,
                        ittihadPageUpdatedBy: 1,
                        fullname: 1,
                        israelUpdatedByAdmin: {
                            $cond: {
                                if: { $eq: [{ $size: '$israelUpdatedByAdmin' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$israelUpdatedByAdmin', 0] },
                            },
                        },
                        israelUpdatedByUser: {
                            $cond: {
                                if: { $eq: [{ $size: '$israelUpdatedByUser' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$israelUpdatedByUser', 0] },
                            },
                        },
                        ittihadUpdatedByAdmin: {
                            $cond: {
                                if: { $eq: [{ $size: '$ittihadUpdatedByAdmin' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$ittihadUpdatedByAdmin', 0] },
                            },
                        },
                        ittihadUpdatedByUser: {
                            $cond: {
                                if: { $eq: [{ $size: '$ittihadUpdatedByUser' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$ittihadUpdatedByUser', 0] },
                            },
                        },
                    },
                },
            ];

            const commentsPipeline = [
                {
                    $group: {
                        _id: {
                            pageId: '$pageId',
                            site: '$site',
                        },
                        commentCount: { $sum: 1 }, // Count comments for each page and site
                    },
                },
            ];

            const commentCounts = await this.commentsModel.aggregate(commentsPipeline);

            const pageData = await this.pageModel
                .aggregate(aggregationPipeline)
                .sort(pagination.sort)
                .skip(pagination.skip)

                .limit(pagination.resultPerPage);

            // Combine comment counts with page data
            let pageDataWithCommentCounts = pageData.map((page) => {
                const israelCommentCount = commentCounts.find(
                    (cc) => cc?._id?.pageId?.equals(page._id) && cc?._id?.site === 'israel-today',
                );

                const ittihadCommentCount = commentCounts.find(
                    (cc) => cc?._id?.pageId?.equals(page._id) && cc?._id?.site === 'ittihad-today',
                );

                return {
                    ...page,
                    israelCommentCount: israelCommentCount ? israelCommentCount.commentCount : 0,
                    ittihadCommentCount: ittihadCommentCount ? ittihadCommentCount.commentCount : 0,
                };
            });

            if (pagination.sort.ittihadCommentCount) {
                if (pagination.sort.ittihadCommentCount >= 1) {
                    function sortAscendingPrice(a: any, b: any) {
                        return a.ittihadCommentCount - b.ittihadCommentCount;
                    }
                    pageDataWithCommentCounts.sort(sortAscendingPrice);
                } else {
                    function sortDescendingPrice(a: any, b: any) {
                        return b.ittihadCommentCount - a.ittihadCommentCount;
                    }
                    pageDataWithCommentCounts.sort(sortDescendingPrice);
                }
            }

            if (pagination.sort.israelCommentCount) {
                if (pagination.sort.israelCommentCount >= 1) {
                    function sortAscendingPrice(a: any, b: any) {
                        return a.israelCommentCount - b.israelCommentCount;
                    }
                    pageDataWithCommentCounts.sort(sortAscendingPrice);
                } else {
                    function sortDescendingPrice(a: any, b: any) {
                        return b.israelCommentCount - a.israelCommentCount;
                    }
                    pageDataWithCommentCounts.sort(sortDescendingPrice);
                }
            }

            if (!pageDataWithCommentCounts) return returnMessage('pageNotFound');

            const pageCount = await this.pageModel.aggregate(aggregationPipeline);

            return {
                pageCount: Math.ceil(pageCount.length / pagination.resultPerPage) || 0,
                pageData: decryptArrayOfObject(pageDataWithCommentCounts, [
                    'israelUpdatedByAdmin',
                    'israelUpdatedByUser',
                    'ittihadUpdatedByAdmin',
                    'ittihadUpdatedByUser',
                    'firstname',
                    'lastname',
                ]),
            };
        } catch (error) {
            console.log('error in getting  Page', error);
            return error.message;
        }
    }

    async getPageByID(id: string, request: any) {
        try {
            const permissions = request.user.permissions;
            if (!permissions.pages.read) {
                return returnMessage('permissionDenied');
            }
            const queryConditions: any = {
                _id: new mongoose.Types.ObjectId(id),
                is_deleted: false,
            };
            const aggregationPipeline = [
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'israelPublishBy',
                        foreignField: '_id',
                        as: 'israelUpdatedByAdmin',
                        pipeline: [{ $project: { firstname: 1, lastname: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'israelPublishBy',
                        foreignField: '_id',
                        as: 'israelUpdatedByUser',
                        pipeline: [{ $project: { firstname: 1, lastname: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'ittihadPublishBy',
                        foreignField: '_id',
                        as: 'ittihadUpdatedByAdmin',
                        pipeline: [{ $project: { firstname: 1, lastname: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'ittihadPublishBy',
                        foreignField: '_id',
                        as: 'ittihadUpdatedByUser',
                        pipeline: [{ $project: { firstname: 1, lastname: 1 } }],
                    },
                },
                {
                    $match: queryConditions,
                },
                {
                    $project: {
                        row_id: 1,
                        israelStatus: 1,
                        is_deleted: 1,
                        ittihadStatus: 1,
                        israelPage: 1,
                        ittihadPage: 1,
                        isrealComments: 1,
                        ittihadComments: 1,
                        israelPublishDate: 1,
                        ittihadPublishDate: 1,
                        israelPageCreatedBy: 1,
                        israelPageUpdatedBy: 1,
                        ittihadPageCreatedBy: 1,
                        ittihadPageUpdatedBy: 1,
                        ittihadPageScript: 1,
                        israelPageScript: 1,
                        isrealUrl: 1,
                        ittihadUrl: 1,
                        israelUpdatedByAdmin: {
                            $cond: {
                                if: { $eq: [{ $size: '$israelUpdatedByAdmin' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$israelUpdatedByAdmin', 0] },
                            },
                        },
                        israelUpdatedByUser: {
                            $cond: {
                                if: { $eq: [{ $size: '$israelUpdatedByUser' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$israelUpdatedByUser', 0] },
                            },
                        },
                        ittihadUpdatedByAdmin: {
                            $cond: {
                                if: { $eq: [{ $size: '$ittihadUpdatedByAdmin' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$ittihadUpdatedByAdmin', 0] },
                            },
                        },
                        ittihadUpdatedByUser: {
                            $cond: {
                                if: { $eq: [{ $size: '$ittihadUpdatedByUser' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$ittihadUpdatedByUser', 0] },
                            },
                        },
                    },
                },
            ];

            const existingPage = await this.pageModel.aggregate(aggregationPipeline);

            const commentsPipeline = [
                {
                    $group: {
                        _id: {
                            pageId: '$pageId',
                            site: '$site',
                        },
                        commentCount: { $sum: 1 }, // Count comments for each page and site
                    },
                },
            ];

            const commentCounts = await this.commentsModel.aggregate(commentsPipeline);

            // Combine comment counts with page data
            const pageDataWithCommentCounts = existingPage.map((page) => {
                const israelCommentCount = commentCounts.find(
                    (cc) => cc?._id?.pageId.equals(page?._id) && cc?._id?.site === 'israel-today',
                );
                const ittihadCommentCount = commentCounts.find(
                    (cc) => cc?._id?.pageId.equals(page?._id) && cc?._id?.site === 'ittihad-today',
                );
                return {
                    ...page,
                    israelCommentCount: israelCommentCount ? israelCommentCount.commentCount : 0,
                    ittihadCommentCount: ittihadCommentCount ? ittihadCommentCount.commentCount : 0,
                };
            });
            if (!pageDataWithCommentCounts) return returnMessage('pageNotFound');

            return {
                pageData: decryptArrayOfObject(pageDataWithCommentCounts, [
                    'israelUpdatedByAdmin',
                    'israelUpdatedByAdmin',
                    'israelUpdatedByUser',
                    'ittihadUpdatedByAdmin',
                    'ittihadUpdatedByUser',
                    'firstname',
                    'lastname',
                ]),
            };
        } catch (error) {
            console.log('error in get Page', error);
            return error.message;
        }
    }

    async downloadExcel(request: any): Promise<any> {
        try {
            const queryConditions: any = {
                is_deleted: false,
                // site: request.user.site,
            };

            const aggregationPipeline = [
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'israelPublishBy',
                        foreignField: '_id',
                        as: 'israelUpdatedByAdmin',
                        pipeline: [{ $project: { firstname: 1, lastname: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'israelPublishBy',
                        foreignField: '_id',
                        as: 'israelUpdatedByUser',
                        pipeline: [{ $project: { firstname: 1, lastname: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'ittihadPublishBy',
                        foreignField: '_id',
                        as: 'ittihadUpdatedByAdmin',
                        pipeline: [{ $project: { firstname: 1, lastname: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'ittihadPublishBy',
                        foreignField: '_id',
                        as: 'ittihadUpdatedByUser',
                        pipeline: [{ $project: { firstname: 1, lastname: 1 } }],
                    },
                },
                {
                    $match: queryConditions,
                },
                {
                    $project: {
                        _id: 0,
                        row_id: 1,
                        israelStatus: 1,
                        ittihadStatus: 1,
                        israelPage: 1,
                        ittihadPage: 1,
                        ittihadCommentCount: 1,
                        isrealCommentsCount: 1,
                        israelPublishDate: 1,
                        ittihadPublishDate: 1,
                        israelUpdatedByAdmin: {
                            $cond: {
                                if: { $eq: [{ $size: '$israelUpdatedByAdmin' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$israelUpdatedByAdmin', 0] },
                            },
                        },
                        israelUpdatedByUser: {
                            $cond: {
                                if: { $eq: [{ $size: '$israelUpdatedByUser' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$israelUpdatedByUser', 0] },
                            },
                        },
                        ittihadUpdatedByAdmin: {
                            $cond: {
                                if: { $eq: [{ $size: '$ittihadUpdatedByAdmin' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$ittihadUpdatedByAdmin', 0] },
                            },
                        },
                        ittihadUpdatedByUser: {
                            $cond: {
                                if: { $eq: [{ $size: '$ittihadUpdatedByUser' }, 0] },
                                then: '$$REMOVE',
                                else: { $arrayElemAt: ['$ittihadUpdatedByUser', 0] },
                            },
                        },
                    },
                },
            ];

            const commentsPipeline = [
                {
                    $group: {
                        _id: {
                            pageId: '$pageId',
                            site: '$site',
                        },
                        commentCount: { $sum: 1 }, // Count comments for each page and site
                    },
                },
            ];

            const commentCounts = await this.commentsModel.aggregate(commentsPipeline);

            const pageData = await this.pageModel.aggregate(aggregationPipeline);

            // Combine comment counts with page data
            let pageDataWithCommentCounts = pageData.map((page) => {
                const israelCommentCount = commentCounts.find(
                    (cc) => cc?._id?.pageId?.equals(page._id) && cc?._id?.site === 'israel-today',
                );

                const ittihadCommentCount = commentCounts.find(
                    (cc) => cc?._id?.pageId?.equals(page._id) && cc?._id?.site === 'ittihad-today',
                );

                return {
                    ...page,
                    israelCommentCount: israelCommentCount ? israelCommentCount.commentCount : 0,
                    ittihadCommentCount: ittihadCommentCount ? ittihadCommentCount.commentCount : 0,
                };
            });
            if (!pageDataWithCommentCounts) return returnMessage('pageNotFound');

            return this.optimiseExcel(pageDataWithCommentCounts);
        } catch (error) {
            console.log('error in getting page', error);
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
                return this.optimisedPageXls(element);
            });
            return [].concat.apply([], updatedData);
        } catch (error) {
            console.log('error while exporting pages data', error);
            return error.message;
        }
    }

    optimisedPageXls(data: any[]): any {
        try {
            const newArrayData: any[] = [];
            data.forEach((element: any) => {
                let obj = {};
                obj['Id'] = element.row_id || '-';

                if (element.israelStatus) {
                    if (element.israelStatus === 'active') obj['Israel T status'] = 'Active';
                    else if (element.israelStatus === 'pending') obj['Israel T status'] = 'Pending';
                    else if (element.israelStatus === 'notApproved') obj['Israel T status'] = 'Not-Approved';
                } else obj['Israel T status'] = '-';

                obj['Israel T page'] = element.israelPage || '-';
                obj['Israel T comments'] = element.israelCommentCount;
                obj['Israel T publish date'] = element.israelPublishDate
                    ? moment(element.israelPublishDate).tz('Israel').format('DD.MM.YYYY HH:mm')
                    : '-';

                if (element.israelUpdatedByAdmin) {
                    obj['Israel T publish date'] =
                        obj['Israel T publish date'] +
                        '\n' +
                        capitalizeFirstLetter(decrypt(element.israelUpdatedByAdmin.firstname)) +
                        ' ' +
                        capitalizeFirstLetter(decrypt(element.israelUpdatedByAdmin.lastname));
                } else if (element.israelUpdatedByUser) {
                    obj['Israel T publish date'] =
                        obj['Israel T publish date'] +
                        '\n' +
                        capitalizeFirstLetter(decrypt(element.israelUpdatedByUser.firstname)) +
                        ' ' +
                        capitalizeFirstLetter(decrypt(element.israelUpdatedByUser.lastname));
                }

                if (element.ittihadStatus) {
                    if (element.ittihadStatus === 'active') obj['Ittihad T status'] = 'Active';
                    else if (element.ittihadStatus === 'pending') obj['Ittihad T status'] = 'In-Active';
                    else if (element.ittihadStatus === 'notApproved') obj['Ittihad T status'] = 'Deleted';
                } else obj['Ittihad T status'] = '-';

                obj['Ittihad T page'] = element.israelPage;
                obj['Ittihad T comments'] = element.ittihadCommentCount;
                obj['Ittihad T publish date'] = element.ittihadPublishDate
                    ? moment(element.ittihadPublishDate).tz('Israel').format('DD.MM.YYYY HH:mm')
                    : '-';

                if (element.ittihadUpdatedByAdmin) {
                    obj['Ittihad T publish date'] =
                        obj['Ittihad T publish date'] +
                        '\n' +
                        capitalizeFirstLetter(decrypt(element.ittihadUpdatedByAdmin.firstname)) +
                        ' ' +
                        capitalizeFirstLetter(decrypt(element.ittihadUpdatedByAdmin.lastname));
                } else if (element.ittihadUpdatedByUser) {
                    obj['Ittihad T publish date'] =
                        obj['Ittihad T publish date'] +
                        '\n' +
                        capitalizeFirstLetter(decrypt(element.ittihadUpdatedByUser.firstname)) +
                        ' ' +
                        capitalizeFirstLetter(decrypt(element.ittihadUpdatedByUser.lastname));
                }

                newArrayData.push(obj);
            });

            return newArrayData;
        } catch (error) {
            console.log('error while exporting pages data', error);
            return error.message;
        }
    }
}
