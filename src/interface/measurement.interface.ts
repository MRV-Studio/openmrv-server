export enum Measurement {
  Temperature = 'T',
  Humidity = 'H',
  Pressure = 'P',
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

export enum Unit {
  Fahrenheit = 'F',
  Celsius = 'C',
  Degrees = 'D',
  Percent = 'P',
  Value = 'V',
  Inches = 'I',
}

export interface IMeasurement {
  type: Measurement;
  unit: Unit;
  value: number;
}