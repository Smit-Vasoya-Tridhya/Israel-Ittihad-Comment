import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MaxLength } from 'class-validator';

export class CreateSearchObjectDto {
    @ApiProperty({ default: '' })
    @IsString()
    @MaxLength(10)
    search: string;

    @ApiProperty({ default: 'createdAt' })
    @IsString()
    @MaxLength(10)
    sortField: string;

    @ApiProperty({ default: 'desc' })
    @IsNumber()
    @MaxLength(10)
    sortOrder: string;

    @IsString()
    module: string;

    @ApiProperty({ default: 5 })
    @IsNumber()
    @MaxLength(10)
    itemsPerPage: number;

    @ApiProperty({ default: 1 })
    @IsNumber()
    @MaxLength(10)
    page: number;
}
