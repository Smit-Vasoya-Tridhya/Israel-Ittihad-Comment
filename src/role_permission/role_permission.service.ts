import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRoleDto } from './dto/role.dto';
import { CreateSearchObjectDto } from 'src/common/search_object.dto';
import { capitalizeFirstLetter, getKeywordType, paginationObject, returnMessage } from 'src/helpers/utils';
import { Role } from './role.schema';
import { IRole } from 'src/interfaces/role.interface';
import { User, UserDocument } from 'src/user/schema/user.schema';
import { Admin, AdminDocument } from 'src/admin/admin.schema';
import { decrypt, decryptArrayOfObject, encrypt } from 'src/helpers/encrypt-decrypt';
import moment from 'moment-timezone';

@Injectable()
export class RolePermissionService {
    constructor(
        @InjectModel(Role.name, 'SYSTEM_DB') private roleModel: Model<IRole>,
        @InjectModel(User.name, 'SYSTEM_DB')
        private readonly User: Model<UserDocument>,
        @InjectModel(Admin.name, 'SYSTEM_DB')
        private readonly Admin: Model<AdminDocument>,
    ) {}

    // Create a new role permission

    async createRole(roleData: CreateRoleDto, request: any) {
        try {
            const permissions = request.user.permissions;
            if (!permissions.systemAdmins.write) {
                return returnMessage('permissionDenied');
            }

            let roleValidate = await this.roleModel.find({
                role: roleData.role,
                keepValue: false,
                is_deleted: false,
            });

            if (roleValidate.length !== 0) {
                throw new InternalServerErrorException('Role already exists!');
            }

            let oldRowID: any = await this.roleModel.find().sort({ row_id: -1 });

            if (oldRowID.length === 0) {
                roleData['row_id'] = 1;
            } else {
                roleData['row_id'] = oldRowID[0].row_id + 1;
            }

            roleData.createdBy = request.user._id;
            roleData.updatedBy = request.user._id;
            let newRole = new this.roleModel(roleData);

            return newRole.save();
        } catch (error) {
            return error.message;
        }
    }

    // Upade By ID a new role permission

    async updateRole(RoleId: string, roleData: CreateRoleDto, request: any): Promise<IRole> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.systemAdmins.write) {
                return returnMessage('permissionDenied');
            }

            roleData.updatedBy = request.user._id;
            let existingAdmin = await this.roleModel.findById(RoleId).lean();

            if (!existingAdmin) {
                return returnMessage('notFound');
            }
            if (!existingAdmin.keepValue)
                existingAdmin = await this.roleModel.findByIdAndUpdate(RoleId, roleData, {
                    new: true,
                });

            return existingAdmin;
        } catch (error) {
            console.log('error', error);
            return error.message;
        }
    }

    // Role List

    async allRoleList(searchObject: CreateSearchObjectDto, request: any): Promise<any> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.systemAdmins.read) {
                return returnMessage('permissionDenied');
            }
            let queryObject: any;

            queryObject = {
                site: request.user.site,
                is_deleted: false,
            };

            let pagination = paginationObject(searchObject);
            if (searchObject.search && searchObject.search !== '') {
                queryObject['$or'] = [
                    { role: { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
                    { site: { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
                    {
                        'updatedBy.firstname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'updatedBy.lastname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        'updatedBy.fullname': {
                            $regex: encrypt(searchObject.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                ];

                const keywordType = getKeywordType(searchObject.search);
                if (keywordType === 'number') {
                    const numericKeyword = parseInt(searchObject.search);
                    queryObject['$or'].push({ row_id: numericKeyword });
                } else if (keywordType === 'date') {
                    const dateKeyword = new Date(searchObject.search);
                    queryObject['$or'].push({ updatedAt: dateKeyword });
                    queryObject['$or'].push({ createdAt: dateKeyword });
                }
            }

            let aggregationPipline = [
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'updatedBy',
                        foreignField: '_id',
                        as: 'updatedBy',
                        pipeline: [{ $project: { firstname: 1, lastname: 1 } }],
                    },
                },
                { $unwind: '$updatedBy' },
                {
                    $match: queryObject,
                },
            ];

            let roleData = await this.roleModel
                .aggregate(aggregationPipline)
                .sort(pagination.sort)
                .skip(pagination.skip)
                .limit(pagination.resultPerPage);

            let pageData: any = await this.roleModel.aggregate(aggregationPipline);
            let pageCount = Math.ceil(pageData.length / pagination.resultPerPage);

            return {
                roleData: decryptArrayOfObject(roleData, ['firstname', 'lastname', 'updatedBy']),
                pageCount,
            };
        } catch (error) {
            console.log('error', error);
            return error.message;
        }
    }

    // Delete role By ID

    async deleteRole(roleId: string, request: any): Promise<IRole> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.systemAdmins.write) {
                return returnMessage('permissionDenied');
            }

            const roleExist = await this.roleModel.findOne({
                _id: roleId,
                keepValue: false,
                is_deleted: false,
            });

            if (!roleExist) return returnMessage('notFound');

            let roleAssigned = await this.User.findOne({ user_type: roleId });

            if (!roleAssigned) roleAssigned = await this.Admin.findOne({ user_type: roleId });

            if (roleAssigned) return returnMessage('roleAssigend');

            const existingRole = await this.roleModel
                .findByIdAndUpdate(roleId, {
                    is_deleted: true,
                    updatedBy: request.user._id,
                })
                .where({ is_deleted: false });

            return existingRole;
        } catch (error) {
            console.log('error', error);
            return error.message;
        }
    }

    // Get Role role By ID

    async findByRoleId(roleId: string, request: any): Promise<IRole> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.systemAdmins.read) {
                return returnMessage('permissionDenied');
            }

            const existingAdmin = await this.roleModel.findById(roleId).where({
                site: request.user.site,
                is_deleted: false,
                keepValue: false,
            });

            if (!existingAdmin) {
                return returnMessage('notFound');
            }

            return existingAdmin;
        } catch (error) {
            console.log('error', error);
            return error.message;
        }
    }

    async rolesBySite(request: any, site: string): Promise<any> {
        try {
            if (site === '') return returnMessage('siteNotFound');

            const queryObj = { is_deleted: false, site };
            if (request.user.site === 'systemBackOffice') {
                queryObj['keepValue'] = true;
            }

            return await this.roleModel.find(queryObj).select('_id site role').lean();
        } catch (error) {
            console.log('error in the get roles by site', error);
            return error.message;
        }
    }

    async downloadExcel(request: any): Promise<any> {
        try {
            let queryObject: any;

            queryObject = {
                site: request.user.site,
                is_deleted: false,
            };

            let aggregationPipline = [
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'updatedBy',
                        foreignField: '_id',
                        as: 'updatedBy',
                        pipeline: [{ $project: { firstname: 1, lastname: 1 } }],
                    },
                },
                { $unwind: '$updatedBy' },
                {
                    $match: queryObject,
                },
                {
                    $project: {
                        _id: 0,
                        row_id: 1,
                        role: 1,
                        updatedBy: 1,
                        updatedAt: 1,
                        firstname: '$updatedBy.firstname',
                        lastname: '$updatedBy.lastname',
                    },
                },
            ];
            let roleData = await this.roleModel.aggregate(aggregationPipline);
            return this.optimiseExcel(roleData);
        } catch (error) {
            console.log('error in getting role', error);
            return error.message;
        }
    }

    optimiseExcel(data: any[]): any {
        try {
            const batchSize = Math.ceil(Math.sqrt(data.length));
            let chunkArray: any[] = [];
            for (let index = 0; index < batchSize; index++) {
                chunkArray.push(data.splice(0, batchSize));
            }

            let updatedData = chunkArray.map((element: any) => {
                return this.optimisedRoleXls(element);
            });
            return [].concat.apply([], updatedData);
        } catch (error) {
            console.log('error while exporting Role data', error);
            return error.message;
        }
    }

    optimisedRoleXls(data: any[]): any {
        try {
            const newArrayData: any[] = [];
            data.forEach((element: any) => {
                let obj = {};
                obj['Id'] = element.row_id || '-';
                obj['Type name'] = element.role || '-';

                obj['Updated'] = element.updatedAt
                    ? moment(element.updatedAt).tz('Israel').format('DD.MM.YYYY HH:mm')
                    : '-';

                obj['Updated'] =
                    obj['Updated'] +
                    '\n' +
                    capitalizeFirstLetter(decrypt(element.firstname)) +
                    ' ' +
                    capitalizeFirstLetter(decrypt(element.lastname));

                newArrayData.push(obj);
            });

            return newArrayData;
        } catch (error) {
            console.log('error while exporting Role data', error);
            return error.message;
        }
    }
}
