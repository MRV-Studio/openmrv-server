import { Router, Request, Response, NextFunction } from 'express';
import userModel from '../model/user.model';
import IUser from '../interface/user.interface';
import Controller from '../interface/controller.interface';
import authMiddleware from '../middleware/auth.middleware';
import UserNotFoundException from '../exception/UserNotFoundException';
import HttpException from '../exception/HttpException';
import superMiddleware from '../middleware/super.middleware';
import AuthService from '../service/auth.service';
import logger from '../util/logger';
import * as cmn from '../util/common';

class SuperController implements Controller {
  public path = `/${cmn.SUPER_PATH}`;
  public router = Router();
  private userModel = userModel;
  private authService = new AuthService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/${cmn.USER_PATH}/${cmn.ID_PATH}/:id`, authMiddleware, superMiddleware, this.getUserById);
    this.router.get(`${this.path}/${cmn.USER_PATH}`, authMiddleware, superMiddleware, this.getUsers);
    this.router.get(`${this.path}/${cmn.USER_PATH}/${cmn.COUNT_PATH}`, authMiddleware, superMiddleware, this.getUserCount);
    this.router.post(`${this.path}/${cmn.REGISTER_PATH}`, authMiddleware, superMiddleware, this.register);
    this.router.put(`${this.path}/${cmn.USER_PATH}/${cmn.ID_PATH}/:id`, authMiddleware, superMiddleware, this.updateUser);
    this.router.post(`${this.path}/${cmn.USER_PATH}/${cmn.DISABLE_PATH}/${cmn.ID_PATH}/:id`, authMiddleware, superMiddleware, this.disableUser);
    this.router.delete(`${this.path}/${cmn.USER_PATH}/${cmn.ID_PATH}/:id`, authMiddleware, superMiddleware, this.deleteUser); 
  }
  private getUserById = async (req: Request, res: Response, next: NextFunction) => {
    const user = await this.userModel.findById(req.params.id).populate('roles', '-_id -__v')
      .catch(() => {
        return next(new UserNotFoundException(req.params.id));
      });
    return res.status(200).json(user);
  }

  private getUsers = async (req: Request, res: Response, next: NextFunction) => {
    const users = await this.userModel.find({}).populate('roles', '-_id -__v')
      .catch((error: string) => {
        next(new UserNotFoundException(error));
      });
    return res.status(200).json(users);
  }

  private getUserCount = async (req: Request, res: Response, next: NextFunction) => {
    const userCount = await this.userModel.countDocuments({})
      .catch((error: string) => {
        next(new HttpException(400, error));
      });
    return res.status(200).json(userCount);
  }

  private register = async (req: Request, res: Response, next: NextFunction) => {
    const userData: IUser = req.body;
    const user = await this.authService.register(userData)
      .catch((error: string) => {
        next(new HttpException(400, error));
      });
    return res.status(201).json(user);
  }

  private updateUser = async (req: Request, res: Response, next: NextFunction) => {
    const userData: IUser = req.body;
    const user = await this.userModel.findOneAndUpdate({ _id: req.params.id }, { username: userData.username, password: userData.password })
      .catch((error: string) => {
        next(new HttpException(400, error));
      });
    return res.status(200).json(user);
  }

  private disableUser = async (req: Request, res: Response, next: NextFunction) => {
    const user = await this.userModel.findOneAndUpdate({ _id: req.params.id }, { enabled: false })
      .catch((error: string) => {
        next(new HttpException(400, error));
      });
    logger.log({ level: 'info', message: `user disabled: ${user}` });
    return res.status(200).json(user);
  }
  
  private deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    const user = await this.userModel.findOneAndRemove({ _id: req.params.id })
      .catch((error: string) => {
        next(new HttpException(400, error));
      });
    return res.status(200).json(user);
  }
}

export default SuperController;
