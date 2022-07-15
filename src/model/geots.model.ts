import { Model, Schema, model } from 'mongoose'
import IAtmos from '../interface/atmos.interface';
import { nanoid } from 'nanoid';
import measurementSchema from './measurement.model';

const pointSchema = new Schema({
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

interface IAtmosMethods {
  getAnchorables(): IAtmos[];
}
type AtmosModel = Model<IAtmos, IAtmosMethods>;
const geotsSchema: Schema<IAtmos, AtmosModel, IAtmosMethods> = new Schema(
  {
    _id: {
      'type': String,
      default: () => nanoid()
    },
    provider: {
      type: String,
      ref: "Provider",
    },
    metadata: { type: Schema.Types.Mixed },
    ts: Date,
    location: {
      type: pointSchema,
      required: true
    },
    measurements: [measurementSchema],
    hash: { type: String, required: true },
    anchor: {
      type: String,
      ref: "Anchor",
    },
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

// WIP
geotsSchema.method('getAnchorables', function getAnchorables() {
  return this.find({"anchor": null}).sort({ ts: -1, _id: 1 })
});

geotsSchema.index({ location: '2dsphere' });
// geotsSchema.index({ location: '2dsphere', ts: 1 });

const atmosModel = model<IAtmos, AtmosModel>('Geots', geotsSchema);

export default atmosModel;
