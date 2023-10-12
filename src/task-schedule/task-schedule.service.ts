import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import moment from 'moment-timezone';
import { Model } from 'mongoose';
import { CommentDocument, Comments } from 'src/comments/schema/comment.schema';
import { PageSettingDocument, page_setting } from 'src/page-setting/page-setting.schema';
import { Page, PageDocument } from 'src/pages/pages.schema';
import { UserService } from 'src/user/user.service';

@Injectable()
export class TaskScheduleService {
    constructor(
        @InjectModel(Comments.name, 'SYSTEM_DB')
        private readonly Comment_model: Model<CommentDocument>,
        @InjectModel(page_setting.name, 'SYSTEM_DB')
        private readonly Page_Setting_model: Model<PageSettingDocument>,
        @InjectModel(Page.name, 'SYSTEM_DB')
        private readonly Page_model: Model<PageDocument>,
        private readonly userService: UserService,
    ) {}

    // @Cron('0 */15 * * * *', {
    //     name: 'Comment Notification',
    //     timeZone: 'Israel',
    // })
    // async commentNotificationTaskSchedule() {
    //     try {
    //         console.log('Cron Job Started');
    //         const [comments, israelPageSetting, ittihadPageSetting] = await Promise.all([
    //             this.Comment_model.find({
    //                 createdAt: {
    //                     $gte: moment().tz('Israel').subtract(15, 'minutes'),
    //                     $lte: moment().tz('Israel'),
    //                 },
    //             })
    //                 .populate({ path: 'pageId', model: 'Page' })
    //                 .lean(),
    //             this.Page_Setting_model.findOne({ site: 'israelBackOffice' }).lean(),
    //             this.Page_Setting_model.findOne({ site: 'ittihadBackOffice' }).lean(),
    //         ]);

    //         let israelTableRow = `
    //         <tr>
    //             <td><b>#</b>
    //                 <b>Page Name</b>
    //                 <b>Page URL</b>
    //                 <b>No. of New Comments</b>
    //             </td>
    //         </tr>`;

    //         let ittihadTableRow = `
    //         <tr>
    //             <td><b>#</b></td>
    //             <td><b>Page Name</b></td>
    //             <td><b>Page URL</b></td>
    //             <td><b>No. of New Comments</b></td>
    //         </tr>`;

    //         const israelComments = comments.filter((comment) => comment['site'] === 'israel-today');
    //         const ittihadComments = comments.filter((comment) => comment['site'] === 'ittihad-today');

    //         israelComments.forEach((comment, index) => {
    //             let pageUrl: string, pageName: string, commentCount: number;

    //             pageUrl = comment['pageId']['isrealUrl'];
    //             pageName = comment['pageId']['israelPage'];
    //             commentCount = comments.filter(
    //                 (cc) => cc['site'] === 'israel-today' && cc['pageId']['_id'] == comment['pageId']['_id'],
    //             ).length;

    //             israelTableRow += `<tr>
    //                 <td>${index + 1}</td>
    //                 <td>${pageName}</td>
    //                 <td>${pageUrl}</td>
    //                 <td>${commentCount}</td>
    //             </tr>`;
    //         });

    //         ittihadComments.forEach((comment, index) => {
    //             let pageUrl: string, pageName: string, commentCount: number;

    //             pageUrl = comment['pageId']['ittihadUrl'];
    //             pageName = comment['pageId']['ittihadPage'];
    //             commentCount = comments.filter(
    //                 (cc) => cc['site'] === 'ittihad-today' && cc['pageId']['_id'] == comment['pageId']['_id'],
    //             ).length;

    //             ittihadTableRow += `<tr>
    //                 <td>${index + 1}</td>
    //                 <td>${pageName}</td>
    //                 <td>${pageUrl}</td>
    //                 <td>${commentCount}</td>
    //             </tr>`;
    //         });

    //         let israelEmails = israelPageSetting.pages_notifications[0];
    //         israelPageSetting.newcommit_email_message = israelPageSetting.newcommit_email_message.replaceAll(
    //             '{{comment_text}}',
    //             israelTableRow,
    //         );

    //         JSON.parse(israelEmails).map((email: string) => {
    //             this.userService.sendMail(
    //                 israelPageSetting.newpage_email_from,
    //                 email,
    //                 israelPageSetting.newpage_email_reply,
    //                 israelPageSetting.newpage_email_sub,
    //                 israelPageSetting.newpage_email_message,
    //             );
    //         });

    //         let ittihadEmails = ittihadPageSetting.pages_notifications[0];
    //         ittihadPageSetting.newcommit_email_message = ittihadPageSetting.newcommit_email_message.replaceAll(
    //             '{{comment_text}}',
    //             ittihadTableRow,
    //         );
    //         JSON.parse(ittihadEmails).map((email: string) => {
    //             this.userService.sendMail(
    //                 ittihadPageSetting.newpage_email_from,
    //                 email,
    //                 ittihadPageSetting.newpage_email_reply,
    //                 ittihadPageSetting.newpage_email_sub,
    //                 ittihadPageSetting.newpage_email_message,
    //             );
    //         });
    //     } catch (error) {
    //         console.log('error in the Comment notification task schedular', error);
    //     }
    // }
}
