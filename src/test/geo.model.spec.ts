/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';
import { describe, it} from 'mocha';
import providerModel from '../model/provider.model';
import validateEnv from '../util/validateEnv';
import dotenv from 'dotenv';
import Mongo from "../mongo";
import IProvider from '../interface/provider.interface';
import geopolyModel from '../model/geopoly.model';
import ILocation from '../interface/location.interface';
import IPoint from '../interface/point.interface';
import IMetadata from '../interface/metadata.interface';
import geotsModel from '../model/geots.model';
import IPolygon from '../interface/polygon.interface';
import { IMeasurement, Measurement, Unit} from '../interface/measurement.interface';

process.env.NODE_ENV = 'test';
dotenv.config();
validateEnv();
let provider;

const mongo = new Mongo();
mongo.connectToTheDatabase().then(() => {
  console.log(`database connected`);
});

const testprovider: IProvider = { name: 'Test Provider', path: '4818b0' };

describe('Geo', () => {
  before(done => {
    providerModel.deleteMany({}, err => {
      console.log(err);
    });
    geotsModel.deleteMany({}, err => {
      console.log(err);
    });
    geopolyModel.deleteMany({}, () => {
      done();
    });
  });

  describe('geo instances', () => {
    it('should create 2 geo instances', async () => {
      await providerModel.create(testprovider)
        .then(() => {
          console.log(
            `${testprovider.name} created`
          );
        })
        .catch((error: string) => { console.log(error); });
      provider = await providerModel.findOne({ name: testprovider.name });

      const metadata: IMetadata = { model: 'mri-esm2-ssp126', project_id: 'proj_29lo8RFQiVowh4u5WHdbFSLKExL', source: 'station xxxxx' };
      const point: IPoint = { type: 'Point', coordinates: [-73.91320, 40.68405] };

      const polygon: IPolygon = {
        type: 'Polygon', coordinates: [[
          [-109, 41],
          [-102, 41],
          [-102, 37],
          [-109, 37],
          [-109, 41],
        ]]
      };
      
      const location: ILocation = { 
        type: 'GeometryCollection',
        geometries: [point, polygon]
      };

      const geopoly = new geopolyModel({
        metadata: metadata,
        provider: provider,
        location: location,
        ts: new Date()
      });
      const test = await geopoly.save();
      expect(test.ts).to.equal(geopoly.ts);

      const m1: IMeasurement = { type: Measurement.Temperature, unit: Unit.Celsius, value: 20 };
      const m2: IMeasurement = { type: Measurement.Humidity, unit: Unit.Percent, value: 30 };
      const geots = new geotsModel({
        metadata: metadata,
        provider: provider,
        location: point,
        ts: new Date(),
        measurements: [m1, m2],
        hash: 'hash',
      });
      const test1 = await geots.save();
      expect(test1.ts).to.equal(geots.ts);
    });
  });
});