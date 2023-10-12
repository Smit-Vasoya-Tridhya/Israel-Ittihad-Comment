import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageSettingDto } from './settingDto/PageSetting.dto';
import { page_setting } from './page-setting.schema';
import { IPage } from './setting.interface';
import { returnMessage } from 'src/helpers/utils';
import { unlink } from 'fs/promises';
@Injectable()
export class PageSettingService {
    constructor(
        @InjectModel(page_setting.name, 'SYSTEM_DB')
        private readonly PageSettingModel: Model<IPage>,
    ) {}

    async createPage(createPageSettingDto: PageSettingDto, request: any): Promise<IPage> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.settings.write) {
                return returnMessage('permissionDenied');
            }
            createPageSettingDto.site = request.user.site;

            return await this.PageSettingModel.create(createPageSettingDto);
        } catch (error) {
            console.log('error in create page', error);
            return error.message;
        }
    }

    async getAllPage(request: any): Promise<IPage[]> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.settings.read) {
                return returnMessage('permissionDenied');
            }

            return await this.PageSettingModel.find({ site: request.user.site });
        } catch (error) {
            console.log('error in Get  Pages', error);
            return error.message;
        }
    }

    async getPageByID(id: string, request: any): Promise<IPage> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.harmfullwords.write) {
                return returnMessage('permissionDenied');
            }

            const existingPage = await this.PageSettingModel.findById(id).lean();
            if (!existingPage) return returnMessage('pagedidnotget');

            return existingPage;
        } catch (error) {
            console.log('error in get harmfullword', error);
            return error.message;
        }
    }

    async updatePage(createPageSettingDto: PageSettingDto, request: any): Promise<IPage> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.settings.write) {
                return returnMessage('permissionDenied');
            }

            const existingImage = await this.PageSettingModel.findOne({
                site: request.user.site,
            });

            if (request.files && Object.keys(request.files).length > 0) {
                if (
                    existingImage.top_banner_image &&
                    request.files.top_banner_image &&
                    request.files.top_banner_image[0]
                ) {
                    await unlink(existingImage.top_banner_image); // Delete the old image
                }

                if (existingImage.login_image && request.files.login_image && request.files.login_image[0]) {
                    await unlink(existingImage.login_image); // Delete the old image
                }

                if (existingImage.logo_image && request.files.logo_image && request.files.logo_image[0]) {
                    await unlink(existingImage.logo_image); // Delete the old image
                }
            }

            const existingPage = await this.PageSettingModel.findByIdAndUpdate(
                existingImage._id,
                createPageSettingDto,
                { new: true },
            ).where({ site: request.user.site });

            if (!existingPage) return returnMessage('pageNotFound');

            return existingPage;
        } catch (error) {
            console.log('error in create page setting', error);
            return error.message;
        }
    }
}
