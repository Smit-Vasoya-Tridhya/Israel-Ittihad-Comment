import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserSchema } from './schema/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from 'src/role_permission/role.schema';
import { Admin, AdminSchema } from 'src/admin/admin.schema';
import { AuthorizationMiddleware } from 'src/auth.middleware';
import { ArticlePageUser, ArticlePageUserSchema } from './schema/article-page-user.schema';
import { SettingSchema, page_setting } from 'src/page-setting/page-setting.schema';
import { GoogleStrategy } from './google.strategy';
import { Comments, commentSchema } from 'src/comments/schema/comment.schema';
import { Page, PageSchema } from 'src/pages/pages.schema';

@Module({
    imports: [
        MongooseModule.forFeature(
            [
                { name: User.name, schema: UserSchema },
                { name: Role.name, schema: RoleSchema },
                { name: Admin.name, schema: AdminSchema },
                { name: page_setting.name, schema: SettingSchema },
                { name: Comments.name, schema: commentSchema },
                { name: Page.name, schema: PageSchema },
            ],
            'SYSTEM_DB',
        ),
        MongooseModule.forFeature([{ name: ArticlePageUser.name, schema: ArticlePageUserSchema }], 'ISRAEL_DB'),
        MongooseModule.forFeature([{ name: ArticlePageUser.name, schema: ArticlePageUserSchema }], 'ITTIHAD_DB'),
    ],
    exports: [UserService],
    controllers: [UserController],
    providers: [UserService, GoogleStrategy],
})
export class UserModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuthorizationMiddleware)
            .exclude(
                { path: '/api/v1/user/register', method: RequestMethod.POST },
                { path: '/api/v1/user/google-sign-in', method: RequestMethod.POST },
                { path: '/api/v1/user/redirect', method: RequestMethod.GET },
                { path: '/api/v1/user/login', method: RequestMethod.POST },
                { path: '/api/v1/user/verifyOtp', method: RequestMethod.POST },
                { path: '/api/v1/user/forgotPassword', method: RequestMethod.POST },
                { path: '/api/v1/user/resetPassword', method: RequestMethod.POST },
                {
                    path: '/api/v1/user/register-article-page',
                    method: RequestMethod.POST,
                },
                { path: '/api/v1/user/login-article-page', method: RequestMethod.POST },
                { path: '/api/v1/user/verify-otp-for-article', method: RequestMethod.POST },
                {
                    path: '/api/v1/user/forgot-password-article-page',
                    method: RequestMethod.POST,
                },
                {
                    path: '/api/v1/user/reset-password-article-page',
                    method: RequestMethod.POST,
                },
                {
                    path: '/api/v1/user/verify-account',
                    method: RequestMethod.GET,
                },
            )
            .forRoutes(UserController);
    }
}
