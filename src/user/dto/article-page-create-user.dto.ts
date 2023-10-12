import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ArticlePageRegisterUserDto {
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
  @ApiProperty({ default: 'Testing', required: true })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    default: 'israel-today',
    description: 'add the site of the User',
    required: true,
  })
  site: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    default: 'Ip address where user try to access',
    required: true,
  })
  ip: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ default: 'Device name like web, mobile', required: true })
  device: string;
}
