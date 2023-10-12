import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ArticalPageService } from './artical-page.service';
import { ArticalPageController } from './artical-page.controller';
import { PageSettingService } from 'src/page-setting/page-setting.service';
import { HarmfullWordSchema, Harmfull_Word } from 'src/Harmfull-Word/harmfull-word.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Role, RoleSchema } from 'src/role_permission/role.schema';
import { Admin, AdminSchema } from 'src/admin/admin.schema';
import { SettingSchema, page_setting } from 'src/page-setting/page-setting.schema';
import { PageSettingModule } from 'src/page-setting/page-setting.module';
import { Comments, commentSchema } from 'src/comments/schema/comment.schema';
import { CommentsModule } from 'src/comments/comments.module';
import { ArticlePageUser, ArticlePageUserSchema } from 'src/user/schema/article-page-user.schema';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { CommentLike, commentLikeSchema } from 'src/comments/schema/commentsLike.schema';
import { CommentReplay, commentReplaySchema } from 'src/comments/schema/commentReplay.schema';

@Module({
    imports: [
        MongooseModule.forFeature(
            [
                { name: Harmfull_Word.name, schema: HarmfullWordSchema },
                { name: User.name, schema: UserSchema },
                { name: Role.name, schema: RoleSchema },
                { name: Admin.name, schema: AdminSchema },
                { name: page_setting.name, schema: SettingSchema },
                { name: Comments.name, schema: commentSchema },
                { name: CommentLike.name, schema: commentLikeSchema },
                { name: CommentReplay.name, schema: commentReplaySchema },
            ],
            'SYSTEM_DB',
        ),
        MongooseModule.forFeature([{ name: ArticlePageUser.name, schema: ArticlePageUserSchema }], 'ISRAEL_DB'),
        MongooseModule.forFeature([{ name: ArticlePageUser.name, schema: ArticlePageUserSchema }], 'ITTIHAD_DB'),
        PageSettingModule,
        CommentsModule,
    ],
    providers: [ArticalPageService, RabbitmqService],
    controllers: [ArticalPageController],
})
export class ArticalPageModule {}
