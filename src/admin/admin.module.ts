import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from './admin.schema';
import { Role, RoleSchema } from 'src/role_permission/role.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { AuthorizationMiddleware } from 'src/auth.middleware';

@Module({
    imports: [
        MongooseModule.forFeature(
            [
                { name: Admin.name, schema: AdminSchema },
                { name: Role.name, schema: RoleSchema },
                { name: User.name, schema: UserSchema },
            ],
            'SYSTEM_DB',
        ),
    ],
    exports: [AdminService],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthorizationMiddleware).forRoutes(AdminController);
    }
}
