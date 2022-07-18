import { Router, Response, NextFunction } from 'express';
import RequestWithUser from '../interface/requestWithUser.interface';
import Controller from '../interface/controller.interface';
import authMiddleware from '../middleware/auth.middleware';
import adminMiddleware from '../middleware/admin.middleware';
import { ADMIN_PATH, INGEST_PATH, ANCHOR_PATH } from '../util/common';
import HttpException from '../exception/HttpException';
import IngestService from '../service/ingest.service';
import AnchorService from '../service/anchor.service';
import IAtmos from '../interface/atmos.interface';
import { nanoid } from 'nanoid';
import { Keccak } from 'sha3'
import { ANCHOR_LIMIT } from '../util/constants';

class AdminController implements Controller {
  public path = `/${ADMIN_PATH}`;
  public router = Router();
  private ingestService = new IngestService();
  private anchorService = new AnchorService();
  private hasher = new Keccak(256);

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/${INGEST_PATH}`, authMiddleware, adminMiddleware, this.ingest);
    this.router.post(`${this.path}/${ANCHOR_PATH}`, authMiddleware, adminMiddleware, this.anchor);
  }

  private ingest = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const data: IAtmos = req.body;
    if (data.location.coordinates.length !== 2 ||
      data.location.coordinates[0] < -180 ||
      data.location.coordinates[0] > 180 ||
      data.location.coordinates[1] < -90 ||
      data.location.coordinates[1] > 90) {
      return next(new HttpException(400, 'Invalid Location'));
    }
    data._id = nanoid();
    data.hash = this.hasher.reset().update(data._id).update(JSON.stringify(data.measurements)).digest('hex');
    data.provider = req.user.provider;
    const ret = await this.ingestService.create(data)
      .catch((error: string) => {
        next(new HttpException(400, error));
      });
    res.status(200).json(ret);
  }

  private anchor = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.body.limit || isNaN(+req.body.limit) || req.body.limit < 1 || req.body.limit > ANCHOR_LIMIT) {
      return next(new HttpException(400, 'Invalid Limit'));
    }
    const ret = await this.anchorService.anchor(req.user.provider, req.body.limit)
      .catch((error: string) => {
        next(new HttpException(400, error));
      });
    res.status(200).json(ret);
  }
}

export default AdminController;
