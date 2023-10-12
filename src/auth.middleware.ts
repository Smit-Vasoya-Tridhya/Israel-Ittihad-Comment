import { Injectable, NestMiddleware, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserDocument } from './user/schema/user.schema';
import { Admin, AdminDocument } from './admin/admin.schema';
import { permissionArrayToObj, returnMessage } from './helpers/utils';
import { Role, RoleDocument } from './role_permission/role.schema';
import { CustomError } from './helpers/customError';

@Injectable()
export class AuthorizationMiddleware implements NestMiddleware {
    constructor(
        @InjectModel(User.name, 'SYSTEM_DB') private readonly User: Model<UserDocument>,
        @InjectModel(Role.name, 'SYSTEM_DB') private readonly Role: Model<RoleDocument>,
        @InjectModel(Admin.name, 'SYSTEM_DB') private readonly Admin: Model<AdminDocument>,
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        let excludedRoutes: any = [
            '/api/v1/comments/addComments/',
            '/api/v1/comments/addCommentsReplay/',
            '/api/v1/comments/updateLike',
        ];
        for (const pattern of excludedRoutes) {
            if (req.url.startsWith(pattern)) {
                return next();
            }
        }
        let token: string;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            throw new CustomError({ success: false, message: returnMessage('notLoggedIn') }, 401);
        }
        let currentUser: any;

        try {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

            currentUser = await this.Admin.findById(decoded.id).populate('user_type');

            if (!currentUser) {
                currentUser = await this.User.findById(decoded.id).populate('user_type');
            }

            if (!currentUser) {
                throw new CustomError({ success: false, message: returnMessage('userNotFound') }, 401);
            }

            currentUser.lastSeen = new Date();
            await currentUser.save();

            currentUser.permissions = permissionArrayToObj(currentUser.user_type.permissions);
        } catch (err) {
            console.log('error from auth middleware', err);
            throw new CustomError({ success: false, message: returnMessage('tokenNotExist') }, 401);
        }

        req['user'] = currentUser;
        next();
    }
}
