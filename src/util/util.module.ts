import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from 'src/admin/admin.schema';
import { Role, RoleSchema } from 'src/role_permission/role.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { UtilController } from './util.controller';
import { UtilService } from './util.service';
import { UserModule } from 'src/user/user.module';
import { AdminModule } from 'src/admin/admin.module';
import { AuthorizationMiddleware } from 'src/auth.middleware';
import { RolePermissionModule } from 'src/role_permission/role_permission.module';
import { Page, PageSchema } from 'src/pages/pages.schema';
import { PagesModule } from 'src/pages/pages.module';
import { CommentsModule } from 'src/comments/comments.module';
import { HistoryLogsModule } from 'src/history-logs/history-logs.module';
import { HarmfullWordSchema, Harmfull_Word } from 'src/Harmfull-Word/harmfull-word.schema';
import { HarmfullWordModule } from 'src/Harmfull-Word/harmfull-word.module';

@Module({
    imports: [
        MongooseModule.forFeature(
            [
                { name: Harmfull_Word.name, schema: HarmfullWordSchema },
                { name: User.name, schema: UserSchema },
                { name: Role.name, schema: RoleSchema },
                { name: Admin.name, schema: AdminSchema },
                { name: Role.name, schema: RoleSchema },
                { name: Page.name, schema: PageSchema },
            ],
            'SYSTEM_DB',
        ),
        HarmfullWordModule,
        UserModule,
        AdminModule,
        RolePermissionModule,
        PagesModule,
        CommentsModule,
        HistoryLogsModule,
    ],
    controllers: [UtilController],
    providers: [UtilService],
})
export class UtilModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthorizationMiddleware).forRoutes(UtilController);
    }
}
