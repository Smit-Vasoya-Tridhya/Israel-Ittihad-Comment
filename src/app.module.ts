import { Module, MiddlewareConsumer } from '@nestjs/common';
import morgan from 'morgan';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PageSettingModule } from './page-setting/page-setting.module';
import { AdminModule } from './admin/admin.module';
import { RolePermissionModule } from './role_permission/role_permission.module';
import { CommentsModule } from './comments/comments.module';
import { HarmfullWordModule } from './Harmfull-Word/harmfull-word.module';
import { HistoryLogsModule } from './history-logs/history-logs.module';
import { PagesModule } from './pages/pages.module';
import { UtilModule } from './util/util.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { ArticalPageModule } from './artical-page/artical-page.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskScheduleModule } from './task-schedule/task-schedule.module';
dotenv.config();

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', '../public'),
            serveRoot: '/public/',
        }),
        MongooseModule.forRoot(process.env.SYSTEM_DB, {
            connectionName: 'SYSTEM_DB',
        }),
        MongooseModule.forRoot(process.env.ISRAEL_DB, {
            connectionName: 'ISRAEL_DB',
        }),
        MongooseModule.forRoot(process.env.ITTIHAD_DB, {
            connectionName: 'ITTIHAD_DB',
        }),
        MailerModule.forRoot({
            transport: {
                host: 'smtp.gmail.com',
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD,
                },
            },
        }),
        PageSettingModule,
        HarmfullWordModule,
        UserModule,
        AdminModule,
        RolePermissionModule,
        PagesModule,
        CommentsModule,
        HistoryLogsModule,
        UtilModule,
        RabbitmqModule,
        ArticalPageModule,
        ScheduleModule.forRoot(),
        TaskScheduleModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(morgan('short')).forRoutes('*');
    }
}
