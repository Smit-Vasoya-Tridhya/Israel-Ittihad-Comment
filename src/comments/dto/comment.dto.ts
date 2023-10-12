import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
    @IsNumber()
    @IsNotEmpty()
    row_id: number;

    @ApiProperty({ default: 'hello' })
    @IsString()
    @MaxLength(30)
    @IsNotEmpty()
    originalComment: string;

    @ApiProperty({ default: 'Hello Word' })
    @IsString()
    @MaxLength(30)
    @IsNotEmpty()
    updatedComment: string;

    @IsString()
    userId: string;

    @ApiProperty({ default: 'israel-today' })
    @IsString()
    @IsNotEmpty()
    site: string;

    @IsArray()
    like: any;

    @ApiProperty({ default: 'Pending' })
    @IsString()
    @IsNotEmpty()
    status: string;

    @IsString()
    pageId: string;

    @IsString()
    approvalDate: Date;

    @IsString()
    updatedBy: string;

    @IsArray()
    replyComments: any[];

    @IsString()
    commentId: string;

    @IsString()
    ip: string;
}
