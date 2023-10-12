import { Controller, Res, Req, Query, Post } from '@nestjs/common';
import { UtilService } from './util.service';
import { CustomError } from 'src/helpers/customError';
import * as XLSX from 'xlsx';

@Controller('api/v1/util')
export class UtilController {
    constructor(private readonly utilService: UtilService) {}

    @Post('/downloadExcel')
    async getExcel(@Req() request, @Query() query: any, @Res() response: any) {
        const exceldata = await this.utilService.getExcelData(request, query);
        if (typeof exceldata === 'string') throw new CustomError({ success: false, message: exceldata }, 400);
        const ws = XLSX.utils.json_to_sheet(exceldata);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet 1');

        // Generate the Excel file in memory
        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        // Set HTTP response headers
        response.setHeader('Content-Type', 'application/csv');
        response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        response.setHeader('Content-Disposition', 'attachment; filename=exported_data.xlsx');

        return response.send(buffer);
    }
}
