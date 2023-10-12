import { Body, Controller, Post, Req, Res, Put, Param, Get } from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { CustomError } from 'src/helpers/customError';
import { returnMessage } from 'src/helpers/utils';
import { Request, Response } from 'express';
import { CreateSearchObjectDto } from 'src/common/search_object.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Artical Pages')
@Controller('api/v1/pages')
export class PagesController {
    constructor(private readonly PagesService: PagesService) {}

    @Post('createPage')
    async ceratePage(@Res() response: Response, @Req() request: Request, @Body() CreatePageDto: CreatePageDto) {
        const newPage = await this.PagesService.createPage(CreatePageDto, request);

        if (typeof newPage === 'string') throw new CustomError({ success: false, message: newPage }, 400);

        return response.status(200).json({
            success: true,
            message: returnMessage('pageAdded'),
            data: newPage,
        });
    }

    @Put('/updatePage/:id')
    async updatePage(
        @Res() response: Response,
        @Param('id') _id: string,
        @Body() CreatePageDto: CreatePageDto,
        @Req() request: Request,
    ) {
        const updatePage = await this.PagesService.updatepage(_id, CreatePageDto, request);

        if (typeof updatePage === 'string') throw new CustomError({ success: false, message: updatePage }, 400);

        return response.status(200).json({
            success: true,
            message: returnMessage('updatePage'),
            data: updatePage,
        });
    }

    @Post('/allPages')
    async getPages(@Res() response: Response, @Req() request: Request, @Body() searchObject: CreateSearchObjectDto) {
        const pageData = await this.PagesService.pageList(searchObject, request);

        return response.status(200).json({
            success: true,
            message: returnMessage('getAllPage'),
            data: pageData,
        });
    }

    @Get('/getPage/:id')
    async getWord(@Res() response: Response, @Req() request: Request, @Param('id') _id: string) {
        const existingWord = await this.PagesService.getPageByID(_id, request);

        if (typeof existingWord === 'string') throw new CustomError({ success: false, message: existingWord }, 400);

        return response.status(200).json({
            success: true,
            message: returnMessage('getPageById'),
            data: existingWord,
        });
    }
}
