import { IsDate, IsNotEmpty, IsNumber, IsString, MaxLength, isDate } from 'class-validator';

export class updatePageDto {
    @IsString()
    @MaxLength(30)
    @IsNotEmpty()
    israelStatus: string;

    @IsString()
    @MaxLength(30)
    @IsNotEmpty()
    ittihadStatus: string;

    @IsString()
    @MaxLength(30)
    @IsNotEmpty()
    israelPage: string;

    @IsString()
    @MaxLength(30)
    @IsNotEmpty()
    ittihadPage: string;

    @IsString()
    @IsNotEmpty()
    isrealUrl: string;

    @IsString()
    @IsNotEmpty()
    ittihadUrl: string;

    @IsString()
    @MaxLength(30)
    @IsNotEmpty()
    israelPageCreatedBy;

    @IsString()
    @MaxLength(30)
    @IsNotEmpty()
    israelPageUpdatedBy;

    @IsString()
    @MaxLength(30)
    @IsNotEmpty()
    ittihadPageCreatedBy;

    @IsString()
    @MaxLength(30)
    @IsNotEmpty()
    ittihadPageUpdatedBy;

    @IsString()
    @IsNotEmpty()
    israelPageScript: string;

    @IsString()
    @IsNotEmpty()
    ittihadPageScript: string;
}
