import { MiddlewareConsumer, Module, NestModule, RequestMethod, Post } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorizationMiddleware } from 'src/auth.middleware';
import { Comments, commentSchema } from './schema/comment.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Role, RoleSchema } from 'src/role_permission/role.schema';
import { Admin, AdminSchema } from 'src/admin/admin.schema';
import { CommentReplay, commentReplaySchema } from './schema/commentReplay.schema';
import { CommentLike, commentLikeSchema } from './schema/commentsLike.schema';
import { HistoryLogs, HistoryLogsSchema } from 'src/history-logs/historyLogs.schema';
import { HistoryLogsService } from 'src/history-logs/history-logs.service';
import { SettingSchema, page_setting } from 'src/page-setting/page-setting.schema';
import { ArticlePageUser, ArticlePageUserSchema } from 'src/user/schema/article-page-user.schema';
import { Page, PageSchema } from 'src/pages/pages.schema';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';
import { UserService } from 'src/user/user.service';

@Module({
    imports: [
        MongooseModule.forFeature(
            [
                { name: Admin.name, schema: AdminSchema },
                { name: Role.name, schema: RoleSchema },
                { name: User.name, schema: UserSchema },
                { name: Comments.name, schema: commentSchema },
                { name: CommentReplay.name, schema: commentReplaySchema },
                { name: CommentLike.name, schema: commentLikeSchema },
                { name: HistoryLogs.name, schema: HistoryLogsSchema },
                { name: page_setting.name, schema: SettingSchema },
                { name: Page.name, schema: PageSchema },
            ],
            'SYSTEM_DB',
        ),
        MongooseModule.forFeature([{ name: ArticlePageUser.name, schema: ArticlePageUserSchema }], 'ISRAEL_DB'),
        MongooseModule.forFeature([{ name: ArticlePageUser.name, schema: ArticlePageUserSchema }], 'ITTIHAD_DB'),
        RabbitmqModule,
    ],
    exports: [CommentsService],
    controllers: [CommentsController],
    providers: [CommentsService, HistoryLogsService, UserService],
})
export class CommentsModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthorizationMiddleware).forRoutes(CommentsController);
    }
}
