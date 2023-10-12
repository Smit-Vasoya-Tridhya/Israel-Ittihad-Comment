import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class VerifyOtpDto {
  @IsNumber()
  @ApiProperty({ default: 123456, maxLength: 6 })
  otp: number;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ default: 'admintest@yopmail.com' })
  email: string;
}
