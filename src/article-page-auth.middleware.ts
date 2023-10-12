// import { Injectable, NestMiddleware } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { NextFunction, Request, Response } from 'express';
// import jwt from 'jsonwebtoken';
// import { permissionArrayToObj, returnMessage } from './helpers/utils';
// import { CustomError } from './helpers/customError';
// import { ArticlePageUser, ArticlePageUserDocument } from './user/schema/article-page-user.schema';

// @Injectable()
// export class AuthorizationMiddleware implements NestMiddleware {
//     constructor(
//         @InjectModel(ArticlePageUser.name, 'ISRAEL_DB') private readonly Israel_User: Model<ArticlePageUserDocument>,
//         @InjectModel(ArticlePageUser.name, 'ITTIHAD_DB') private readonly Ittihad_User: Model<ArticlePageUserDocument>,
//     ) {}

//     async use(req: Request, res: Response, next: NextFunction) {
//         let token: string;
//         try {
//             if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//                 token = req.headers.authorization.split(' ')[1];

//                 let currentUser: any;

//                 const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

//                 currentUser = await this.Israel_User.findById(decoded.id);

//                 if (!currentUser) {
//                     currentUser = await this.Ittihad_User.findById(decoded.id);
//                 }

//                 if (!currentUser) {
//                     throw new CustomError({ success: false, message: returnMessage('userNotFound') }, 401);
//                 }

//                 currentUser.lastSeen = new Date();
//                 await currentUser.save();

//                 req['user'] = currentUser;
//                 next();
//             }
//         } catch (err) {
//             console.log('error from article page auth middleware', err);
//             throw new CustomError({ success: false, message: returnMessage('tokenNotExist') }, 401);
//         }
//     }
// }
