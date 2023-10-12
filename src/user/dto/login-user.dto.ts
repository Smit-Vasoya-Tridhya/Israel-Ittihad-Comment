import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ default: 'admintest@yopmail.com' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ default: 'Abcd@1234' })
  password: string;
}
