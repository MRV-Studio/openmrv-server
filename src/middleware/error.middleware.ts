import { NextFunction, Request, Response } from 'express';
import HttpException from '../exception/HttpException';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorMiddleware(error: HttpException, request: Request, response: Response, next: NextFunction): void {
  const status = error.status || 500;
  const message = error.message || 'An error occurred.';
  response
    .status(status)
    .send({
      message,
      status,
    });
}

export default errorMiddleware;
