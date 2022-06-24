import IGeometry from './point.interface';
import IPolygon from './polygon.interface';

interface ILocation {
  type: string,
  geometries: (IGeometry | IPolygon)[],
}

export default ILocation;
