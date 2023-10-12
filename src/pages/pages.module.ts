import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { AuthorizationMiddleware } from 'src/auth.middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { Page, PageSchema } from './pages.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Role, RoleSchema } from 'src/role_permission/role.schema';
import { Admin, AdminSchema } from 'src/admin/admin.schema';
import { Comments, commentSchema } from 'src/comments/schema/comment.schema';
import { HistoryLogsService } from 'src/history-logs/history-logs.service';
import { HistoryLogs, HistoryLogsSchema } from 'src/history-logs/historyLogs.schema';
import { SettingSchema, page_setting } from 'src/page-setting/page-setting.schema';
import { PageSettingModule } from 'src/page-setting/page-setting.module';
import { UserModule } from 'src/user/user.module';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';

@Module({
    imports: [
        MongooseModule.forFeature(
            [
                { name: Page.name, schema: PageSchema },
                { name: User.name, schema: UserSchema },
                { name: Role.name, schema: RoleSchema },
                { name: Admin.name, schema: AdminSchema },
                { name: Comments.name, schema: commentSchema },
                { name: HistoryLogs.name, schema: HistoryLogsSchema },
                { name: page_setting.name, schema: SettingSchema },
            ],
            'SYSTEM_DB',
        ),
        PageSettingModule,
        UserModule,
        RabbitmqModule,
    ],
    exports: [PagesService],
    controllers: [PagesController],
    providers: [PagesService, HistoryLogsService],
})
export class PagesModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthorizationMiddleware).forRoutes(PagesController);
    }
}
