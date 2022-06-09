import { Router, Request, Response, NextFunction } from 'express';
import userModel from '../model/user.model';
import Controller from '../interface/controller.interface';
import userMiddleware from '../middleware/user.middleware';
import UserNotFoundException from '../exception/UserNotFoundException';
import { USER_PATH, ID_PATH } from '../util/common';

// constrains this route to returning only the user with id in token, to populate after login
class UserController implements Controller {
  public path = `/${USER_PATH}`;
  public router = Router();
  private userModel = userModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/${ID_PATH}/:id`, userMiddleware, this.getUserById);
  }

  private getUserById = async (req: Request, res: Response, next: NextFunction) => {
    const user = await this.userModel.findById(req.params.id)
      .populate('roles', '-_id -__v')
      .catch(() => {
        return next(new UserNotFoundException(req.params.id));
      });
    return res.status(200).json(user);
  }

}
export default UserController;
