import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Comments } from 'src/comments/schema/comment.schema';
import { CommentReplay } from 'src/comments/schema/commentReplay.schema';
import { CommentLike } from 'src/comments/schema/commentsLike.schema';
import { decrypt, encrypt } from 'src/helpers/encrypt-decrypt';
import { getKeywordType, paginationObject } from 'src/helpers/utils';
import { ICommentRep } from 'src/interfaces/commentRep.interface';
import { IComment } from 'src/interfaces/comments.interface';
import { page_setting } from 'src/page-setting/page-setting.schema';
import { IPage } from 'src/page-setting/setting.interface';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { ArticlePageUser, ArticlePageUserDocument } from 'src/user/schema/article-page-user.schema';

@Injectable()
export class ArticalPageService {
    constructor(
        @InjectModel(page_setting.name, 'SYSTEM_DB') private PageSettingModel: Model<IPage>,
        @InjectModel(CommentLike.name, 'SYSTEM_DB') private CommentLikeModel: Model<IComment>,
        @InjectModel(Comments.name, 'SYSTEM_DB') private commentModel: Model<IComment>,
        @InjectModel(ArticlePageUser.name, 'ISRAEL_DB') private israelUserModel: Model<ArticlePageUserDocument>,
        @InjectModel(ArticlePageUser.name, 'ITTIHAD_DB') private ittihadUserModel: Model<ArticlePageUserDocument>,
        @InjectModel(CommentReplay.name, 'SYSTEM_DB') private commentReplayModel: Model<ICommentRep>,
        private readonly rabbitmqService: RabbitmqService,
    ) {
        this.rabbitmqService.connect();
    }

    async getArticlePage(request: any, pageId: any, searchObject: any, userId: any, site: any) {
        try {
            if (request.user?._id) {
                this.rabbitmqService.publish(
                    request.user._id.toString(),
                    request.user
                        ? `${decrypt(request.user.firstname)} ${decrypt(request.user.lastname)} is typing...`
                        : 'Anonymous User is typing...',
                );
                this.rabbitmqService.subscribe(request.user._id.toString());
            }
            // this.rabbitmqService.publish('abcd:2', 'Abcd2 is typing...');

            let pagePipeline = {
                _id: 1,
                top_banner_image: 1,
                logo_image: 1,
                login_image: 1,
                top_title: 1,
                sub_title: 1,
                footer_text: 1,
                terms_privacy_policy: 1,
                pipeline: 1,
                mustLogin: 1,
                google_client_id: 1,
            };
            const pageData = await this.PageSettingModel.findOne({ site: site }).select(pagePipeline).lean();

            let queryObject: any;
            let pagination: any = paginationObject(searchObject);

            queryObject = {
                site: site === 'israelBackOffice' ? 'israel-today' : 'ittihad-today',
                status: 'approved',
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

            if (pageId) {
                queryObject['pageId'] = new mongoose.Types.ObjectId(pageId);
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
                        _id: 1,
                        row_id: 1,
                        originalComment: 1,
                        updatedComment: 1,
                        site: 1,
                        ip: 1,
                        status: 1,
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
                        likeCount: { $size: '$like' },
                        replyComments: {
                            $map: {
                                input: '$replyComments',
                                as: 'reply',
                                in: {
                                    id: '$$reply._id',
                                    site: '$$reply.site',
                                    ip: '$$reply.ip',
                                    userId: '$$reply.userId',
                                    commentReplay: '$$reply.commentReplay',
                                    likeCount: { $size: '$$reply.like' },
                                    createdAt: '$$reply.createdAt',
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

            let allCommentsData = await this.commentModel
                .aggregate(pipeline)
                .sort({ updatedAt: -1 })
                .skip(pagination.skip)
                .limit(pagination.resultPerPage);

            let users: any[];
            if (userId !== '') {
                queryObject['userId'] = new mongoose.Types.ObjectId(userId);
                queryObject['status'] = 'pending';
            } else {
                queryObject['status'] = 'pending';
                queryObject['ip'] = searchObject.ip;
            }
            let userComment = await this.commentModel.aggregate(pipeline).sort({ updatedAt: -1 });

            if (site === 'israelBackOffice') {
                users = await this.israelUserModel.find().lean();
            } else if (site === 'ittihadBackOffice') {
                users = await this.ittihadUserModel.find().lean();
            }

            let obj = {};
            if (userId) {
                obj['userId'] = userId;
            } else {
                obj['ip'] = searchObject.ip;
            }
            let likeData: any = await this.CommentLikeModel.find(obj).lean();

            allCommentsData = userComment.concat(allCommentsData);

            allCommentsData.forEach(async (comment: any) => {
                if (comment.userId) {
                    let user = users.find((user) => user._id.toString() === comment.userId.toString());

                    if (user) {
                        comment.name = decrypt(user.name);
                        comment.image = user.loggedInViaGoogle ? user.image : undefined;
                    }
                }

                likeData.map((like: any) => {
                    if (like.userId) {
                        if (
                            like.commentId.toString() === comment._id.toString() &&
                            like.userId.toString() === comment.userId.toString()
                        )
                            return (comment['like'] = true);
                        else return (comment['like'] = false);
                    } else if (like.ip) {
                        if (like.commentId.toString() === comment._id.toString() && like.ip === comment.ip)
                            return (comment['like'] = true);
                        else return (comment['like'] = false);
                    }
                });

                comment.replyComments.map(async (item: any) => {
                    if (item.userId) {
                        let user = users.find((user) => user._id.toString() === item.userId?.toString());
                        if (user) {
                            item['name'] = decrypt(user.name);
                            item.image = user.loggedInViaGoogle ? user.image : undefined;
                        }
                    }

                    likeData.map((like: any) => {
                        if (like.userId) {
                            if (
                                like.commentId.toString() === item.id.toString() &&
                                like.userId.toString() === item.userId.toString()
                            )
                                return (item['like'] = true);
                            else return (item['like'] = false);
                        } else if (like.ip) {
                            if (like.commentId.toString() === item.id.toString() && like.ip === item.ip)
                                return (item['like'] = true);
                            else return (item['like'] = false);
                        }
                    });
                });
            });

            let totalComment = allCommentsData.length;

            return {
                pageData,
                allCommentsData,
                totalComment: totalComment,
            };
        } catch (error) {
            console.log('error in create article Page', error);
            return error.message;
        }
    }
}
