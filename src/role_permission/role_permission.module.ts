import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RolePermissionController } from './role_permission.controller';
import { RolePermissionService } from './role_permission.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './role.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Admin, AdminSchema } from 'src/admin/admin.schema';
import { AuthorizationMiddleware } from 'src/auth.middleware';

@Module({
    imports: [
        MongooseModule.forFeature(
            [
                { name: Role.name, schema: RoleSchema },
                { name: User.name, schema: UserSchema },
                { name: Admin.name, schema: AdminSchema },
            ],
            'SYSTEM_DB',
        ),
    ],
    exports: [RolePermissionService],
    controllers: [RolePermissionController],
    providers: [RolePermissionService],
})
export class RolePermissionModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthorizationMiddleware).forRoutes(RolePermissionController);
    }
}
