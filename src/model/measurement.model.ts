import mongoose from 'mongoose';
import { IMeasurement, Measurement, Unit} from '../interface/measurement.interface';

const measurementSchema = new mongoose.Schema<IMeasurement>({
  type: {
    type: String,
    enum: Measurement,
    required: true
  },
  unit: {
    type: String,
    enum: Unit,
    required: true
  },
  value: {
    type: Number,
    required: true
  }
},
{ _id: false });

export default measurementSchema;
