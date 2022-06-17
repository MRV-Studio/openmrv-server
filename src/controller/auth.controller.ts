import { Request, Response, NextFunction, Router } from 'express';
import UnauthorizedException from '../exception/UnauthorizedException';
import Controller from '../interface/controller.interface';
import TokenData from '../interface/tokenData.interface';
import logger from '../util/logger';
import bcrypt from 'bcrypt';
import userModel from '../model/user.model';
import AuthService from '../service/auth.service';
import {AUTH_PATH, LOGIN_PATH, LOGOUT_PATH} from '../util/common';

class AuthController implements Controller {
  public path = `/${AUTH_PATH}`;
  public router = Router();
  private authService = new AuthService();
  private userModel = userModel;

  constructor() {
    this.initializeRoutes();
    this.authService.init()
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/${LOGIN_PATH}`, this.login);
    this.router.post(`${this.path}/${LOGOUT_PATH}`, this.logout);
  }

  private logout = (request: Request, response: Response) => {
    response.setHeader('x-access-token', []);
    response.status(200).json({});
  }

  private login = async (req: Request, res: Response, next: NextFunction) => {
    const user = await this.userModel.findOne({ email: req.body.email });
    if (user) {
      if (user.enabled) {
        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (isMatch) {
          logger.log({ level: 'info', message: `successful login: : ${req.body.email}` });
          const tokenData: TokenData = this.authService.createToken(user);
          res.status(200).json({ tokenData });
        } else {
          logger.log({ level: 'warn', message: `login attempt failed: password mismatch: ${req.body.email}` });
          next(new UnauthorizedException());
        }
      } else {
        logger.log({ level: 'warn', message: `login attempt by disabled user: ${req.body.email}` });
        next(new UnauthorizedException());
      }
    } else {
      logger.log({ level: 'warn', message: `login attempt failed: no such email: ${req.body.email}` });
      next(new UnauthorizedException());
    }
  }
}

export default AuthController;
