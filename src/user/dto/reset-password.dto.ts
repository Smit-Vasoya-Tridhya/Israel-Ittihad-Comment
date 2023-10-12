import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Enter the token that you received in the Email',
  })
  token: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Enter new password' })
  password: string;
}
