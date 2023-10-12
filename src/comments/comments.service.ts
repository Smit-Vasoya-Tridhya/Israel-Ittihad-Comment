import mongoose, { Model } from 'mongoose';
import { decrypt, encrypt } from './../helpers/encrypt-decrypt';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comments } from './schema/comment.schema';
import { IComment } from 'src/interfaces/comments.interface';
import { CreateCommentDto } from './dto/comment.dto';
import { capitalizeFirstLetter, getKeywordType, paginationObject, returnMessage } from 'src/helpers/utils';
import { CreateCommentReplayDto } from './dto/commentReplay.dto';
import { CommentReplay } from './schema/commentReplay.schema';
import { ICommentRep } from 'src/interfaces/commentRep.interface';
import { CreateSearchObjectDto } from 'src/common/search_object.dto';
import { CommentLike } from './schema/commentsLike.schema';
import { decryptArrayOfObject } from 'src/helpers/encrypt-decrypt';
import { page_setting } from 'src/page-setting/page-setting.schema';
import { IPage } from 'src/page-setting/setting.interface';
import { HistoryLogsService } from 'src/history-logs/history-logs.service';
import { ArticlePageUser, ArticlePageUserDocument } from 'src/user/schema/article-page-user.schema';
import { Page, PageDocument } from 'src/pages/pages.schema';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { UserService } from 'src/user/user.service';
import moment from 'moment-timezone';

@Injectable()
export class CommentsService {
    constructor(
        @InjectModel(Comments.name, 'SYSTEM_DB') private commentModel: Model<IComment>,
        @InjectModel(CommentLike.name, 'SYSTEM_DB') private CommentLikeModel: Model<IComment>,
        @InjectModel(Page.name, 'SYSTEM_DB') private pageModel: Model<PageDocument>,
        @InjectModel(CommentReplay.name, 'SYSTEM_DB') private commentReplayModel: Model<ICommentRep>,
        @InjectModel(ArticlePageUser.name, 'ISRAEL_DB') private israelUserModel: Model<ArticlePageUserDocument>,
        @InjectModel(ArticlePageUser.name, 'ITTIHAD_DB') private ittihadUserModel: Model<ArticlePageUserDocument>,
        @InjectModel(page_setting.name, 'SYSTEM_DB') private PageSettingModel: Model<IPage>,
        private historyLogsService: HistoryLogsService,
        private readonly rabbitmqService: RabbitmqService,
        private readonly userService: UserService,
    ) {
        // this.rabbitmqService.connect();
    }

    // create a new comment
    async createComment(commentsData: CreateCommentDto, request: any, pageId: string): Promise<any> {
        try {
            // console.log(request.user._id);
            // if (request.user._id) {
            //     this.rabbitmqService.publish(
            //         request.user._id.toString(),
            //         request.user
            //             ? `${decrypt(request.user.firstname)} ${decrypt(request.user.lastname)} is typing...`
            //             : 'Anonymous User is typing...',
            //     );
            //     this.rabbitmqService.subscribe(request.user._id.toString());
            // }

            if (request.headers.authorization && request.headers.authorization.startsWith('Bearer')) {
                const token = request.headers.authorization.split(' ')[1];
                const user = await this.userService.verifyArticlePageAuthToken(token);
                if (typeof user === 'string') return user;
                request['user'] = user;
            }

            const pageSettings: any = await this.PageSettingModel.findOne({
                site: commentsData.site === 'israel-today' ? 'israelBackOffice' : 'ittihadBackOffice',
            });

            if (pageSettings && pageSettings.mustLogin === true) {
                if (!request.user || !request.user._id) {
                    return returnMessage('mustLogin');
                }
            }

            let pageExists = await this.pageModel.findById(pageId);

            if (!pageExists) {
                return returnMessage('pageNotFound');
            } else {
                commentsData.pageId = pageId;
            }

            let oldRowID: any = await this.commentModel.find().sort({ row_id: -1 });
            if (oldRowID.length === 0) {
                commentsData['row_id'] = 1;
            } else {
                commentsData['row_id'] = oldRowID[0].row_id + 1;
            }

            let findIsraelUser: any;
            let findIttihadUser: any;

            if (request.user?._id) {
                findIsraelUser = await this.israelUserModel.findById(request.user._id).lean();

                if (findIsraelUser) {
                    commentsData.site = 'israel-today';
                    commentsData.userId = findIsraelUser._id;
                }

                findIttihadUser = await this.ittihadUserModel.findById(request.user._id).lean();

                if (findIttihadUser) {
                    commentsData.site = 'ittihad-today';
                    commentsData.userId = findIttihadUser._id;
                }

                if (!findIttihadUser && !findIsraelUser) {
                    commentsData.site = commentsData.site;
                }
            }

            // if (pageSettings) {
            //     pageSettings.newcommit_email_message = pageSettings.newcommit_email_message.replaceAll(
            //         '{{site_name}}',
            //         pageSettings.site,
            //     );

            //     pageSettings.newcommit_email_message = pageSettings.newcommit_email_message.replaceAll(
            //         '{{user_full_name}}',
            //         findIsraelUser
            //             ? decrypt(findIsraelUser.name)
            //             : findIttihadUser
            //             ? decrypt(findIttihadUser.name)
            //             : 'Anonymous User',
            //     );

            //     pageSettings.newcommit_email_message = pageSettings.newcommit_email_message.replaceAll(
            //         '{{comment_text}}',
            //         commentsData.originalComment,
            //     );
            // }

            // let emails = JSON.parse(pageSettings.comment_notifications);

            // let queue = commentsData.site === 'israel-today' ? 'israel_comments' : 'ittihad_comments';

            // emails.map(async (item: any) => {
            //     let queueData = {
            //         toEmail: item,
            //         fromEmail: pageSettings.newcommit_email_from,
            //         emailSubject: pageSettings.newcommit_email_sub,
            //         html: pageSettings.newcommit_email_message,
            //         replyToEmail: pageSettings.newcommit_email_reply,
            //     };
            //     await this.rabbitmqService.sendMessage(queue, queueData);
            // });

            // await this.rabbitmqService.receiveMessage(queue, async (message, channel) => {
            //     let emailData = JSON.parse(message);

            //     try {
            //         await this.userService.sendMail(
            //             emailData.fromEmail,
            //             emailData.toEmail,
            //             emailData.replyToEmail,
            //             emailData.emailSubject,
            //             emailData.html,
            //         );
            //     } catch (error) {
            //         console.error('Error sending email:', error);
            //     }
            // });
            const site = commentsData.site === 'israel-today' ? 'israelBackOffice' : 'ittihadBackOffice';
            const totalPendings = await this.userService.pendingCounts({ site });
            this.rabbitmqService.publish(`UpdatedCount:${site}`, JSON.stringify(totalPendings));

            return await this.commentModel.create(commentsData);
        } catch (error) {
            console.log('error while add comment', error);
            return error.message;
        }
    }

    // add comment replay
    async createCommentReplay(commentId: string, commentsData: CreateCommentReplayDto, request: any): Promise<any> {
        try {
            if (request.headers.authorization && request.headers.authorization.startsWith('Bearer')) {
                const token = request.headers.authorization.split(' ')[1];
                const user = await this.userService.verifyArticlePageAuthToken(token);
                if (typeof user === 'string') return user;
                request['user'] = user;
            }

            const pageSettings: any = await this.PageSettingModel.findOne({
                site: commentsData.site === 'israel-today' ? 'israelBackOffice' : 'ittihadBackOffice',
            });

            if (pageSettings && pageSettings.mustLogin === true) {
                if (!request.user || !request.user._id) {
                    return returnMessage('mustLogin');
                }
            }
            //find comment
            const commentExist: any = await this.commentModel.findById(commentId);
            if (!commentExist) return returnMessage('commentNotExist');

            //add replay.commentReplay
            commentsData.commentId = commentId;
            if (request.user?._id) {
                commentsData.userId = request.user._id;
            } else {
                commentsData.ip = commentsData.ip;
            }
            const replyComment = await this.commentReplayModel.create(commentsData);

            // get array from comments.commentReplay
            let array = commentExist.replyComments;
            array.push(replyComment._id);

            //update the comment replay array
            let addNewData = await this.commentModel.findByIdAndUpdate(commentExist._id, commentExist);

            return addNewData;
        } catch (error) {
            console.log('error while replay the comment', error);
            return error.message;
        }
    }

    // get all comments
    async getAllCommentsData(searchObject: CreateSearchObjectDto, request: any, query: any): Promise<any> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.systemAdmins.read) {
                return returnMessage('permissionDenied');
            }

            let queryObject: any;
            let pagination: any = paginationObject(searchObject);

            queryObject = {
                site: request.user.site === 'israelBackOffice' ? 'israel-today' : 'ittihad-today',
            };

            if (pagination.sort.updatedBy) {
                pagination['sort'] = {
                    'updatedByAdmin.firstname': pagination.sort.updatedBy,
                    'updatedByUser.firstname': pagination.sort.updatedBy,
                };
            }

            if (pagination.sort.pageData) {
                pagination['sort'] = {
                    pageData: pagination.sort.pageData,
                };
            }

            if (query.pageId) {
                queryObject['pageId'] = new mongoose.Types.ObjectId(query.pageId);
            }

            if (query.userId) {
                queryObject['userId'] = new mongoose.Types.ObjectId(query.userId);
            }

            if (searchObject.search && searchObject.search !== '') {
                queryObject['$or'] = [
                    { status: { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
                    { originalComment: { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
                    { pageData: { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
                    {
                        'updatedByAdmin.firstname': {
                            $regex: encrypt(searchObject.search.toLocaleLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'updatedByAdmin.lastname': {
                            $regex: encrypt(searchObject.search.toLocaleLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'updatedByUser.firstname': {
                            $regex: encrypt(searchObject.search.toLocaleLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'updatedByUser.lastname': {
                            $regex: encrypt(searchObject.search.toLocaleLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'updatedByUser.fullname': {
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
                        from: 'commentreplays',
                        localField: 'replyComments',
                        foreignField: '_id',
                        as: 'replyComments',
                    },
                },
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
                    $lookup: {
                        from: 'pages',
                        localField: 'pageId',
                        foreignField: '_id',
                        as: 'pageData',
                        pipeline: [{ $project: { israelPage: 1, ittihadPage: 1 } }],
                    },
                },
                { $unwind: '$pageData' },
                {
                    $project: {
                        _id: 1,
                        row_id: 1,
                        originalComment: 1,
                        updatedComment: 1,
                        site: 1,
                        status: 1,
                        fullname: 1,
                        pageData: {
                            $cond: {
                                if: { $eq: ['$site', 'israel-today'] },
                                then: '$pageData.israelPage',
                                else: '$pageData.ittihadPage',
                            },
                        },
                        createdAt: 1,
                        updatedAt: 1,
                        approvalDate: 1,
                        userId: 1,
                        pageId: 1,
                        like: 1,
                        likeCount: { $size: '$like' },
                        replyComments: {
                            $map: {
                                input: '$replyComments',
                                as: 'reply',
                                in: {
                                    commentReplay: '$$reply.commentReplay',
                                    likeCount: { $size: '$$reply.like' },
                                    like: '$$reply.like',
                                    _id: '$$reply._id',
                                },
                            },
                        },
                        totalReplay: { $size: '$replyComments' },
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
                {
                    $match: queryObject,
                },
            ];

            let allCommentsData = await this.commentModel.aggregate(pipeline).sort(pagination.sort);

            let users: any[];

            if (request.user.site === 'israelBackOffice') {
                users = await this.israelUserModel.find().select('name').lean();
            } else if (request.user.site === 'ittihadBackOffice') {
                users = await this.ittihadUserModel.find().select('name').lean();
            }

            allCommentsData.map((comment: any) => {
                if (comment.userId) {
                    let user = users.find((user) => user._id.toString() === comment.userId.toString());
                    if (user) {
                        comment.name = decrypt(user.name);
                    }
                } else {
                    comment.name = 'Anonymous';
                }
            });

            // let pageData = await this.commentModel.aggregate(pipeline);
            // let pageCount = Math.ceil(pageData.length / pagination.resultPerPage);

            allCommentsData = decryptArrayOfObject(allCommentsData, [
                'firstname',
                'lastname',
                'updatedByAdmin',
                'updatedByUser',
            ]);

            if (searchObject.sortField === 'name') {
                if (searchObject.sortOrder === 'asc') {
                    allCommentsData = allCommentsData.sort((a, b) => a.name.localeCompare(b.name));
                } else {
                    allCommentsData = allCommentsData.sort((a, b) => b.name.localeCompare(a.name));
                }
            }
            const page = pagination.page; // Page number (1-based)
            const pageSize = pagination.resultPerPage; // Number of users per page

            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;

            return {
                allCommentsData: allCommentsData.slice(startIndex, endIndex),
                pageCount: Math.ceil(allCommentsData.length / pagination.resultPerPage) || 0,
            };
        } catch (error) {
            console.log(error, 'error while loading comments');
            return error.message;
        }
    }

    //update comments data
    async updateCommentsData(commentId: string, commentsData: CreateCommentDto, request: any): Promise<any> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.systemAdmins.write) {
                return returnMessage('permissionDenied');
            }

            if (!commentId) {
                return returnMessage('idRequired');
            }

            if (commentsData.originalComment) delete commentsData.originalComment;

            if (commentsData.status === 'approved') {
                commentsData.updatedBy = request.user._id;
                commentsData.approvalDate = new Date();
            }

            let updateData = await this.commentModel.findByIdAndUpdate(commentId, commentsData);

            if (!updateData) {
                return returnMessage('CommentNotFound');
            }

            if (commentsData.status || commentsData.updatedComment) {
                let historyLogsData = {
                    logId: commentId,
                    method: 'Update',
                    data: commentsData,
                    site: updateData.site,
                    updatedBy: request.user._id,
                    module: 'comments',
                };

                await this.historyLogsService.addHistoryLog(historyLogsData);
            }

            const site = updateData.site === 'israel-today' ? 'israelBackOffice' : 'ittihadBackOffice';
            const totalPendings = await this.userService.pendingCounts({ site });
            this.rabbitmqService.publish(`UpdatedCount:${site}`, JSON.stringify(totalPendings));
            const articlePageSite = updateData.site === 'israel-today' ? 'israel' : 'ittihad';
            this.rabbitmqService.publish(`${updateData.pageId}:${articlePageSite}`, 'Comment Updated');

            return updateData;
        } catch (error) {
            console.log(error, 'Getting error while updating comments');
            return error.message;
        }
    }

    //update like of comment
    async createLike(query: any, commentsData: CreateCommentDto, request: any): Promise<any> {
        try {
            if (request.headers.authorization && request.headers.authorization.startsWith('Bearer')) {
                const token = request.headers.authorization.split(' ')[1];
                const user = await this.userService.verifyArticlePageAuthToken(token);
                if (typeof user === 'string') return user;
                request['user'] = user;
            }

            let createLike: any, commentExist: any;
            if (request.user?._id) {
                commentsData.userId = request.user?._id;
            } else {
                commentsData.ip = commentsData.ip;
            }

            if (commentsData.like === true) {
                commentExist = await this.commentModel.findById(query.commentId);
                let newModel: any = this.commentModel;

                if (!commentExist) {
                    commentExist = await this.commentReplayModel.findById(query.commentId);
                    newModel = this.commentReplayModel;
                }

                if (!commentExist) return returnMessage('commentNotExist');

                let array = commentExist.like;

                commentsData.commentId = query.commentId;

                createLike = await this.CommentLikeModel.create(commentsData);

                if (createLike) {
                    array.push(createLike._id);
                    await newModel.findByIdAndUpdate(query.commentId, commentExist);
                }

                return { likeCount: commentExist.like.length || 0, like: true };
            } else {
                let pipeline = [
                    {
                        $lookup: {
                            from: 'commentlikes',
                            localField: 'like',
                            foreignField: '_id',
                            as: 'replyComments',
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            like: 1,
                            replyComments: {
                                $map: {
                                    input: '$replyComments',
                                    as: 'reply',
                                    in: {
                                        like: '$$reply.like',
                                        userId: '$$reply.userId',
                                        commentId: '$$reply.commentId',
                                        _id: '$$reply._id',
                                    },
                                },
                            },
                        },
                    },
                    {
                        $match: { _id: new mongoose.Types.ObjectId(query.commentId) },
                    },
                ];

                commentExist = await this.commentModel.aggregate(pipeline);
                let newModel: any = this.commentModel;

                if (commentExist.length === 0) {
                    commentExist = await this.commentReplayModel.aggregate(pipeline);
                    newModel = this.commentReplayModel;
                }

                if (commentExist.length === 0) return returnMessage('commentNotExist');

                let obj = {
                    commentId: query.commentId,
                };

                if (request.user?._id) {
                    obj['userId'] = request.user._id;
                } else {
                    obj['ip'] = commentsData.ip;
                }

                let likeId = await this.CommentLikeModel.findOne(obj);

                commentExist[0].like = commentExist[0].like.filter(
                    (item: any) => item._id.toString() !== likeId._id.toString(),
                );

                createLike = await newModel.findByIdAndUpdate(query.commentId, commentExist[0]);

                await this.CommentLikeModel.deleteOne(likeId._id, { like: false });

                return { likeCount: commentExist[0].like.length || 0, like: false };
            }
        } catch (error) {
            console.log(error, 'Getting error while updating Like');
            return error.message;
        }
    }

    //Get comment By ID
    async getCommentByID(commentId: string, request: any): Promise<any> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.systemAdmins.read) {
                return returnMessage('permissionDenied');
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
                    $lookup: {
                        from: 'pages',
                        localField: 'pageId',
                        foreignField: '_id',
                        as: 'pageData',
                        pipeline: [{ $project: { israelPage: 1, ittihadPage: 1, ittihadUrl: 1, isrealUrl: 1 } }],
                    },
                },
                { $unwind: '$pageData' },
                {
                    $match: { _id: new mongoose.Types.ObjectId(commentId) },
                },
                {
                    $project: {
                        _id: 1,
                        row_id: 1,
                        originalComment: 1,
                        updatedComment: 1,
                        site: 1,
                        status: 1,
                        pageData: 1,
                        userId: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        approvalDate: 1,
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

            let findComment: any = await this.commentModel.aggregate(pipeline);

            let findUser: any;
            if (findComment[0].userId) {
                findUser = await this.ittihadUserModel.findById(findComment[0].userId).lean();

                if (!findUser) {
                    findUser = await this.israelUserModel.findById(findComment[0].userId).lean();
                }
            }

            if (findUser) {
                findComment.map((item: any) => {
                    item['name'] = decrypt(findUser.name);
                    item['ip'] = findUser.ip;
                    item['email'] = decrypt(findUser.email);
                });
            }

            if (!findComment) {
                return returnMessage('CommentNotFound');
            }

            return decryptArrayOfObject(findComment, ['firstname', 'lastname', 'updatedByAdmin', 'updatedByUser']);
        } catch (error) {
            console.log(error, 'error while loading comments');
            return error.message;
        }
    }

    async downloadExcel(request: any) {
        try {
            let queryObject: any = {
                site: request.user.site === 'israelBackOffice' ? 'israel-today' : 'ittihad-today',
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
                    $lookup: {
                        from: 'pages',
                        localField: 'pageId',
                        foreignField: '_id',
                        as: 'pageData',
                        pipeline: [{ $project: { israelPage: 1, ittihadPage: 1 } }],
                    },
                },
                { $unwind: '$pageData' },
                {
                    $project: {
                        _id: 0,
                        row_id: 1,
                        originalComment: 1,
                        site: 1,
                        status: 1,
                        userId: 1,
                        ip: 1,
                        pageData: {
                            $cond: {
                                if: { $eq: ['$site', 'israel-today'] },
                                then: '$pageData.israelPage',
                                else: '$pageData.ittihadPage',
                            },
                        },
                        createdAt: 1,
                        approvalDate: 1,
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
                {
                    $match: queryObject,
                },
            ];
            let allCommentsData: any = await this.commentModel.aggregate(pipeline);

            let users: any[];

            if (request.user.site === 'israelBackOffice') {
                users = await this.israelUserModel.find().select('name').lean();
            } else if (request.user.site === 'ittihadBackOffice') {
                users = await this.ittihadUserModel.find().select('name').lean();
            }

            allCommentsData.map((comment: any) => {
                if (comment.userId) {
                    let user = users.find((user) => user._id.toString() === comment.userId.toString());
                    if (user) comment.userName = decrypt(user.name);
                } else {
                    comment.userName = 'Anonymous';
                }
            });

            // for (let i = 0; i < allCommentsData.length; i++) {
            //     let findUser: any;
            //     let model = request.user.site === 'israelBackOffice' ? this.israelUserModel : this.ittihadUserModel;
            //     if (allCommentsData[i].userId) {
            //         findUser = await model.findById(allCommentsData[i].userId).lean();

            //         allCommentsData['name'] = decrypt(findUser.name);
            //     }
            // }

            return this.optimiseExcel(allCommentsData);
        } catch (error) {
            console.log(error, 'error while loading comments');
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
                return this.optimisedCommnetXls(element);
            });
            return [].concat.apply([], updatedData);
        } catch (error) {
            console.log('error while exporting Comments data', error);
            return error.message;
        }
    }

    optimisedCommnetXls(data: any[]): any {
        try {
            const newArrayData: any[] = [];
            data.forEach((element: any) => {
                let obj = {};
                obj['Id'] = element.row_id || '-';
                if (element.status) {
                    if (element.status === 'approved') obj['Status'] = 'Approved';
                    else if (element.status === 'pending') obj['Status'] = 'In-Active';
                    else if (element.status === 'notApproved') obj['Status'] = 'Deleted';
                } else obj['Status'] = '-';

                obj['Site'] = element.site === 'israel-today' ? 'Israel-Today' : 'Ittihad-Today';
                obj['User'] = capitalizeFirstLetter(element.userName) || '-';
                obj['Page name'] = element.pageData;
                obj['Comment'] = element.originalComment || '-';
                obj['Submit date'] = element.createdAt
                    ? moment(element.createdAt).tz('Israel').format('DD.MM.YYYY HH:mm')
                    : '-';
                obj['Approval date'] = element.approvalDate
                    ? moment(element.approvalDate).tz('Israel').format('DD.MM.YYYY HH:mm')
                    : '-';

                if (element.updatedByAdmin) {
                    obj['Approval admin'] =
                        capitalizeFirstLetter(decrypt(element?.updatedByAdmin?.firstname)) +
                            ' ' +
                            capitalizeFirstLetter(decrypt(element?.updatedByAdmin?.lastname)) || '-';
                } else if (element.updatedByUser) {
                    obj['Approval admin'];
                    capitalizeFirstLetter(decrypt(element?.updatedByUser?.firstname)) +
                        ' ' +
                        capitalizeFirstLetter(decrypt(element?.updatedByUser?.lastname)) || '-';
                }
                newArrayData.push(obj);
            });

            return newArrayData;
        } catch (error) {
            console.log('error while exporting Comments data', error);
            return error.message;
        }
    }
}
