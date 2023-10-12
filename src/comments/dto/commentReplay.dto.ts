import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCommentReplayDto {
    @ApiProperty({ default: 'hello' })
    @IsString()
    @MaxLength(30)
    @IsNotEmpty()
    commentReplay: string;

    @IsString()
    commentId: string;

    @IsString()
    userId: string;

    @IsString()
    site: string;

    @IsArray()
    like: any[];

    @IsString()
    ip: string;
}
