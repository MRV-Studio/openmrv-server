import IAtmos from '../interface/atmos.interface';
import logger from '../util/logger';
import geotsModel from '../model/geots.model';

class IngestService {

  public async create(data: IAtmos) {
    const geots = await geotsModel.create(data)
      .catch((error: string) => {
        logger.log({ level: 'warn', message: `dataModel.create failed: ${error}` });
      });
    // returns res.body.geots
    return { geots };
  }
}

export default IngestService;
