import { CreateSearchObjectDto } from 'src/common/search_object.dto';
import { CreateRoleDto } from './dto/role.dto';
import { RolePermissionService } from './role_permission.service';
import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Put,
  Param,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { returnMessage } from 'src/helpers/utils';
import { CustomError } from 'src/helpers/customError';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@Controller('api/v1/role-permission')
@ApiTags('Role permission')
export class RolePermissionController {
  constructor(private rolePermissionService: RolePermissionService) {}

  // Create a new role permission
  @Post('/createRole')
  async createRole(
    @Body() roleData: CreateRoleDto,
    @Res() response,
    @Req() req,
  ) {
    try {
      let createRoleData = await this.rolePermissionService.createRole(
        roleData,
        req,
      );

      if (typeof createRoleData === 'string')
        throw new CustomError({ success: false, message: createRoleData }, 400);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: returnMessage('createRole'),
        createRoleData,
      });
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: err.message,
        message: err.message,
      });
    }
  }

  // Upade By ID a new role permission

  @Put('/updateRole/:id')
  async updateRole(
    @Res() response,
    @Param('id') roleID: string,
    @Body() roleData: CreateRoleDto,
    @Req() req,
  ) {
    try {
      const existingRole = await this.rolePermissionService.updateRole(
        roleID,
        roleData,
        req,
      );

      if (typeof existingRole === 'string')
        throw new CustomError({ success: false, message: existingRole }, 400);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: returnMessage('updateRole'),
      });
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: err.message,
      });
    }
  }

  // Role List

  @Post('/roleList')
  async allRoleList(
    @Body() searchObject: CreateSearchObjectDto,
    @Res() response,
    @Req() req,
  ) {
    try {
      let roleData = await this.rolePermissionService.allRoleList(
        searchObject,
        req,
      );

      if (typeof roleData === 'string')
        throw new CustomError({ success: false, message: roleData }, 400);

      return response.status(HttpStatus.OK).json(roleData);
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: err.message,
      });
    }
  }

  // Delete role By ID
  @Put('/deleteRole/:id')
  async deleteRole(@Res() response, @Param('id') roleID: string, @Req() req) {
    try {
      const existingRole = await this.rolePermissionService.deleteRole(
        roleID,
        req,
      );

      if (typeof existingRole === 'string')
        throw new CustomError({ success: false, message: existingRole }, 400);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: returnMessage('deleteRole'),
      });
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: err.message,
      });
    }
  }

  // Get Role role By ID

  @Post('/findByRoleID/:id')
  async findByRoleId(@Res() response, @Param('id') roleID: string, @Req() req) {
    try {
      const existingRole = await this.rolePermissionService.findByRoleId(
        roleID,
        req,
      );

      if (typeof existingRole === 'string')
        throw new CustomError({ success: false, message: existingRole }, 400);

      return response.status(HttpStatus.OK).json({
        success: true,
        data: existingRole,
      });
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: err.message,
      });
    }
  }

  // get the role based on the site to create the system admins
  @Get('/roleBySite')
  async getRolesBySite(
    @Req() request: any,
    @Res() res: Response,
    @Query('site') site: string,
  ) {
    const roles = await this.rolePermissionService.rolesBySite(request, site);

    if (typeof roles === 'string')
      throw new CustomError({ success: false, message: roles }, 400);

    return res.status(200).json({
      success: true,
      message: returnMessage('rolesFetched'),
      data: roles,
    });
  }
}
