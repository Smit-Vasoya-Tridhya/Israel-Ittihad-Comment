import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { HarmfullWordDto } from './HarmfullWord.dto.ts/harmfull-word.dto';
import { HarmfullWordService } from './harmfull-word.service';
import { returnMessage } from 'src/helpers/utils';
import { CustomError } from 'src/helpers/customError';
import { Response } from 'express';
import { CreateSearchObjectDto } from 'src/common/search_object.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('api/v1/harmfullWord')
@ApiTags('Harmfull Word')
export class HarmfullWordController {
  constructor(private readonly HarmfullWordService: HarmfullWordService) {}

  @Post('/createWord')
  async createWords(
    @Res() response: Response,
    @Req() request,
    @Body() createWordDto: HarmfullWordDto,
  ) {
    const newWord = await this.HarmfullWordService.createHarmfullWords(
      createWordDto,
      request,
    );

    if (typeof newWord === 'string')
      throw new CustomError({ success: false, message: newWord }, 400);

    return response.status(200).json({
      success: true,
      message: returnMessage('wordAdded'),
      data: newWord,
    });
  }

  @Post('/allHarmfullWords')
  async getAllWord(
    @Res() response,
    @Req() request,
    @Body() searchObject: CreateSearchObjectDto,
    @Query('pagination') paginaition: boolean,
  ) {
    const WordsData = await this.HarmfullWordService.getAllWords(
      searchObject,
      request,
      paginaition,
    );

    if (typeof WordsData === 'string')
      throw new CustomError({ success: false, message: WordsData }, 400);

    return response.status(200).json({
      success: true,
      message: returnMessage('getAllWord'),
      data: WordsData,
    });
  }

  @Get('/getWord/:id')
  async getWord(@Res() response, @Req() request, @Param('id') _id: string) {
    const existingWord = await this.HarmfullWordService.getWordByID(
      _id,
      request,
    );

    if (typeof existingWord === 'string')
      throw new CustomError({ success: false, message: existingWord }, 400);

    return response.status(HttpStatus.OK).json({
      success: true,
      message: returnMessage('getWordbyID'),
      data: existingWord,
    });
  }

  @Put('/deleteWord/:id')
  async deleteWord(@Res() response, @Param('id') _id: string, @Req() request) {
    const deletedWord = await this.HarmfullWordService.deleteWord(_id, request);

    if (typeof deletedWord === 'string')
      throw new CustomError({ success: false, message: deletedWord }, 400);

    return response.status(HttpStatus.OK).json({
      success: true,
      message: returnMessage('deleteWord'),
      data: deletedWord,
    });
  }

  @Put('/updateWord/:id')
  async updateWord(
    @Res() response,
    @Param('id') _id: string,
    @Body() updateWordDto: HarmfullWordDto,
    @Req() request,
  ) {
    const existingWord = await this.HarmfullWordService.updateWord(
      _id,
      updateWordDto,
      request,
    );

    if (typeof existingWord === 'string')
      throw new CustomError({ success: false, message: existingWord }, 400);

    return response.status(HttpStatus.OK).json({
      success: true,
      message: returnMessage('updateWord'),
      data: existingWord,
    });
  }
}
