import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PageSettingService } from './page-setting.service';
import { PageSettingController } from './page-setting.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingSchema, page_setting } from './page-setting.schema';
import { MulterModule } from '@nestjs/platform-express';
import { AuthorizationMiddleware } from 'src/auth.middleware';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Role, RoleSchema } from 'src/role_permission/role.schema';
import { Admin, AdminSchema } from 'src/admin/admin.schema';

@Module({
    imports: [
        MongooseModule.forFeature(
            [
                { name: page_setting.name, schema: SettingSchema },
                { name: User.name, schema: UserSchema },
                { name: Role.name, schema: RoleSchema },
                { name: Admin.name, schema: AdminSchema },
            ],
            'SYSTEM_DB',
        ),

        MulterModule.register({
            dest: 'files',
        }),
    ],
    exports: [PageSettingService],
    controllers: [PageSettingController],
    providers: [PageSettingService],
})
export class PageSettingModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthorizationMiddleware).exclude().forRoutes(PageSettingController);
    }
}
