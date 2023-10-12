import { Controller, Post, Body, Param, Put, Res, HttpStatus, Req, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateSearchObjectDto } from 'src/common/search_object.dto';
import { returnMessage } from 'src/helpers/utils';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CustomError } from 'src/helpers/customError';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';

@Controller('api/v1/admin')
@ApiTags('admin')
export class AdminController {
    constructor(private adminService: AdminService) {}

    // create new admin

    @Post('/createAdmin')
    async createAdmin(@Body() adminDetail: CreateAdminDto, @Res() response: Response, @Req() request: any) {
        try {
            var addAdminData = await this.adminService.createAdmin(adminDetail, request);
            if (typeof addAdminData === 'string') throw new CustomError({ success: false, message: addAdminData }, 400);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: returnMessage('createAdmin'),
                addAdminData,
            });
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: err.message,
                message: addAdminData,
            });
        }
    }

    // Get All Admin data

    @Post('/allAdminData')
    async getAllAdmin(@Res() response: Response, @Body() searchObject: CreateSearchObjectDto, @Req() request: any) {
        try {
            let adminData = await this.adminService.getAllAdmin(searchObject, request);
            return response.status(HttpStatus.OK).json(adminData);
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: err.message,
            });
        }
    }

    // Update Admin By ID

    @Put('/updateAdmin/:id')
    async updateAdmin(
        @Res() response: Response,
        @Req() request: any,
        @Param('id') adminId: string,
        @Body() adminDetails: CreateAdminDto,
    ) {
        try {
            const existingAdmin = await this.adminService.updateAdmin(adminId, adminDetails, request);

            if (typeof existingAdmin === 'string') {
                throw new CustomError({ success: false, message: existingAdmin }, 400);
            }

            return response.status(HttpStatus.OK).json({
                success: true,
                message: returnMessage('updateAdmin'),
                existingAdmin,
            });
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: err.message,
            });
        }
    }

    // Delete Admin By ID

    @Put('/deleteAdmin/:id')
    async deleteAdmin(@Res() response: Response, @Param('id') adminId: string, @Req() request: any) {
        try {
            const existingAdmin = await this.adminService.deleteAdmin(adminId, request);

            if (typeof existingAdmin === 'string')
                throw new CustomError({ success: false, message: existingAdmin }, 400);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: returnMessage('deleteAdmin'),
                existingAdmin,
            });
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: err.message,
            });
        }
    }

    // Change Password By ID

    @Put('/changePassword/:id')
    async updatePassword(
        @Req() request: any,
        @Res() response: Response,
        @Param('id') adminId: string,
        @Body() adminDetails: CreateAdminDto,
    ) {
        try {
            let changePassword = await this.adminService.updatePassword(adminId, adminDetails, request);

            if (typeof changePassword === 'string')
                throw new CustomError({ success: false, message: changePassword }, 400);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: returnMessage('passwordChanged'),
            });
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: err.message,
            });
        }
    }

    // Find Admin By ID

    @Get('/findByIdAdmin/:id')
    async findByAdminId(@Res() response: Response, @Param('id') adminId: string, @Req() request: any) {
        try {
            const adminDataByID = await this.adminService.findByAdminId(adminId, request);

            if (typeof adminDataByID === 'string')
                throw new CustomError({ success: false, message: adminDataByID }, 400);

            return response.status(HttpStatus.OK).json({
                success: true,
                adminDataByID,
            });
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: err.message,
            });
        }
    }

    @Get('/allAdminEmail')
    async getAllAdminEmail(@Req() request: any, @Res() response: Response) {
        try {
            let getAllEmail = await this.adminService.getAllAdminEmail(request);

            if (typeof getAllEmail === 'string') throw new CustomError({ success: false, message: getAllEmail }, 400);

            return response.status(HttpStatus.OK).json({
                success: true,
                data: getAllEmail,
            });
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: err.message,
            });
        }
    }

    @Put('/updateProfileData')
    async updateProfileData(@Req() request: any, @Res() response: Response, @Body() adminDetails: CreateAdminDto) {
        try {
            let changePassword = await this.adminService.updateProfileData(adminDetails, request);

            if (typeof changePassword === 'string')
                throw new CustomError({ success: false, message: changePassword }, 400);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: adminDetails.password ? returnMessage('passwordUpdate') : returnMessage('dataSaved'),
            });
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: err.message,
            });
        }
    }

    @Get('/findProfileById')
    async findProfileById(@Res() response: Response, @Req() request: any) {
        try {
            const findProfile = await this.adminService.findProfileById(request);

            if (typeof findProfile === 'string') throw new CustomError({ success: false, message: findProfile }, 400);

            return response.status(HttpStatus.OK).json({
                success: true,
                data: findProfile,
            });
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: err.message,
            });
        }
    }
}
