import { HttpException } from '@nestjs/common';

export class CustomError extends HttpException {
  constructor(data: any, statusCode: any) {
    super(data, statusCode);
  }
}
