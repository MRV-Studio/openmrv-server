import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import AuthService from '../service/auth.service';
import AuthenticationTokenMissingException from '../exception/AuthenticationTokenMissingException';
import WrongAuthenticationTokenException from '../exception/WrongAuthenticationTokenException';
import UserNotFoundException from '../exception/UserNotFoundException';
import UnauthorizedException from '../exception/UnauthorizedException'
import DataStoredInToken from '../interface/dataStoredInToken';
import RequestWithUser from '../interface/requestWithUser.interface';
import IUser from '../interface/user.interface';
import userModel from '../model/user.model';
import logger from '../util/logger';

const authService = new AuthService();
authService.init();

// checks for valid token, user enabled w/ userRole, req.id === caller id
async function userMiddleware(request: RequestWithUser, response: Response, next: NextFunction): Promise<void> {
  const token = request.headers['x-access-token'];

  if (token) {
    const param_id: string = request.params.id;
    try {
      const verificationResponse = jwt.verify(token.toString(), process.env.JWT_SECRET) as DataStoredInToken;
      const id = verificationResponse._id;

      if (id === param_id) { // check no param_id (okay for some routes) or requested id === token.id
        const user: IUser = await userModel.findById(id, '-password').populate('roles', '-_id -__v');
        if (user && authService.hasRole(user, authService.roleUser)) {
          if (!user.enabled) {
            logger.log({ level: 'warn', message: `login attempt by disabled user: ${user.email}` });
            next(new UnauthorizedException());
          } else {
            request.user = user;
            next();
          }
        } else {
          logger.log({ level: 'warn', message: `token verify user lookup failed: ${request.originalUrl}` });
          next(new UserNotFoundException(id));
        }
      } else {
        logger.log({ level: 'warn', message: `token verify id mismatch: ${request.originalUrl}` });
        next(new WrongAuthenticationTokenException());
      }
    } catch (error) {
      logger.log({ level: 'warn', message: `token verify failed: ${request.originalUrl}` });
      next(new WrongAuthenticationTokenException());
    }
  } else {
    logger.log({ level: 'warn', message: `no access token provided: ${request.originalUrl}` });
    next(new AuthenticationTokenMissingException());
  }
}
export default userMiddleware;
