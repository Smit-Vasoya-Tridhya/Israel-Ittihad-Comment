import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EmailVerifyUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ default: '', required: true })
  token: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ default: '', required: true })
  email: string;
}
