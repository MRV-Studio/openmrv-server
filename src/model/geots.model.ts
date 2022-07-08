import mongoose from 'mongoose';
import IAtmos from '../interface/atmos.interface';
import { nanoid } from 'nanoid';
import measurementSchema from './measurement.model';

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  },
},
{ _id: false });

const geotsSchema: mongoose.Schema<IAtmos> = new mongoose.Schema(
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
    location: {
      type: pointSchema,
      required: true
    },
    measurements: [measurementSchema],
  },
  {
    toJSON: {
      getters: true,
    },
    id: false,
  },
  // pending 6.1
  // {
  //   timeseries: {
  //     timeField: 'ts',
  //     metaField: 'metadata',
  //     granularity: 'hours'
  //   },
  // }
);
geotsSchema.index({ location: '2dsphere' });
// geotsSchema.index({ location: '2dsphere', ts: 1 });

const atmosModel = mongoose.model<IAtmos>('Geots', geotsSchema);

export default atmosModel;
