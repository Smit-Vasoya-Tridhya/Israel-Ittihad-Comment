import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginArticlePageDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ default: 'admintest@yopmail.com', required: true })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ default: 'Abcd@1234', required: true })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ default: '127.0.0.1', required: true })
  ip: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ default: 'web', required: true })
  device: string;
}
