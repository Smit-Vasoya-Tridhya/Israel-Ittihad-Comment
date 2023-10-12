import { Controller, UseInterceptors, Body, Get, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { PageSettingService } from './page-setting.service';
import { PageSettingDto } from './settingDto/PageSetting.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express/multer';
import { diskStorage } from 'multer';
import { Put, Req, UploadedFiles } from '@nestjs/common/decorators';
import { CustomError } from 'src/helpers/customError';
import { returnMessage } from 'src/helpers/utils';
import { ApiTags } from '@nestjs/swagger';
import { unlink } from 'fs/promises';

@Controller('/api/v1/pageSetting')
@ApiTags('Page Settings')
export class PageSettingController {
    constructor(private readonly PageService: PageSettingService) {}

    @Post('/createPage')
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'top_banner_image', maxCount: 1 },
                { name: 'login_image', maxCount: 1 },
                { name: 'logo_image', maxCount: 1 },
            ],
            {
                storage: diskStorage({
                    destination: './public/uploads',
                    filename: (req, file, cb) => {
                        const allowedExtensions = ['.png', '.jpg', '.jpeg'];
                        const fileExtension = '.' + file.originalname.split('.').pop().toLowerCase();

                        if (allowedExtensions.includes(fileExtension)) {
                            const filename = Date.now() + fileExtension;
                            cb(null, filename);
                        } else {
                            return returnMessage('invalidImage');
                        }
                    },
                }),
            },
        ),
    )
    async createPage(
        @Res() response,
        @Req() req,
        @UploadedFiles()
        files: {
            top_banner_image?: Express.Multer.File[];
            login_image?: Express.Multer.File[];
            logo_image?: Express.Multer.File[];
        },
        @Body() createPageSettingDto: PageSettingDto,
    ) {
        createPageSettingDto.top_banner_image = files.top_banner_image[0].path;
        createPageSettingDto.login_image = files.login_image[0].path;
        createPageSettingDto.logo_image = files.logo_image[0].path;

        const newPage = await this.PageService.createPage(createPageSettingDto, req);

        if (typeof newPage === 'string') throw new CustomError({ success: false, message: newPage }, 400);

        return response.status(HttpStatus.CREATED).json({
            message: returnMessage('pageCreated'),
            data: newPage,
        });
    }

    @Get('getPage')
    async getPage(@Res() response, @Req() request) {
        const pageData = await this.PageService.getAllPage(request);

        if (typeof pageData === 'string') throw new CustomError({ success: false, message: pageData }, 400);

        return response.status(HttpStatus.OK).json({
            message: returnMessage('pageFetched'),
            data: pageData,
        });
    }

    @Put('/updatePage')
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'top_banner_image', maxCount: 1 },
                { name: 'login_image', maxCount: 1 },
                { name: 'logo_image', maxCount: 1 },
            ],
            {
                storage: diskStorage({
                    destination: './public/uploads',
                    filename: (req, file, cb) => {
                        const allowedExtensions = ['.png', '.jpg', '.jpeg'];
                        const fileExtension = '.' + file.originalname.split('.').pop().toLowerCase();

                        if (allowedExtensions.includes(fileExtension)) {
                            const filename = Date.now() + fileExtension;
                            cb(null, filename);
                        } else {
                            cb(
                                new CustomError(
                                    'Invalid file type. Only .png, .jpg, and .jpeg files are allowed.',
                                    400,
                                ),
                                'asd',
                            );
                        }
                    },
                }),
            },
        ),
    )
    async updatePage(
        @Res() response,

        @Body() createPageSettingDto: PageSettingDto,
        @Req() request,
        @UploadedFiles()
        files: {
            top_banner_image?: Express.Multer.File[];
            login_image?: Express.Multer.File[];
            logo_image?: Express.Multer.File[];
        },
    ) {
        if (request.files && Object.keys(request.files).length > 0) {
            if (files.top_banner_image && files.top_banner_image[0]) {
                createPageSettingDto.top_banner_image = files.top_banner_image[0].path;
            }
            if (files.login_image && files.login_image[0]) {
                createPageSettingDto.login_image = files.login_image[0].path;
            }
            if (files.logo_image && files.logo_image[0]) {
                createPageSettingDto.logo_image = files.logo_image[0].path;
            }

            const existingPage = await this.PageService.updatePage(createPageSettingDto, request);

            if (typeof existingPage === 'string')
                return new CustomError({ success: false, message: existingPage }, 400);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: returnMessage('updatePage'),
                data: existingPage,
            });
        } else {
            const existingPage = await this.PageService.updatePage(createPageSettingDto, request);

            if (typeof existingPage === 'string')
                return new CustomError({ success: false, message: existingPage }, 400);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: returnMessage('updatePage'),
                data: existingPage,
            });
        }
    }
}
