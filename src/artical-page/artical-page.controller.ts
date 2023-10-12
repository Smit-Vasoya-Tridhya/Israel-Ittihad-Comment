import { Body, Controller, Get, Param, Post, Query, Req, Res } from '@nestjs/common';
import { ArticalPageService } from './artical-page.service';
import { CustomError } from 'src/helpers/customError';
import { returnMessage } from 'src/helpers/utils';
import { CreateSearchObjectDto } from 'src/common/search_object.dto';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { Request, Response } from 'express';
@Controller('api/v1/artical-page')
export class ArticalPageController {
    constructor(
        private readonly articleService: ArticalPageService,
        private readonly rabbitmqService: RabbitmqService,
    ) {
        this.rabbitmqService.connect();
    }
    @Post('articalPage')
    async getPage(
        @Req() request: Request,
        @Query('pageId') pageId: any,
        @Res() response: Response,
        @Body() searchObject: CreateSearchObjectDto,
        @Query('userId') userId: any,
        @Query('site') site: any,
    ) {
        const pagedata = await this.articleService.getArticlePage(request, pageId, searchObject, userId, site);
        if (typeof pagedata === 'string') throw new CustomError({ success: false, message: pagedata }, 400);
        return response.status(200).json({
            success: true,
            message: 'test',
            data: pagedata,
        });
    }
}
