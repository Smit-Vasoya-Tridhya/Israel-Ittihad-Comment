import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResendOtpDto {
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    @ApiProperty({ default: 'admintest@yopmail.com' })
    email: string;
}
