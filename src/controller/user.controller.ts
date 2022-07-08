import { Router, Request, Response, NextFunction } from 'express';
import userModel from '../model/user.model';
import geotsModel from '../model/geots.model';
import Controller from '../interface/controller.interface';
import userMiddleware from '../middleware/user.middleware';
import UserNotFoundException from '../exception/UserNotFoundException';
import { USER_PATH, ID_PATH, NEAR_PATH } from '../util/common';
import HttpException from '../exception/HttpException';
import INearQueryParams from '../interface/nearqueryparams.interface';
import authMiddleware from '../middleware/auth.middleware';
import RequestWithUser from '../interface/requestWithUser.interface';

// userMiddleware constrains this route to returning only the user with id in token, to populate after login
class UserController implements Controller {
  public path = `/${USER_PATH}`;
  public router = Router();
  private userModel = userModel;
  private geotsModel = geotsModel;


  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/${ID_PATH}/:id`, userMiddleware, this.getUserById);
    this.router.get(`${this.path}/${NEAR_PATH}`, authMiddleware, this.getNearMeasurements);
  }

  private getUserById = async (req: Request, res: Response, next: NextFunction) => {
    const user = await this.userModel.findById(req.params.id)
      .populate('roles', '-_id -__v')
      .catch(() => {
        return next(new UserNotFoundException(req.params.id));
      });
    return res.status(200).json(user);
  }

  private getNearMeasurements = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { lon, lat, min, max }: INearQueryParams = req.query as unknown as INearQueryParams;
    const measurements = await this.geotsModel.find(
      {
        "provider": req.user.provider._id,
        "location": {
          "$near": {
            "$geometry": {
              "type": "Point", "coordinates": [
                lon,
                lat
              ]
            }, "$minDistance": min, "$maxDistance": max
          }
        }
      }).select('-_id -provider -__v')
      .catch((error: Error) => {
        next(new HttpException(400, `Bad Request: ${error.message}`));
      });
    return res.status(200).json(measurements);
  }
}

export default UserController;
