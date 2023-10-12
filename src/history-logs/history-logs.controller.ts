import { Body, Controller, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { HistoryLogsService } from './history-logs.service';
import { Response } from 'express';
import { CustomError } from 'src/helpers/customError';
import { CreateSearchObjectDto } from 'src/common/search_object.dto';

@Controller('api/v1/historyLogs')
export class HistoryLogsController {
    constructor(private historyLogsService: HistoryLogsService) {}

    @Post('/getHistoryLogs/:id')
    async getHistoryLogs(
        @Body() searchObject: CreateSearchObjectDto,
        @Res() response: Response,
        @Param('id') logId: string,
    ) {
        try {
            let getHistoryLogs = await this.historyLogsService.getHistoryLogs(searchObject, logId);

            if (typeof getHistoryLogs === 'string')
                throw new CustomError({ success: false, message: getHistoryLogs }, 400);

            return response.status(HttpStatus.OK).json({
                success: true,
                data: getHistoryLogs,
            });
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: err.message,
            });
        }
    }
}
