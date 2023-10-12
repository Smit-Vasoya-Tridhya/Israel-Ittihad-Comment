import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { HarmfullWordController } from './harmfull-word.controller';
import { HarmfullWordService } from './harmfull-word.service';
import { HarmfullWordSchema, Harmfull_Word } from './harmfull-word.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorizationMiddleware } from 'src/auth.middleware';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Role, RoleSchema } from 'src/role_permission/role.schema';
import { Admin, AdminSchema } from 'src/admin/admin.schema';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Harmfull_Word.name, schema: HarmfullWordSchema },
        { name: User.name, schema: UserSchema },
        { name: Role.name, schema: RoleSchema },
        { name: Admin.name, schema: AdminSchema },
      ],
      'SYSTEM_DB',
    ),
  ],
  exports: [HarmfullWordService],
  controllers: [HarmfullWordController],
  providers: [HarmfullWordService],
})
export class HarmfullWordModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthorizationMiddleware).forRoutes(HarmfullWordController);
  }
}
