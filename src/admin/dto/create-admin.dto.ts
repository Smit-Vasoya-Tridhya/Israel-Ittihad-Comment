import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAdminDto {
  @IsNumber()
  @MaxLength(10)
  @IsNotEmpty()
  row_id: number;

  @ApiProperty({ default: 'active' })
  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  status: string;

  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  lastSeen: string;

  @ApiProperty({ default: 'ittihadBackOffice' })
  @IsString()
  @MaxLength(30)
  site: string;

  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  user_type: string;

  @ApiProperty({ default: 'John' })
  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  firstname: string;

  @ApiProperty({ default: 'Doe' })
  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  lastname: string;

  @ApiProperty({ default: 'johndoe4@gmail.com' })
  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  email: string;

  @ApiProperty({ default: '1234567890' })
  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ default: 'ABC123' })
  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  password: string;

  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  updatedBy: string;

  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  createdBy: string;

  @IsBoolean()
  @IsNotEmpty()
  is_deleted: boolean;
}
