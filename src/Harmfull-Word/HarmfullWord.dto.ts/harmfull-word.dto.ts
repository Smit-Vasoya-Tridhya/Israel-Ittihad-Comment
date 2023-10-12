import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class HarmfullWordDto {
  @IsNumber()
  @MaxLength(10)
  @IsNotEmpty()
  row_id: number;

  @ApiProperty({ default: 'abc' })
  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  word: string;

  @IsBoolean()
  @IsNotEmpty()
  is_deleted: boolean;

  @ApiProperty()
  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  updatedBy: string;

  @ApiProperty()
  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  site: string;

  @ApiProperty()
  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  createdBy: string;
}
