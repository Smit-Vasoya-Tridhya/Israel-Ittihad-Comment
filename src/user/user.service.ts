import { Admin, AdminDocument } from 'src/admin/admin.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schema/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import {
    capitalizeFirstLetter,
    emailTemplate,
    getKeywordType,
    paginationObject,
    returnMessage,
} from 'src/helpers/utils';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';
import { LoginUserDto } from './dto/login-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateSearchObjectDto } from 'src/common/search_object.dto';
import { Role, RoleDocument } from 'src/role_permission/role.schema';
// import { encryptObject } from 'src/helpers/encrypt-decrypt';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { decrypt, decryptArrayOfObject, decryptObjectFields, encrypt } from 'src/helpers/encrypt-decrypt';
import { ArticlePageUser, ArticlePageUserDocument } from './schema/article-page-user.schema';
import { ArticlePageRegisterUserDto } from './dto/article-page-create-user.dto';
import { PageSettingDocument, page_setting } from 'src/page-setting/page-setting.schema';
import { EmailVerifyUserDto } from './dto/email-verify-user.dto';
import { LoginArticlePageDto } from './dto/login-article-page.dto';
import { CommentDocument, Comments } from 'src/comments/schema/comment.schema';
import { Page, PageDocument } from 'src/pages/pages.schema';
import { ResetPasswordArticlePageDto } from './dto/reset-password-article-page.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import moment from 'moment-timezone';
import { GoogleSignInDto } from './dto/google-signin.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name, 'SYSTEM_DB')
        private readonly User: Model<UserDocument>,
        @InjectModel(Admin.name, 'SYSTEM_DB')
        private readonly Admin: Model<AdminDocument>,
        @InjectModel(Role.name, 'SYSTEM_DB')
        private readonly Role: Model<RoleDocument>,
        @InjectModel(ArticlePageUser.name, 'ISRAEL_DB')
        private readonly ISRAEL_User: Model<ArticlePageUserDocument>,
        @InjectModel(ArticlePageUser.name, 'ITTIHAD_DB')
        private readonly ITTIHAD_User: Model<ArticlePageUserDocument>,
        @InjectModel(page_setting.name, 'SYSTEM_DB')
        private readonly PageSettingModel: Model<PageSettingDocument>,
        @InjectModel(Page.name, 'SYSTEM_DB')
        private readonly Page: Model<PageDocument>,
        @InjectModel(Comments.name, 'SYSTEM_DB') private readonly CommnetsModel: Model<CommentDocument>,
        private readonly mailerService: MailerService,
    ) {}

    googleLogin(request: any) {
        if (!request.user) return 'default';
        console.log(request.user, 48);
        return request.user;
    }

    async register(reqBody: CreateUserDto): Promise<any> {
        try {
            const { email, password, firstname, lastname, phone, site, status, user_type } = reqBody;
            if (!email || !password || !firstname || !lastname || !phone || !site || !status || !user_type)
                return returnMessage('fieldsMissing');

            const userExist = await this.Admin.findOne({
                email: encrypt(reqBody.email),
            }).lean();
            if (userExist && userExist.is_deleted === false) return returnMessage('userExist');
            else if (userExist && userExist.is_deleted === true) {
            }

            reqBody.password = await bcrypt.hash(reqBody.password, 12);

            // for encryption of the users data
            reqBody.email = encrypt(reqBody.email);
            reqBody.firstname = encrypt(reqBody.firstname);
            reqBody.lastname = encrypt(reqBody.lastname);
            reqBody.phone = encrypt(reqBody.phone);

            const user = await this.Admin.create(reqBody);

            if (!user) return returnMessage('default');

            const token = jwt.sign({ id: user._id, site }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRE,
            });

            return { token, user };
        } catch (error) {
            console.log('error in register user', error);
            return error.message;
        }
    }

    // this function is used for the login of system-back-office, israel-back-office and ittihad
    async login(reqBody: LoginUserDto): Promise<any> {
        try {
            if (!reqBody.email || !reqBody.password) return returnMessage('emailPassNotFound');

            let user = await this.User.findOne({
                email: encrypt(reqBody.email),
                is_deleted: false,
            });
            if (!user)
                user = await this.Admin.findOne({
                    email: encrypt(reqBody.email),
                    is_deleted: false,
                });

            if (!user) return returnMessage('userNotFound');

            if (user.status === 'inActive') return returnMessage('accountSuspended');

            const comparePassword = await bcrypt.compare(reqBody.password, user.password);

            if (!comparePassword) return returnMessage('incorrectEmailPassword');

            user.otp = Math.floor(100000 + Math.random() * 900000);
            user.otpExpire = Date.now() + 900000;
            await user.save();
            const subject = 'OTP for login';
            const message = `Your OTP for Login is ${user.otp}<br>
      <br><b>NOTE: OTP is valid for the 15 minutes Only.</b>
      `;

            this.sendMail('', decrypt(user.email), '', subject, message);
            // if (typeof sentMail === 'string') return returnMessage('ErrorEmail');
            return true;
        } catch (error) {
            console.log('error in login api', error);
            return error.message;
        }
    }

    // send again OTP if the Email is Not Verified
    async resendOtp(email: ResendOtpDto): Promise<any> {
        try {
            let user = await this.ISRAEL_User.findOne({ email });

            if (!user) user = await this.ITTIHAD_User.findOne({ email });

            if (!user) return returnMessage('userNotFound');

            user.otp = Math.floor(100000 + Math.random() * 900000);
            user.otpExpire = Date.now() + 900000;
            await user.save();
            const site = user.site === 'israel-today' ? 'israelBackOffice' : 'ittihadBackOffice';
            await this.sendMailToOtpVerification(site, user.otp, decrypt(user.name), decrypt(user.email));
            return true;
        } catch (error) {
            console.log('error in resend OTP', error);
            return error.message;
        }
    }

    // this function is used for the login the article page users
    async articlePageUserRegister(reqBody: ArticlePageRegisterUserDto): Promise<any> {
        try {
            let { email, password, name } = reqBody;
            if (!email || !password || !name) return returnMessage('fieldsMissing');
            const otp = Math.floor(100000 + Math.random() * 900000);
            const otpExpire = Date.now() + 900000;
            let newUser: any;

            if (reqBody.site === 'israel-today') {
                const [userExist, row_id] = await Promise.all([
                    this.ISRAEL_User.findOne({
                        email: encrypt(reqBody.email),
                    }),
                    this.ISRAEL_User.countDocuments(),
                ]);

                if (userExist && !userExist.emailVerified) {
                    if (Date.now() > +userExist['otpExpire']) {
                        this.sendMailToOtpVerification(
                            'israelBackOffice',
                            otp,
                            decrypt(userExist.name),
                            decrypt(userExist.email),
                        );
                        userExist['otp'] = otp;
                        userExist['otpExpire'] = otpExpire;
                        await userExist.save();
                    }

                    return {
                        emailVerified: false,
                        email,
                    };
                }

                if (userExist) return returnMessage('userExist');

                password = await bcrypt.hash(password, 12);
                // removed because of the otp verification
                // accountConfirmToken = crypto.randomBytes(32).toString('hex');

                newUser = await this.ISRAEL_User.create({
                    email: encrypt(email),
                    password,
                    site: 'israel-today',
                    ip: reqBody.ip,
                    device: reqBody.device,
                    name: encrypt(name.toLocaleLowerCase()),
                    row_id: row_id + 1,
                    otpExpire,
                    otp,
                });
            } else if (reqBody.site === 'ittihad-today') {
                const [userExist, row_id] = await Promise.all([
                    this.ITTIHAD_User.findOne({
                        email: encrypt(reqBody.email),
                    }).lean(),
                    this.ITTIHAD_User.countDocuments(),
                ]);

                if (userExist && !userExist.emailVerified) {
                    if (Date.now() > +userExist['otpExpire']) {
                        this.sendMailToOtpVerification(
                            'ittihadBackOffice',
                            otp,
                            decrypt(userExist.name),
                            decrypt(userExist.email),
                        );
                        userExist['otp'] = otp;
                        userExist['otpExpire'] = otpExpire;
                        await userExist.save();
                    }

                    return {
                        emailVerified: false,
                        email,
                    };
                }

                if (userExist) return returnMessage('userExist');

                password = await bcrypt.hash(password, 12);
                // removed because of the otp verification
                // accountConfirmToken = crypto.randomBytes(32).toString('hex');

                newUser = await this.ITTIHAD_User.create({
                    email: encrypt(email),
                    password,
                    site: 'israel-today',
                    ip: reqBody.ip,
                    device: reqBody.device,
                    name: encrypt(name.toLocaleLowerCase()),
                    row_id: row_id + 1,
                    otp,
                    otpExpire,
                });
            }

            if (!newUser) return returnMessage('default');

            // removed account verification
            // link = `${process.env.SERVER_HOST}/api/v1/user/verify-account?token=${accountConfirmToken}&email=${encrypt(
            //     email,
            // )}`;

            // const pageObj = {
            //     site: 'israelBackOffice',
            // };
            // if (newUser.site === 'ittihad-today') pageObj.site = 'ittihadBackOffice';

            this.sendMailToOtpVerification(
                newUser.site === 'israel-today' ? 'israelBackOffice' : 'ittihadBackOffice',
                otp,
                name,
                email,
            );

            return true;
        } catch (error) {
            console.log('error while creating new article page user', error);
            return error.message;
        }
    }

    async sendMailToOtpVerification(site: string, otp: number, name: string, email: string): Promise<any> {
        const pageSetting = await this.PageSettingModel.findOne({ site }).lean();

        if (
            pageSetting.confirm_email_message === '' ||
            pageSetting.confirm_email_from === '' ||
            pageSetting.confrim_email_sub === '' ||
            pageSetting.confirm_email_reply === '' ||
            pageSetting.terms_privacy_policy_url === ''
        )
            return returnMessage('confirmEmailTemplateNotAvailable');

        pageSetting.confirm_email_message = pageSetting.confirm_email_message.replaceAll('{{first name}}', name);

        pageSetting.confirm_email_message = pageSetting.confirm_email_message.replaceAll('{{otp}}', otp.toString());

        pageSetting.confirm_email_message = pageSetting.confirm_email_message.replaceAll(
            '{{terms page URL}}',
            pageSetting.terms_privacy_policy_url,
        );

        this.sendMail(
            pageSetting.confirm_email_from,
            email,
            pageSetting.confirm_email_reply,
            pageSetting.confrim_email_sub,
            pageSetting.confirm_email_message,
        );
        return true;
    }

    async verifyUserAccount(reqBody: EmailVerifyUserDto): Promise<any> {
        try {
            const { email, token } = reqBody;
            const searchObj = {
                email,
                accountConfirmToken: crypto.createHash('sha256').update(token).digest('hex'),
            };
            let userExist = await this.ISRAEL_User.findOne(searchObj);

            if (!userExist) userExist = await this.ITTIHAD_User.findOne(searchObj);

            if (!userExist) return returnMessage('invalidLink');

            userExist.emailVerified = true;
            userExist.accountConfirmToken = undefined;
            await userExist.save();

            return true;
        } catch (error) {
            console.log('error in verify article page user account', error);
        }
    }

    async loginArticlePageUser(reqBody: LoginArticlePageDto): Promise<any> {
        try {
            const { email, password, ip, device } = reqBody;
            if (!email || !password) return returnMessage('emailPassNotFound');
            const searchObj = {
                email: encrypt(email),
            };
            let user = await this.ISRAEL_User.findOne(searchObj);
            if (!user) user = await this.ITTIHAD_User.findOne(searchObj);

            if (!user) return returnMessage('userNotFound');

            if (!user.emailVerified) return returnMessage('notVerified');
            if (user.status === 'inActive') return returnMessage('userInActive');

            const passwordMatched = await bcrypt.compare(password, user.password);

            if (!passwordMatched) return returnMessage('incorrectEmailPassword');

            user.ip = ip;
            user.device = device;
            user.lastSeen = new Date();

            await user.save();

            const token = jwt.sign(
                {
                    id: user._id,
                    site: user.site,
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE },
            );
            return { token, user: decryptObjectFields(user, ['name', 'email']) };
        } catch (error) {
            console.log('error while user login in article page', error.message);
        }
    }

    async googleSignIn(reqBody: GoogleSignInDto): Promise<any> {
        try {
            const { googleAuthToken, site, ip, device } = reqBody;
            if (!googleAuthToken || !site) return returnMessage('googelAuthTokenNotFound');

            const decode: any = jwt.decode(googleAuthToken);
            let userExist: ArticlePageUserDocument;
            if (site === 'israel-today') {
                userExist = await this.ISRAEL_User.findOne({ email: encrypt(decode.email) });
            } else if (site === 'ittihad-today') {
                userExist = await this.ITTIHAD_User.findOne({ email: encrypt(decode.email) });
            }

            if (!userExist) {
                const newUserObj = {
                    email: encrypt(decode.email),
                    name: encrypt(decode.name.toLocaleLowerCase()),
                    image: decode.picture,
                    googleData: JSON.stringify(decode),
                    emailVerified: true,
                    loggedInViaGoogle: true,
                    ip,
                    device,
                    lastSeen: new Date(),
                };
                if (reqBody.site === 'israel-today') {
                    const rowId = await this.ISRAEL_User.countDocuments();
                    newUserObj['site'] = 'israel-today';
                    newUserObj['row_id'] = rowId + 1;
                    userExist = await this.ISRAEL_User.create(newUserObj);
                } else if (reqBody.site === 'ittihad-today') {
                    const rowId = await this.ITTIHAD_User.countDocuments();
                    newUserObj['site'] = 'ittihad-today';
                    newUserObj['row_id'] = rowId + 1;
                    userExist = await this.ITTIHAD_User.create(newUserObj);
                }

                if (!userExist) return returnMessage('default');
            }

            userExist.ip = ip;
            userExist.device = device;
            userExist.lastSeen = new Date();

            await userExist.save();

            const token = jwt.sign(
                {
                    id: userExist._id,
                    site: userExist.site,
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE },
            );
            return { token, user: decryptObjectFields(userExist, ['name', 'email']) };
        } catch (error) {
            console.log('error while user login in article page', error.message);
        }
    }

    async verifyOtpForArticlePage(verifyOtp: VerifyOtpDto): Promise<any> {
        try {
            let isOtpValid = await this.ISRAEL_User.findOne({
                email: encrypt(verifyOtp.email),
                otp: verifyOtp.otp,
            }).select('-password');

            if (!isOtpValid) {
                isOtpValid = await this.ITTIHAD_User.findOne({
                    email: encrypt(verifyOtp.email),
                    otp: verifyOtp.otp,
                }).select('-password');
            }

            if (!isOtpValid) return returnMessage('otpNotValid');

            if (Date.now() > +isOtpValid['otpExpire']) return returnMessage('otpExpired');

            isOtpValid['otp'] = undefined;
            isOtpValid['otpExpire'] = undefined;
            isOtpValid['emailVerified'] = true;
            isOtpValid.lastSeen = new Date();
            await isOtpValid.save();

            const token = jwt.sign(
                {
                    id: isOtpValid._id,
                    site: isOtpValid.site,
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE },
            );

            return {
                data: decryptObjectFields(isOtpValid, ['firstname', 'lastname', 'email', 'phone']),
                token,
            };
        } catch (error) {
            console.log('error in verify the otp', error);
            return error.message;
        }
    }

    async verifyOtp(verifyOtp: VerifyOtpDto): Promise<any> {
        try {
            let isOtpValid = await this.User.findOne({
                email: encrypt(verifyOtp.email),
                otp: verifyOtp.otp,
                is_deleted: false,
            })
                .select('-password')
                .populate('user_type');

            if (!isOtpValid) {
                isOtpValid = await this.Admin.findOne({
                    email: encrypt(verifyOtp.email),
                    otp: verifyOtp.otp,
                    is_deleted: false,
                })
                    .select('-password')
                    .populate('user_type');
            }

            if (!isOtpValid) return returnMessage('otpNotValid');

            if (Date.now() > +isOtpValid.otpExpire) return returnMessage('otpExpired');

            isOtpValid.otp = undefined;
            isOtpValid.otpExpire = undefined;
            isOtpValid.lastSeen = new Date();
            await isOtpValid.save();

            const token = jwt.sign(
                {
                    id: isOtpValid._id,
                    site: isOtpValid.site,
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE },
            );

            let pendingPageSearchObj: object = {
                    israelStatus: 'pending',
                },
                pendingCommentSearchObj: object = {
                    status: 'pending',
                    site: 'israel-today',
                };

            if (isOtpValid.site === 'ittihadBackOffice') {
                pendingPageSearchObj = {
                    ittihadStatus: 'pending',
                };

                pendingCommentSearchObj['site'] = 'ittihad-today';
            }

            const [pendingPageCount, pendingCommnetCount] = await Promise.all([
                this.Page.countDocuments(pendingPageSearchObj),
                this.CommnetsModel.countDocuments(pendingCommentSearchObj),
            ]);

            return {
                data: decryptObjectFields(isOtpValid, ['firstname', 'lastname', 'email', 'phone']),
                token,
                pendingPageCount,
                pendingCommnetCount,
            };
        } catch (error) {
            console.log('error in verify the otp', error);
            return error.message;
        }
    }

    async forgotPassword(data: ForgotPasswordDto): Promise<any> {
        try {
            let user = await this.User.findOne({ email: encrypt(data.email) });

            if (!user) user = await this.Admin.findOne({ email: encrypt(data.email) });

            if (!user) return returnMessage('userNotFound');
            const resetToken = crypto.randomBytes(32).toString('hex');

            user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            user.passwordResetExpires = Date.now() + 3600000;
            await user.save();

            const link = `${process.env.WEBHOST}/reset-password?token=${resetToken}`;

            const subject = 'Forgot Password Email';
            const message = `<tr>
      <td
        style="padding: 15px 15px 10px; color:#333333; font-family: Arial, Helvetica, sans-serif; font-size:15px; line-height:21px; text-align:left;">
        Click on the following link or copy and paste it into your web browser:<br><a
          href=${link} style="color: blue;">[Verification Link]</a></td>
    </tr>
    <tr>
      <td
        style="padding: 15px 15px 10px; color:#333333; font-family: Arial, Helvetica, sans-serif; font-size:15px; line-height:21px; text-align:left;">
        You'll be directed to a reset-password page.</td>
    </tr>`;
            const body = emailTemplate(message, link, decrypt(user.firstname));

            this.sendMail('', decrypt(user.email), '', subject, body);

            // if (typeof sentMail === 'string') return returnMessage('ErrorEmail');

            return true;
        } catch (error) {
            console.log('error in forgot password api', error.message);
            return error.message;
        }
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<any> {
        try {
            const { token, password } = resetPasswordDto;

            if (!token || !password) return returnMessage('tokenOrPasswordMissing');

            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            let user = await this.Admin.findOne({
                passwordResetToken: hashedToken,
            }).select('email password');

            if (!user)
                user = await this.User.findOne({
                    passwordResetToken: hashedToken,
                }).select('email password');

            if (!user) return returnMessage('invalidToken');

            if (Date.now() > user.passwordResetExpires) return returnMessage('linkExpired');

            const isSamePassword = await bcrypt.compare(password, user.password);
            if (isSamePassword) return returnMessage('oldNewPasswordSame');

            const hash = await bcrypt.hash(password, 12);

            user.password = hash;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();

            return true;
        } catch (error) {
            console.log('error in reset password', error);
            return error.message;
        }
    }

    async forgotPasswordForArticleUser(data: ForgotPasswordDto): Promise<any> {
        try {
            let user = await this.ISRAEL_User.findOne({ email: encrypt(data.email) });

            if (!user) user = await this.ITTIHAD_User.findOne({ email: encrypt(data.email) });

            if (!user) return returnMessage('userNotFound');
            if (user.status === 'inActive') return returnMessage('userInActive');
            if (!user.emailVerified) return returnMessage('notVerified');
            // const resetToken = crypto.randomBytes(32).toString('hex');

            // user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            // user.passwordResetExpires = Date.now() + 3600000;

            user.passWordResetOtp = Math.floor(100000 + Math.random() * 900000);
            user.passWordResetOtpExpire = Date.now() + 900000;
            await user.save();

            await this.sendResetPasswordEmail(user);
            // if (typeof sentMail === 'string') return returnMessage('ErrorEmail');

            return true;
        } catch (error) {
            console.log('error in forgot password api', error.message);
            return error.message;
        }
    }

    async sendResetPasswordEmail(user: any): Promise<any> {
        try {
            const searchObj = {
                site: 'israelBackOffice',
            };
            if (user.site === 'ittihad-today') searchObj.site = 'ittihadBackOffice';
            const pageSetting = await this.PageSettingModel.findOne(searchObj).lean();
            // const link = `${process.env.WEBHOST}/reset-password?token=${resetToken}`;
            if (
                !pageSetting ||
                pageSetting.reset_email_message === '' ||
                pageSetting.reset_email_from === '' ||
                pageSetting.reset_email_reply === '' ||
                pageSetting.reset_email_sub === ''
            )
                return returnMessage('resetEmailTemplateNotAvailable');

            pageSetting.reset_email_message = pageSetting.reset_email_message.replaceAll(
                '{{first name}}',
                decrypt(user.name),
            );

            pageSetting.reset_email_message = pageSetting.reset_email_message.replaceAll(
                '{{otp}}',
                user.passWordResetOtp,
            );

            this.sendMail(
                pageSetting.reset_email_from,
                decrypt(user.email),
                pageSetting.reset_email_reply,
                pageSetting.reset_email_sub,
                pageSetting.reset_email_message,
            );
            return;
        } catch (error) {
            console.log('error in the send reset password email ', error);
            return error.message;
        }
    }

    async resetPasswordForArticleUser(resetPasswordDto: ResetPasswordArticlePageDto): Promise<any> {
        try {
            const { otp, email, password } = resetPasswordDto;

            if (!otp || !password) return returnMessage('tokenOrPasswordMissing');

            // const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            // let user = await this.ISRAEL_User.findOne({
            //     passwordResetToken: hashedToken,
            // }).select('email password');

            // if (!user)
            //     user = await this.ITTIHAD_User.findOne({
            //         passwordResetToken: hashedToken,
            //     }).select('email password');

            let user = await this.ISRAEL_User.findOne({
                email: encrypt(email),
                passWordResetOtp: otp,
            }).select('email password');

            if (!user)
                user = await this.ITTIHAD_User.findOne({
                    email: encrypt(email),
                    passWordResetOtp: otp,
                }).select('email password');

            if (!user) return returnMessage('otpNotValid');

            if (Date.now() > user.passWordResetOtpExpire) return returnMessage('otpExpired');

            const isSamePassword = await bcrypt.compare(password, user.password);
            if (isSamePassword) return returnMessage('oldNewPasswordSame');

            const hash = await bcrypt.hash(password, 12);

            user.password = hash;
            user.passWordResetOtp = undefined;
            user.passWordResetOtpExpire = undefined;
            await user.save();

            return true;
        } catch (error) {
            console.log('error in reset password', error);
            return error.message;
        }
    }

    sendMail(fromEmail: string, toMail: string, replyToEmail: string, subject: string, message: string): Promise<any> {
        try {
            if (fromEmail === '') fromEmail = process.env.SUPPORT_EMAIL;
            if (replyToEmail === '') replyToEmail = process.env.SUPPORT_EMAIL;
            this.mailerService.sendMail({
                to: toMail,
                from: fromEmail,
                subject,
                html: message,
                replyTo: replyToEmail,
            });
            return;
        } catch (error) {
            console.log('error in email sent', error);
            return error.message;
        }
    }

    // this api is used for the listing of the article page of the users in the Back Office
    async usersList(request: any, searchObj: CreateSearchObjectDto): Promise<any> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.users.read) return returnMessage('permissionDenied');

            // if (searchObj.sortField === 'totalComments') searchObj.sortField = 'updatedAt';
            const pagination = paginationObject(searchObj);

            let users: any[], totalUsers: number, totalComments: any[];
            const queryObj = {};

            if (request.user.site === 'israelBackOffice') queryObj['site'] = 'israel-today';
            else if (request.user.site === 'ittihadBackOffice') queryObj['site'] = 'ittihad-today';

            if (searchObj.sortField === 'totalComments' || searchObj.sortField === 'email') pagination.sort = {};
            if (searchObj.search && searchObj.search !== '') {
                queryObj['$or'] = [
                    {
                        status: {
                            $regex: searchObj.search.replace(/[^a-zA-Z0-9 ]/g, ''),
                            $options: 'i',
                        },
                    },
                    {
                        name: {
                            $regex: encrypt(searchObj.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        site: {
                            $regex: searchObj.search.replace(/[^a-zA-Z0-9 ]/g, ''),
                            $options: 'i',
                        },
                    },
                    {
                        email: {
                            $regex: encrypt(searchObj.search.toLowerCase()),
                            $options: 'i',
                        },
                    },
                    {
                        device: {
                            $regex: searchObj.search.replace(/[^a-zA-Z0-9 ]/g, ''),
                            $options: 'i',
                        },
                    },
                ];

                const keywordType = getKeywordType(searchObj.search);
                if (keywordType === 'number') {
                    const numericKeyword = parseInt(searchObj.search);
                    queryObj['$or'].push({ row_id: numericKeyword });
                } else if (keywordType === 'date') {
                    const dateKeyword = new Date(searchObj.search);
                    queryObj['$or'].push({ updatedAt: dateKeyword });
                    queryObj['$or'].push({ lastSeen: dateKeyword });
                }
            }
            if (request.user.site === 'israelBackOffice') {
                [users, totalUsers, totalComments] = await Promise.all([
                    this.ISRAEL_User.find(queryObj).sort(pagination.sort).select('-password').lean(),
                    this.ISRAEL_User.countDocuments(queryObj),
                    this.CommnetsModel.find({ site: 'israel-today', userId: { $exists: true } }).lean(),
                ]);
            } else if (request.user.site === 'ittihadBackOffice') {
                [users, totalUsers, totalComments] = await Promise.all([
                    this.ITTIHAD_User.find(queryObj).sort(pagination.sort).select('-password').lean(),
                    this.ITTIHAD_User.countDocuments(queryObj),
                    this.CommnetsModel.find({ site: 'ittihad-today', userId: { $exists: true } }).lean(),
                ]);
            }

            users.forEach((user) => {
                user['totalComments'] = totalComments.filter(
                    (comment) => comment?.userId?.toString() === user?._id?.toString(),
                ).length;
            });

            // users = users.map(async (user) => {
            //   if (user.updatedBy) {
            //     let [superAdmin, adminUser] = await Promise.all([
            //       this.Admin.findById(user.updatedBy)
            //         .select('firstname,lastname')
            //         .lean(),
            //       this.User.findById(user.updatedBy)
            //         .select('firstname,lastname')
            //         .lean(),
            //     ]);

            //     if (superAdmin) {
            //       user.updatedBy = decryptObjectFields(superAdmin, [
            //         'firstname',
            //         'lastname',
            //       ]);
            //     } else if (adminUser) {
            //       user.updatedBy = decryptObjectFields(superAdmin, [
            //         'firstname',
            //         'lastname',
            //       ]);
            //     }
            //   }
            // });

            users = decryptArrayOfObject(users, ['email', 'name', 'lastname']);

            if (searchObj.sortField === 'totalComments') {
                if (searchObj.sortOrder === 'asc') {
                    users = users.sort((a, b) => a.totalComments - b.totalComments);
                } else {
                    users = users.sort((a, b) => b.totalComments - a.totalComments);
                }
            }

            if (searchObj.sortField === 'email') {
                if (searchObj.sortOrder === 'asc') {
                    users = users.sort((a, b) => a.email.localeCompare(b.email));
                } else {
                    users = users.sort((a, b) => b.email.localeCompare(a.email));
                }
            }
            const page = pagination.page; // Page number (1-based)
            const pageSize = pagination.resultPerPage; // Number of users per page

            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;

            return {
                users: users.slice(startIndex, endIndex),
                totalPage: Math.ceil(totalUsers / pagination.resultPerPage) || 0,
            };
        } catch (error) {
            console.log('error in users list', error);
            return error.message;
        }
    }

    async getUser(request: any, userId: string): Promise<ArticlePageUserDocument> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.users.read) return returnMessage('permissionDenied');
            let user: ArticlePageUserDocument, comments: any[];
            if (request.user.site === 'israelBackOffice') {
                [user, comments] = await Promise.all([
                    this.ISRAEL_User.findById(userId).lean(),
                    this.CommnetsModel.find({ userId, site: 'israel-today' }).lean(),
                ]);
            } else if (request.user.site === 'ittihadBackOffice') {
                [user, comments] = await Promise.all([
                    this.ITTIHAD_User.findById(userId).lean(),
                    this.CommnetsModel.find({ userId, site: 'ittihad-today' }).lean(),
                ]);
            }
            if (!user) return returnMessage('userNotFound');
            user.email = decrypt(user.email);
            user.name = decrypt(user.name);
            user['totalComments'] = comments.length;
            user['approvedComments'] = comments.filter((comment) => comment.status === 'approved').length;
            user['notApprovedComments'] = comments.filter((comment) => comment.status === 'notApproved').length;
            user['pendingComments'] = comments.filter((comment) => comment.status === 'pending').length;

            return user;
        } catch (error) {
            console.log('error in get user api', error);
            return error.message;
        }
    }

    async updateUser(request: any, userId: string, status: string): Promise<ArticlePageUserDocument> {
        try {
            const permissions = request.user.permissions;
            if (!permissions.users.write) return returnMessage('permissionDenied');
            let user: ArticlePageUserDocument;
            status === 'active' ? (status = 'active') : (status = 'inActive');
            if (request.user.site === 'israelBackOffice')
                user = await this.ISRAEL_User.findByIdAndUpdate(userId, { status }, { new: true }).lean();
            else if (request.user.site === 'ittihadBackOffice')
                user = await this.ITTIHAD_User.findByIdAndUpdate(userId, { status }, { new: true }).lean();

            if (!user) return returnMessage('userNotFound');
            user.email = decrypt(user.email);
            user.name = decrypt(user.name);

            return user;
        } catch (error) {
            console.log('error in update user api', error);
            return error.message;
        }
    }

    async pendingCounts(user: any): Promise<any> {
        let pendingPageSearchObj: object = {
                israelStatus: 'pending',
            },
            pendingCommentSearchObj: object = {
                status: 'pending',
                site: 'israel-today',
            };

        if (user.site === 'ittihadBackOffice') {
            pendingPageSearchObj = {
                ittihadStatus: 'pending',
            };

            pendingCommentSearchObj['site'] = 'ittihad-today';
        }
        const [pendingPageCount, pendingCommnetCount] = await Promise.all([
            this.Page.countDocuments(pendingPageSearchObj),
            this.CommnetsModel.countDocuments(pendingCommentSearchObj),
        ]);
        return {
            pendingPageCount,
            pendingCommnetCount,
        };
    }

    async downloadExcel(request: any): Promise<UserDocument> {
        try {
            let users: any;
            let totalComments: any[];
            let pipeline = {
                _id: 1,
                site: 1,
                name: 1,
                status: 1,
                row_id: 1,
                device: 1,
                email: 1,
                updatedAt: 1,
                lastSeen: 1,
                createdAt: 1,
                // totalComments: 1,
            };
            if (request.user.site === 'israelBackOffice') {
                [users, totalComments] = await Promise.all([
                    this.ISRAEL_User.find().select(pipeline).lean(),
                    this.CommnetsModel.find({ site: 'israel-today', userId: { $exists: true } })
                        .select('userId')
                        .lean(),
                ]);
            } else if (request.user.site === 'ittihadBackOffice') {
                [users, totalComments] = await Promise.all([
                    this.ITTIHAD_User.find().select(pipeline).lean(),
                    this.CommnetsModel.find({ site: 'ittihad-today', userId: { $exists: true } })
                        .select('userId')
                        .lean(),
                ]);
            }
            users.forEach((user) => {
                user['totalComments'] = totalComments.filter(
                    (comment) => comment.userId.toString() === user._id.toString(),
                ).length;
            });
            users = decryptArrayOfObject(users, ['email', 'name']);
            return this.optimiseExcel(users);
        } catch (error) {
            console.log('error in update user api', error);
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
                return this.optimisedUserXls(element);
            });
            return [].concat.apply([], updatedData);
        } catch (error) {
            console.log('error while exporting users data', error);
            return error.message;
        }
    }

    optimisedUserXls(data: any[]): any {
        try {
            const newArrayData: any[] = [];
            data.forEach((element: any) => {
                let obj = {};
                obj['Id'] = element.row_id || '-';
                obj['Status'] = element.status === 'active' ? 'Active' : 'In-Active';
                obj['Name'] = capitalizeFirstLetter(element.name) || '-';
                obj['Site'] = element.site === 'israel-today' ? 'Israel-Today' : 'Ittihad-Today';
                obj['Comment'] = element.totalComments || '-';
                obj['Lastseen'] = element.lastSeen
                    ? moment(element.lastSeen).tz('Israel').format('DD.MM.YYYY HH:mm')
                    : '-';
                obj['Registration'] = element.createdAt
                    ? moment(element.createdAt).tz('Israel').format('DD.MM.YYYY HH:mm')
                    : '-';
                obj['Email'] = element.email || '-';
                obj['Device'] = element.device || '-';

                newArrayData.push(obj);
            });

            return newArrayData;
        } catch (error) {
            console.log('error while exporting users data', error);
            return error.message;
        }
    }

    async verifyArticlePageAuthToken(token: any): Promise<any> {
        try {
            let currentUser: any;

            const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

            currentUser = await this.ISRAEL_User.findById(decoded.id);

            if (!currentUser) {
                currentUser = await this.ITTIHAD_User.findById(decoded.id);
            }

            if (!currentUser) return returnMessage('userNotFound');

            currentUser.lastSeen = new Date();
            await currentUser.save();

            return currentUser;
        } catch (error) {
            console.log('error in verify article page user token', error);
            return error.message;
        }
    }
}
