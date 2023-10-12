import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class GoogleSignInDto {
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty({ default: '', required: true })
    googleAuthToken: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ default: 'israel-today', required: true })
    site: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ default: '127.0.0.1', required: true })
    ip: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ default: 'web', required: true })
    device: string;
}
