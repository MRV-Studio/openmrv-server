import { NextFunction, Response } from 'express';
import AuthService from '../service/auth.service';
import AccessDeniedException from '../exception/AccessDeniedException';
import RequestWithUser from '../interface/requestWithUser.interface';
import IUser from '../interface/user.interface';
import logger from '../util/logger';

const authService = new AuthService();
authService.init();

async function adminMiddleware(request: RequestWithUser, response: Response, next: NextFunction): Promise<void> {
  const user: IUser = request.user;

  if (user && authService.hasRole(user, authService.roleAdmin)) { // check for adminRole
    next();
  } else {
    logger.log({ level: 'warn', message: `admin access denied: ${request.originalUrl}` });
    next(new AccessDeniedException());
  }
}
export default adminMiddleware;