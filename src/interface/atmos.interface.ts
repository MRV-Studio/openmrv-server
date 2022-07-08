import IProvider from './provider.interface';
import IMetadata from './metadata.interface';
import IPoint from './point.interface';
import IMeasurement from './measurement.interface';

interface IAtmos {
  _id?: string;
  provider?: IProvider;
  metadata: IMetadata;
  ts: Date;
  location: IPoint;
  measurements: IMeasurement[];
}

export default IAtmos;
