import { Injectable } from '@nestjs/common';
import { HarmfullWordService } from 'src/Harmfull-Word/harmfull-word.service';
import { AdminService } from 'src/admin/admin.service';
import { CommentsService } from 'src/comments/comments.service';
import { returnMessage } from 'src/helpers/utils';
import { HistoryLogsService } from 'src/history-logs/history-logs.service';
import { PagesService } from 'src/pages/pages.service';
import { RolePermissionService } from 'src/role_permission/role_permission.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class UtilService {
    constructor(
        private readonly harmfulWordService: HarmfullWordService,
        private readonly adminService: AdminService,
        private readonly userService: UserService,
        private readonly roleService: RolePermissionService,
        private readonly pageService: PagesService,
        private readonly commentService: CommentsService,
        private readonly historyService: HistoryLogsService,
    ) {}

    async getExcelData(request: any, query: any) {
        try {
            if (query.excel === 'harmfullWord') {
                const permissions = request.user.permissions;
                if (!permissions.harmfulWords.write) {
                    return returnMessage('permissionDenied');
                }
                return await this.harmfulWordService.DownloadExcel(request);
            } else if (query.excel === 'user') {
                const permissions = request.user.permissions;
                if (!permissions.users.read) return returnMessage('permissionDenied');
                return this.userService.downloadExcel(request);
            } else if (query.excel === 'admin') {
                const permissions = request.user.permissions;
                if (!permissions.systemAdmins.read) {
                    return returnMessage('permissionDenied');
                }
                return await this.adminService.downloadExcel(request);
            } else if (query.excel === 'role') {
                const permissions = request.user.permissions;
                if (!permissions.systemAdmins.write) {
                    return returnMessage('permissionDenied');
                }
                return await this.roleService.downloadExcel(request);
            } else if (query.excel === 'page') {
                const permissions = request.user.permissions;
                if (!permissions.pages.read) {
                    return returnMessage('permissionDenied');
                }
                return await this.pageService.downloadExcel(request);
            } else if (query.excel === 'comment') {
                const permissions = request.user.permissions;
                if (!permissions.systemAdmins.read) {
                    return returnMessage('permissionDenied');
                }
                return await this.commentService.downloadExcel(request);
            } else if (query.excel === 'pagehistoryLogs') {
                return await this.historyService.downloadExcel(request, 'pages', query.id);
            } else if (query.excel === 'commenthistoryLogs') {
                return await this.historyService.downloadExcel(request, 'comments', query.id);
            }
        } catch (error) {
            console.log('error in getting excel ', error);
            return error.message;
        }
    }
}
