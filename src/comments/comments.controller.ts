import { RabbitmqService } from './../rabbitmq/rabbitmq.service';
import { Body, Controller, HttpStatus, Param, Post, Req, Res, Put, Query, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/comment.dto';
import { Request, Response } from 'express';
import { CustomError } from 'src/helpers/customError';
import { returnMessage } from 'src/helpers/utils';
import { CreateCommentReplayDto } from './dto/commentReplay.dto';
import { CreateSearchObjectDto } from 'src/common/search_object.dto';

@Controller('api/v1/comments')
@ApiTags('Comments')
export class CommentsController {
    constructor(
        private commentService: CommentsService,
        private readonly rabbitmqService: RabbitmqService,
    ) {
        // this.rabbitmqService.connect();
    }

    @Post('/addComments/:id')
    async createComments(
        @Body() commentsData: CreateCommentDto,
        @Res() response: Response,
        @Req() request: any,
        @Param('id') pageId: string,
    ) {
        try {
            let addCommentData = await this.commentService.createComment(commentsData, request, pageId);

            if (typeof addCommentData === 'string')
                throw new CustomError({ success: false, message: addCommentData }, 400);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: returnMessage('createComment'),
                data: addCommentData,
            });
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: err.message,
            });
        }
    }

    @Post('/addCommentsReplay/:id')
    async createCommentReplay(
        @Res() response: Response,
        @Req() request: any,
        @Param('id') commentId: string,
        @Body() commentsData: CreateCommentReplayDto,
    ) {
        try {
            let addCommentData = await this.commentService.createCommentReplay(commentId, commentsData, request);

            if (typeof addCommentData === 'string')
                throw new CustomError({ success: false, message: addCommentData }, 400);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: returnMessage('createComment'),
                data: addCommentData,
            });
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: err.message,
            });
        }
    }

    @Post('/allCommentsData')
    async getAllCommentsData(
        @Res() response: Response,
        @Body() searchObject: CreateSearchObjectDto,
        @Req() request: any,
        @Query() query: any,
    ) {
        try {
            let allComments = await this.commentService.getAllCommentsData(searchObject, request, query);

            return response.status(HttpStatus.OK).json({ success: true, data: allComments });
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: err.message,
            });
        }
    }

    @Put('/updateCommentsData/:id')
    async updateCommentsData(
        @Res() response: Response,
        @Req() request: Request,
        @Param('id') commentId: string,
        @Body() commentsData: CreateCommentDto,
    ) {
        try {
            let updateComments = await this.commentService.updateCommentsData(commentId, commentsData, request);

            if (typeof updateComments === 'string')
                throw new CustomError({ success: false, message: updateComments }, 400);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: returnMessage('updateComment'),
                data: updateComments,
            });
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: err.message,
            });
        }
    }

    @Post('/updateLike')
    async updateLike(
        @Res() response: Response,
        @Req() request: Request,
        @Query() query: any,
        @Body() commentsData: any,
    ) {
        try {
            let createLike = await this.commentService.createLike(query, commentsData, request);
            if (typeof createLike === 'string') throw new CustomError({ success: false, message: createLike }, 400);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: returnMessage('updateComment'),
                data: createLike,
            });
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: err.message,
            });
        }
    }

    @Get('/getCommentById/:id')
    async getCommentByID(@Res() response: Response, @Req() request: Request, @Param('id') commentId: string) {
        try {
            let findComment = await this.commentService.getCommentByID(commentId, request);

            if (typeof findComment === 'string') throw new CustomError({ success: false, message: findComment }, 400);

            return response.status(HttpStatus.OK).json({
                success: true,
                data: findComment,
            });
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: err.message,
            });
        }
    }
}
