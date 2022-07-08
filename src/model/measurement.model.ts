import mongoose from 'mongoose';
import IMeasurement from '../interface/measurement.interface';

export enum Measurement {
  Temperature = 'Temperature',
  Humidity = 'Humidity',
  Pressure = 'Pressure',
  CO2 = 'CO2',
  NO2 = 'NO2',
  O3 = 'O3',
  PM10 = 'PM10',
  PM25 = 'PM25',
  VOC = 'VOC',
  CO = 'CO',
  SO2 = 'SO2',
  NO = 'NO',
  NOx = 'NOx',
  NO2x = 'NO2x',
  O3x = 'O3x',
  PM10x = 'PM10x',
  PM25x = 'PM25x',
}

export enum Units {
  Fahrenheit = 'Fahrenheit',
  Celsius = 'Celsius',
  Degrees = 'Degrees',
  Percent = 'Percent',
  Value = 'Value',
}

const measurementSchema = new mongoose.Schema<IMeasurement>({
  type: {
    type: String,
    enum: Measurement,
    required: true
  },
  unit: {
    type: String,
    enum: Units,
    required: true
  },
  value: {
    type: Number,
    required: true
  }
},
{ _id: false });

export default measurementSchema;
