import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordArticlePageDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Enter the otp that you received in the Email',
    })
    otp: number;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Enter the email',
    })
    email: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'Enter new password' })
    password: string;
}
