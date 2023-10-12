import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HistoryLogsService } from './history-logs.service';
import { HistoryLogsController } from './history-logs.controller';
import { AuthorizationMiddleware } from 'src/auth.middleware';
import { CommentsController } from 'src/comments/comments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoryLogs, HistoryLogsSchema } from './historyLogs.schema';
import { Admin, AdminSchema } from 'src/admin/admin.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Role, RoleSchema } from 'src/role_permission/role.schema';

@Module({
    imports: [
        MongooseModule.forFeature(
            [
                { name: HistoryLogs.name, schema: HistoryLogsSchema },
                { name: Admin.name, schema: AdminSchema },
                { name: User.name, schema: UserSchema },
                { name: Role.name, schema: RoleSchema },
            ],
            'SYSTEM_DB',
        ),
    ],
    exports: [HistoryLogsService],
    controllers: [HistoryLogsController],
    providers: [HistoryLogsService],
})
export class HistoryLogsModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthorizationMiddleware).forRoutes(CommentsController);
    }
}
