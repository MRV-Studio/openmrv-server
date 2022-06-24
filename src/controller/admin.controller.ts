import { Router, Response, NextFunction } from 'express';
import RequestWithUser from '../interface/requestWithUser.interface';
import Controller from '../interface/controller.interface';
import authMiddleware from '../middleware/auth.middleware';
import adminMiddleware from '../middleware/admin.middleware';
import { ADMIN_PATH, INGEST_PATH } from '../util/common';
import HttpException from '../exception/HttpException';
import IngestService from '../service/ingest.service';
import IAtmos from '../interface/atmos.interface';

class AdminController implements Controller {
  public path = `/${ADMIN_PATH}`;
  public router = Router();
  private ingestService = new IngestService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/${INGEST_PATH}`, authMiddleware, adminMiddleware, this.ingest);
  }

  private ingest = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    console.log(`request: ${JSON.stringify(req.body)}`);
    const data: IAtmos = req.body;
    const ret = await this.ingestService.create(data)
      .catch((error: string) => {
        next(new HttpException(400, error));
      });
    res.status(200).json(ret);
  }
}
export default AdminController;
