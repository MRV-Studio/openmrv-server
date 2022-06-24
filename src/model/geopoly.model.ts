import mongoose from 'mongoose';
import IAtmos from '../interface/atmos.interface';
import { nanoid } from 'nanoid'

export enum GeometryType {
  Point = 'Point',
  Polygon = 'Polygon',
  LineString = 'LineString',
}

const geometriesSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: GeometryType,
    required: true
  },
  coordinates: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
},
{ _id: false });

const geometriesCollectionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['GeometryCollection'],
    required: true
  },
  geometries: {
    type: [geometriesSchema],
    required: true
  }
},
{ _id: false });

const geopolySchema: mongoose.Schema<IAtmos> = new mongoose.Schema(
  {
    _id: {
      'type': String,
      default: () => nanoid()
    },
    provider: {
      type: String,
      ref: "Provider",
    },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ts: Date,
    // location: { type: mongoose.Schema.Types.Mixed },
    location: {
      type: geometriesCollectionSchema,
      required: true
    }
  },
);

geopolySchema.index({ location: '2dsphere', ts: 1 });

const geopolyModel = mongoose.model<IAtmos>('Geopoly', geopolySchema);

export default geopolyModel;
