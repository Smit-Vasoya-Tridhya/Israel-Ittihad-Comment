import { Controller, Post, Patch, Res, Body, Get, Req, Param, UseGuards, Query } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { Response, Request } from 'express';
import { UserService } from './user.service';
import { CustomError } from 'src/helpers/customError';
import { obfuscateEmail, returnMessage } from 'src/helpers/utils';
import { LoginUserDto } from './dto/login-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateSearchObjectDto } from 'src/common/search_object.dto';
import { ApiTags } from '@nestjs/swagger';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginArticlePageDto } from './dto/login-article-page.dto';
import { ArticlePageRegisterUserDto } from './dto/article-page-create-user.dto';
import { EmailVerifyUserDto } from './dto/email-verify-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { ResetPasswordArticlePageDto } from './dto/reset-password-article-page.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { GoogleSignInDto } from './dto/google-signin.dto';

@Controller('api/v1/user')
@ApiTags('Users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('/register')
    async register(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
        const user = await this.userService.register(createUserDto);
        if (typeof user === 'string') throw new CustomError({ success: false, message: user }, 400);

        res.status(200).json({
            success: true,
            message: returnMessage('registerSuccess'),
            data: user,
        });
    }

    @Get('/google-sign-in')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() request: Request) {}

    @Get('/redirect')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() request: Request, @Res() res: Response) {
        const user = await this.userService.googleLogin(request);

        if (typeof user === 'string') throw new CustomError({ success: false, message: user }, 400);

        res.status(200).json({
            success: true,
            message: returnMessage('registerSuccess'),
            data: user,
        });
    }

    @Post('/register-article-page')
    async articlePageUserRegister(@Body() createUserDto: ArticlePageRegisterUserDto, @Res() res: Response) {
        const user = await this.userService.articlePageUserRegister(createUserDto);
        if (typeof user === 'string') throw new CustomError({ success: false, message: user }, 400);

        res.status(200).json({
            success: true,
            message: returnMessage('verificationMailSent'),
        });
    }

    @Post('/login')
    async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
        const user = await this.userService.login(loginUserDto);
        if (typeof user === 'string') throw new CustomError({ success: false, message: user }, 400);

        res.status(200).json({
            success: true,
            message: returnMessage('otpSent'),
            data: { email: loginUserDto.email },
        });
    }

    @Post('/login-article-page')
    async loginArticlePageUser(@Body() loginUserDto: LoginArticlePageDto, @Res() res: Response) {
        const user = await this.userService.loginArticlePageUser(loginUserDto);
        if (typeof user === 'string') throw new CustomError({ success: false, message: user }, 400);

        res.status(200).json({
            success: true,
            message: returnMessage('userFetched'),
            data: user,
        });
    }

    @Post('/google-sign-in')
    async googleSignIn(@Body() loginUserDto: GoogleSignInDto, @Res() res: Response) {
        const user = await this.userService.googleSignIn(loginUserDto);
        if (typeof user === 'string') throw new CustomError({ success: false, message: user }, 400);

        res.status(200).json({
            success: true,
            data: user,
        });
    }

    @Post('/verifyOtp')
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Res() res: Response) {
        const verifiedUser = await this.userService.verifyOtp(verifyOtpDto);
        if (typeof verifiedUser === 'string') throw new CustomError({ success: false, message: verifiedUser }, 400);

        res.status(200).json({
            success: true,
            message: returnMessage('userVerified'),
            data: verifiedUser,
        });
    }

    @Post('/verify-otp-for-article')
    async verifyOtpForArticlePage(@Body() verifyOtpDto: VerifyOtpDto, @Res() res: Response) {
        const verifiedUser = await this.userService.verifyOtpForArticlePage(verifyOtpDto);
        if (typeof verifiedUser === 'string') throw new CustomError({ success: false, message: verifiedUser }, 400);

        res.status(200).json({
            success: true,
            message: returnMessage('userVerified'),
            data: verifiedUser,
        });
    }

    @Get('/verify-account')
    async verifyUserAccount(@Res() res: Response, @Query() query: EmailVerifyUserDto) {
        const verifiedUser = await this.userService.verifyUserAccount(query);
        if (typeof verifiedUser === 'string') throw new CustomError({ success: false, message: verifiedUser }, 400);

        res.status(200).json({
            success: true,
            message: returnMessage('userVerified'),
        });
    }

    @Post('/forgotPassword')
    async forgotPassword(@Body() email: ForgotPasswordDto, @Res() res: Response) {
        const passwordReset = await this.userService.forgotPassword(email);

        if (typeof passwordReset === 'string') throw new CustomError({ success: false, message: passwordReset }, 400);

        let message = returnMessage('resetEmailSent');
        message = message.replace('{{email}}', obfuscateEmail(email.email));
        res.status(200).json({
            success: true,
            message,
        });
    }

    @Post('/resetPassword')
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Res() res: Response) {
        const passwordReset = await this.userService.resetPassword(resetPasswordDto);

        if (typeof passwordReset === 'string') throw new CustomError({ success: false, message: passwordReset }, 400);

        res.status(200).json({
            success: true,
            message: returnMessage('passwordChanged'),
        });
    }

    @Post('/forgot-password-article-page')
    async forgotPasswordForArticleUser(@Body() email: ForgotPasswordDto, @Res() res: Response) {
        const passwordReset = await this.userService.forgotPasswordForArticleUser(email);

        if (typeof passwordReset === 'string') throw new CustomError({ success: false, message: passwordReset }, 400);

        res.status(200).json({
            success: true,
            message: returnMessage('mailSent'),
        });
    }

    @Post('/reset-password-article-page')
    async resetPasswordArticlePage(@Body() resetPasswordDto: ResetPasswordArticlePageDto, @Res() res: Response) {
        const passwordReset = await this.userService.resetPasswordForArticleUser(resetPasswordDto);

        if (typeof passwordReset === 'string') throw new CustomError({ success: false, message: passwordReset }, 400);

        res.status(200).json({
            success: true,
            message: returnMessage('passwordChanged'),
        });
    }

    @Post('/resend-otp')
    async resendOtp(@Body('email') email: ResendOtpDto, @Res() res: Response) {
        const passwordReset = await this.userService.forgotPasswordForArticleUser(email);

        if (typeof passwordReset === 'string') throw new CustomError({ success: false, message: passwordReset }, 400);

        res.status(200).json({
            success: true,
            message: returnMessage('mailSent'),
        });
    }

    @Post('/usersList')
    async usersList(@Req() request: Request, @Res() res: Response, @Body() searchObj: CreateSearchObjectDto) {
        const users = await this.userService.usersList(request, searchObj);

        if (typeof users === 'string') throw new CustomError({ success: false, message: users }, 400);

        res.status(200).json({
            success: true,
            message: returnMessage('userListFetched'),
            data: users,
        });
    }

    @Get('/getUser/:userId')
    async getUser(@Req() request: Request, @Res() res: Response, @Param('userId') userId: string) {
        const user = await this.userService.getUser(request, userId);

        if (typeof user === 'string') throw new CustomError({ success: false, message: user }, 400);

        res.status(200).json({
            success: true,
            message: returnMessage('userFetched'),
            data: user,
        });
    }

    @Get('/pendingCounts')
    async pendingCounts(@Req() request: Request, @Res() res: Response) {
        const pendingCounts = await this.userService.pendingCounts(request.user);

        res.status(200).json({
            success: true,
            data: pendingCounts,
        });
    }

    @Patch('/updateUser/:userId')
    async updateUser(
        @Req() request: Request,
        @Res() res: Response,
        @Param('userId') userId: string,
        @Body('status') status: string,
    ) {
        const updatedUser = await this.userService.updateUser(request, userId, status);

        if (typeof updatedUser === 'string') throw new CustomError({ success: false, message: updatedUser }, 400);

        res.status(200).json({
            success: true,
            message: returnMessage('userUpdated'),
            data: updatedUser,
        });
    }
}
