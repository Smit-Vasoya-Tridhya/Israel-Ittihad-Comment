import { Module } from '@nestjs/common';
import { TaskScheduleService } from './task-schedule.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Page, PageSchema } from 'src/pages/pages.schema';
import { Comments, commentSchema } from 'src/comments/schema/comment.schema';
import { SettingSchema, page_setting } from 'src/page-setting/page-setting.schema';
import { UserModule } from 'src/user/user.module';

@Module({
    imports: [
        MongooseModule.forFeature(
            [
                { name: page_setting.name, schema: SettingSchema },
                { name: Comments.name, schema: commentSchema },
                { name: Page.name, schema: PageSchema },
            ],
            'SYSTEM_DB',
        ),
        UserModule,
    ],
    providers: [TaskScheduleService],
})
export class TaskScheduleModule {}
