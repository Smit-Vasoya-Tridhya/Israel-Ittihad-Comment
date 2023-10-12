import { Injectable, NotFoundException } from '@nestjs/common';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { CreateAdminDto } from './dto/create-admin.dto';
import { IAdmin } from '../interfaces/admin.interface';
import { Model } from 'mongoose';
import { CreateSearchObjectDto } from 'src/common/search_object.dto';
import { IRole } from 'src/interfaces/role.interface';
import { Admin } from './admin.schema';
import { Role } from 'src/role_permission/role.schema';
import {
    capitalizeFirstLetter,
    emailTemplate,
    getKeywordType,
    paginationObject,
    returnMessage,
} from 'src/helpers/utils';
import { MailerService } from '@nestjs-modules/mailer';
import { User, UserDocument } from 'src/user/schema/user.schema';
import { decrypt, decryptArrayOfObject, decryptObjectFields, encrypt } from 'src/helpers/encrypt-decrypt';
import moment from 'moment-timezone';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(Admin.name, 'SYSTEM_DB') private adminModel: Model<IAdmin>,
        @InjectModel(Role.name, 'SYSTEM_DB') private roleModel: Model<IRole>,
        @InjectModel(User.name, 'SYSTEM_DB') private userModel: Model<UserDocument>,
        private mailerService: MailerService,
    ) {}

    // create new admin

    async createAdmin(adminDetails: CreateAdminDto, request: any): Promise<any> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.systemAdmins.write) {
                return returnMessage('permissionDenied');
            }
            let newAdmin: any;
            const subject = 'Invitation Email';
            const message = `<tr> <td style=" padding: 15px 15px 10px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 21px; text-align: left;"> <span style="font-weight: bold; margin-right: 2rem" >Email</span>&nbsp;:&nbsp;${adminDetails.email}<br /> <span style="font-weight: bold" ;>Password&nbsp;</span>&nbsp;:&nbsp;${adminDetails.password}</td></tr>`;

            const body = emailTemplate(message, adminDetails.password, adminDetails.firstname);

            adminDetails.createdBy = request.user._id;
            adminDetails.updatedBy = request.user._id;
            const newPassword = await bcrypt.hash(adminDetails.password, 12);

            adminDetails['fullname'] = encrypt(
                adminDetails.firstname.toLocaleLowerCase() + ' ' + adminDetails.lastname.toLocaleLowerCase(),
            );
            adminDetails.email = encrypt(adminDetails.email.toLocaleLowerCase());
            adminDetails.firstname = encrypt(adminDetails.firstname.toLocaleLowerCase());
            adminDetails.lastname = encrypt(adminDetails.lastname.toLocaleLowerCase());
            adminDetails.phone = encrypt(adminDetails.phone);

            if (request.user.site === 'systemBackOffice') {
                let emailValidate = await this.adminModel.findOne({
                    is_deleted: false,
                    $or: [{ email: adminDetails.email }, { phone: adminDetails.phone }],
                });

                if (emailValidate) return returnMessage('userExist');

                let oldRowID: any = await this.adminModel.find().sort({ row_id: -1 });
                if (oldRowID.length === 0) {
                    adminDetails['row_id'] = 1;
                } else {
                    adminDetails['row_id'] = oldRowID[0].row_id + 1;
                }
                adminDetails['password'] = newPassword;
                if (adminDetails.status === 'deleted') adminDetails.is_deleted = true;
                newAdmin = await this.adminModel.create(adminDetails);
            } else {
                adminDetails.site = request.user.site;
                let emailValidate = await this.userModel.findOne({
                    is_deleted: false,
                    $or: [{ email: adminDetails.email }, { phone: adminDetails.phone }],
                });

                if (emailValidate) return returnMessage('userExist');

                let oldRowID: any = await this.userModel.find().sort({ row_id: -1 });
                if (oldRowID.length === 0) {
                    adminDetails['row_id'] = 1;
                } else {
                    adminDetails['row_id'] = oldRowID[0].row_id + 1;
                }
                adminDetails['password'] = newPassword;
                newAdmin = await this.userModel.create(adminDetails);
            }

            if (newAdmin) {
                const sentMail = await this.sendMail(decrypt(adminDetails.email), body, subject);

                if (typeof sentMail === 'string') return returnMessage('errorEmail');
            }

            return decryptObjectFields(newAdmin, ['firstname', 'lastname', 'email', 'phone']);
        } catch (error) {
            console.log('error in the create admin api', error);
            return error.message;
        }
    }

    // Get All Admin data
    async getAllAdmin(searchObject: CreateSearchObjectDto, request: any): Promise<any> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.systemAdmins.read) {
                return returnMessage('permissionDenied');
            }

            let queryObject: any = {};
            let newModel: any;

            let pagination: any = paginationObject(searchObject);

            if (pagination.sort.role) {
                pagination['sort'] = { 'userRole.role': pagination.sort.role };
            }

            if (request.user.site === 'systemBackOffice') {
                newModel = this.adminModel;
            } else {
                queryObject = {
                    site: request.user.site,
                    is_deleted: false,
                };
                newModel = this.userModel;
            }

            if (searchObject.search && searchObject.search !== '') {
                queryObject['$or'] = [
                    {
                        firstname: { $regex: encrypt(searchObject.search.toLowerCase()), $options: 'i' },
                    },
                    { lastname: { $regex: encrypt(searchObject.search.toLowerCase()), $options: 'i' } },
                    { fullname: { $regex: encrypt(searchObject.search.toLowerCase()), $options: 'i' } },
                    { email: { $regex: encrypt(searchObject.search.toLowerCase()), $options: 'i' } },
                    { status: { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
                    { site: { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
                    { phone: encrypt(searchObject.search) },
                    { 'userRole.role': { $regex: searchObject.search.replace(/[^a-zA-Z0-9 ]/g, ''), $options: 'i' } },
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

            let aggregationPipline: any = [
                {
                    $lookup: {
                        from: 'roles',
                        localField: 'user_type',
                        foreignField: '_id',
                        as: 'userRole',
                        pipeline: [{ $project: { role: 1, site: 1, keepValue: 1 } }],
                    },
                },
                { $unwind: '$userRole' },
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'updatedBy',
                        foreignField: '_id',
                        as: 'updatedBy',
                        pipeline: [{ $project: { firstname: 1, lastname: 1, fullname: 1 } }],
                    },
                },
                { $unwind: '$updatedBy' },
                {
                    $match: queryObject,
                },
            ];

            // if (request.user.site !== 'systemBackOffice')
            //     aggregationPipline.push({
            //         $unionWith: {
            //             coll: 'admins',
            //             pipeline: [
            //                 {
            //                     $match: {
            //                         site: request.user.site,
            //                         is_deleted: false,
            //                     },
            //                 },
            //             ],
            //         },
            //     });

            let adminData = await newModel
                .aggregate(aggregationPipline)
                .sort(pagination.sort)
                .skip(pagination.skip)
                .limit(pagination.resultPerPage);

            let pageData = await newModel.aggregate(aggregationPipline);
            let pageCount = Math.ceil(pageData.length / pagination.resultPerPage);

            adminData = decryptArrayOfObject(adminData, [
                'firstname',
                'lastname',
                'fullname',
                'name',
                'email',
                'phone',
                'updatedBy',
            ]);

            return {
                adminData: adminData,
                pageCount,
            };
        } catch (error) {
            console.log(error, 'error');
            return error.message;
        }
    }

    // Update Admin By ID
    async updateAdmin(adminId: string, adminDetails: CreateAdminDto, request: any): Promise<IAdmin> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.systemAdmins.write) {
                return returnMessage('permissionDenied');
            }
            if (adminDetails.email) delete adminDetails.email;

            adminDetails['fullname'] = encrypt(
                adminDetails.firstname.toLocaleLowerCase() + ' ' + adminDetails.lastname.toLocaleLowerCase(),
            );
            adminDetails.firstname = encrypt(adminDetails.firstname.toLocaleLowerCase());
            adminDetails.lastname = encrypt(adminDetails.lastname.toLocaleLowerCase());
            adminDetails.phone = encrypt(adminDetails.phone);

            adminDetails.updatedBy = request.user._id;

            let findUser: any;

            if (request.user.site === 'systemBackOffice') {
                findUser = await this.adminModel.findOne({ phone: adminDetails.phone, _id: { $ne: adminId } }).lean();
            } else {
                findUser = await this.userModel.findOne({ phone: adminDetails.phone, _id: { $ne: adminId } }).lean();
            }

            if (findUser) return returnMessage('phoneExist');

            let existingAdmin: any;

            if (request.user.site === 'systemBackOffice') {
                if (adminDetails.status !== 'deleted') adminDetails.is_deleted = false;
                existingAdmin = await this.adminModel.findByIdAndUpdate(adminId, adminDetails);
            } else {
                existingAdmin = await this.userModel
                    .findByIdAndUpdate(adminId, adminDetails)
                    .where({ is_deleted: false });
            }

            if (!existingAdmin) throw new NotFoundException('Admin not found');

            return decryptObjectFields(existingAdmin, ['firstname', 'lastname', 'email', 'phone']);
        } catch (error) {
            console.log(error, 'error');
            return error.message;
        }
    }

    // Delete admin By ID
    async deleteAdmin(adminId: string, request: any): Promise<IAdmin> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.systemAdmins.write) {
                return returnMessage('permissionDenied');
            }

            let newModel: any;
            if (request.user.site === 'systemBackOffice') {
                newModel = this.adminModel;
            } else {
                newModel = this.userModel;
            }

            let existingAdmin: any;
            existingAdmin = await newModel
                .findByIdAndUpdate(adminId, {
                    is_deleted: true,
                    updatedBy: request.user._id,
                    status: 'deleted',
                })
                .where({ is_deleted: false });

            if (!existingAdmin) throw new NotFoundException('Admin not found');

            return decryptObjectFields(existingAdmin, ['firstname', 'lastname', 'email', 'phone']);
        } catch (error) {
            console.log(error, 'error');
            return error.message;
        }
    }

    // Update Password by admin

    async updatePassword(AdminId: string, adminDetails: CreateAdminDto, request: any): Promise<IAdmin> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.systemAdmins.write) {
                return returnMessage('permissionDenied');
            }

            adminDetails.updatedBy = request.user._id;
            const newPassword = await bcrypt.hash(adminDetails.password, 12);
            adminDetails['password'] = newPassword;

            let newModel: any;
            if (request.user.site === 'systemBackOffice') {
                newModel = this.adminModel;
            } else {
                newModel = this.userModel;
            }

            let existingAdmin: any;
            existingAdmin = await newModel.findByIdAndUpdate(AdminId, adminDetails).where({ is_deleted: false });

            if (!existingAdmin) throw new NotFoundException('Admin not found');

            return decryptObjectFields(existingAdmin, ['firstname', 'lastname', 'email', 'phone']);
        } catch (error) {
            console.log(error, 'error');
            return error.message;
        }
    }

    //Find Admin By ID for update

    async findByAdminId(adminId: string, request: any): Promise<IAdmin[]> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.systemAdmins.read) {
                return returnMessage('permissionDenied');
            }

            let newModel: any;
            if (request.user.site === 'systemBackOffice') {
                newModel = this.adminModel;
            } else {
                newModel = this.userModel;
            }

            let adminDataByID: any;
            adminDataByID = await newModel.aggregate([
                {
                    $lookup: {
                        from: 'roles',
                        localField: 'user_type',
                        foreignField: '_id',
                        as: 'userRole',
                        pipeline: [{ $project: { role: 1, site: 1, keepValue: 1 } }],
                    },
                },
                { $unwind: '$userRole' },
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'updatedBy',
                        foreignField: '_id',
                        as: 'updatedBy',
                        pipeline: [{ $project: { firstname: 1, lastname: 1 } }],
                    },
                },
                {
                    $unwind: '$updatedBy',
                },
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(adminId),
                        is_deleted: false,
                    },
                },
            ]);

            if (adminDataByID.length === 0) {
                throw new NotFoundException('Admin not found');
            }

            return decryptArrayOfObject(adminDataByID, ['firstname', 'lastname', 'email', 'phone']);
        } catch (error) {
            console.log(error, 'error');
            return error.message;
        }
    }

    // send email
    async sendMail(toMail: string, message: string, subject: string): Promise<any> {
        try {
            return this.mailerService.sendMail({
                to: toMail,
                from: process.env.SUPPORT_EMAIL,
                subject,
                html: message,
            });
        } catch (error) {
            console.log('error in email sent', error);
            return error.message;
        }
    }

    // Find user by id for profile
    async findProfileById(request: any) {
        try {
            let aggregatePipeline = [
                {
                    $lookup: {
                        from: 'roles',
                        localField: 'user_type',
                        foreignField: '_id',
                        as: 'userRole',
                        pipeline: [{ $project: { role: 1, site: 1, keepValue: 1 } }],
                    },
                },
                { $unwind: '$userRole' },
                {
                    $match: {
                        _id: request.user._id,
                        is_deleted: false,
                    },
                },
                {
                    $project: {
                        firstname: 1,
                        lastname: 1,
                        email: 1,
                        phone: 1,
                        site: 1,
                        user_type: '$userRole.role',
                        status: 1,
                    },
                },
            ];

            let findUserById = await this.adminModel.aggregate(aggregatePipeline);

            if (findUserById.length === 0) {
                findUserById = await this.userModel.aggregate(aggregatePipeline);
            }

            if (findUserById.length === 0) {
                return returnMessage('userNotFound');
            }

            return decryptArrayOfObject(findUserById, ['updatedBy', 'firstname', 'lastname', 'email', 'phone']);
        } catch (error) {
            console.log(error, 'error');
            return error.message;
        }
    }

    // Update Password by admin

    async updateProfileData(data: CreateAdminDto, request: any): Promise<any> {
        try {
            if (data.password) {
                const newPassword = await bcrypt.hash(data.password, 12);
                data['password'] = newPassword;
            } else {
                if (data.email) delete data.email;
                data['fullname'] = encrypt(
                    data.firstname.toLocaleLowerCase() + ' ' + data.lastname.toLocaleLowerCase(),
                );
                data.firstname = encrypt(data.firstname.toLocaleLowerCase());
                data.lastname = encrypt(data.lastname.toLocaleLowerCase());
                data.phone = encrypt(data.phone);
            }

            let findUserById: any = await this.userModel
                .findByIdAndUpdate(request.user._id, data)
                .where({ is_deleted: false });

            if (!findUserById) {
                findUserById = await this.adminModel
                    .findByIdAndUpdate(request.user._id, data)
                    .where({ is_deleted: false });
            }

            if (!findUserById) {
                return returnMessage('userNotFound');
            }

            return findUserById;
        } catch (error) {
            console.log(error, 'error while updating password');
            return error.message;
        }
    }

    // get all email site wise for setting page
    async getAllAdminEmail(request: any): Promise<any> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.settings.read) {
                return returnMessage('permissionDenied');
            }

            let queryObject: any = {};
            let newModel: any;

            if (request.user.site === 'systemBackOffice') {
                newModel = this.adminModel;
            } else {
                queryObject = {
                    site: request.user.site,
                    is_deleted: false,
                };
                newModel = this.userModel;
            }

            let adminData = await newModel.find(queryObject).select('email');

            adminData = decryptArrayOfObject(adminData, ['email']);

            adminData.push({ _id: request.user._id, email: decrypt(request.user.email) });

            return adminData;
        } catch (error) {
            console.log(error, 'error');
            return error.message;
        }
    }

    async downloadExcel(request: any) {
        let newModel: any;
        let queryObject: any = {};
        if (request.user.site === 'systemBackOffice') {
            newModel = this.adminModel;
        } else {
            queryObject = {
                site: request.user.site,
                is_deleted: false,
            };
            newModel = this.userModel;
        }

        let aggregationPipline = [
            {
                $lookup: {
                    from: 'roles',
                    localField: 'user_type',
                    foreignField: '_id',
                    as: 'userRole',
                    pipeline: [{ $project: { role: 1, site: 1, keepValue: 1 } }],
                },
            },
            { $unwind: '$userRole' },
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
                    admin: 1,
                    site: 1,
                    userRole: '$userRole.role',
                    email: 1,
                    phone: 1,
                    status: 1,
                    lastSeen: 1,
                    updatedAt: 1,
                    lastname: 1,
                    firstname: 1,
                    updatedBy: 1,
                },
            },
        ];

        let adminData = await newModel.aggregate(aggregationPipline);

        return this.optimiseExcel(adminData);
    }

    optimiseExcel(data: any[]): any {
        try {
            const batchSize = Math.ceil(Math.sqrt(data.length));
            let chunkArray: any[] = [];
            for (let index = 0; index < batchSize; index++) {
                chunkArray.push(data.splice(0, batchSize));
            }

            let updatedData = chunkArray.map((element: any) => {
                return this.optimisedAdminXls(element);
            });
            return [].concat.apply([], updatedData);
        } catch (error) {
            console.log('error while exporting Admin data', error);
            return error.message;
        }
    }

    optimisedAdminXls(data: any[]): any {
        try {
            const newArrayData: any[] = [];
            data.forEach((element: any) => {
                let obj = {};
                obj['Id'] = element.row_id || '-';
                obj['Full name'] =
                    capitalizeFirstLetter(decrypt(element.firstname)) +
                        ' ' +
                        capitalizeFirstLetter(decrypt(element.lastname)) || '-';
                obj['User type'] = element.userRole || '-';
                obj['Email'] = decrypt(element.email) || '-';
                obj['Phone'] = decrypt(element.phone) || '-';
                obj['Lastseen'] = element.lastSeen
                    ? moment(element.lastSeen).tz('Israel').format('DD.MM.YYYY HH:mm')
                    : '-';
                obj['Updated'] = element.updatedAt
                    ? moment(element.updatedAt).tz('Israel').format('DD.MM.YYYY HH:mm')
                    : '-';
                obj['Updated'] =
                    obj['Updated'] +
                    '\n' +
                    capitalizeFirstLetter(decrypt(element.updatedBy.firstname)) +
                    ' ' +
                    capitalizeFirstLetter(decrypt(element.updatedBy.lastname));

                if (element.status === 'active') obj['Status'] = 'Active';
                else if (element.status === 'inActive') obj['Status'] = 'In-Active';
                else if (element.status === 'deleted') obj['Status'] = 'Deleted';

                if (element.status === 'israelBackOffice') element['Site'] = 'Israel-Back-Office';
                else if (element.status === 'ittihadBackOffice') element['Site'] = 'Ittihad-Back-Office';
                else if (element.status === 'systemBackOffice') element['Site'] = 'System-Back-Office';

                newArrayData.push(obj);
            });

            return newArrayData;
        } catch (error) {
            console.log('error while exporting Admin data', error);
            return error.message;
        }
    }
}
