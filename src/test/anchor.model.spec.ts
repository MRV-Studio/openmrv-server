/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';
import { describe, it } from 'mocha';
import providerModel from '../model/provider.model';
import validateEnv from '../util/validateEnv';
import dotenv from 'dotenv';
import Mongo from "../mongo";
import IProvider from '../interface/provider.interface';
import IPoint from '../interface/point.interface';
import IMetadata from '../interface/metadata.interface';
import geotsModel from '../model/geots.model';
import anchorModel from '../model/anchor.model';
import { IMeasurement, Measurement, Unit} from '../interface/measurement.interface';
import { nanoid } from 'nanoid';
import { Keccak } from 'sha3'
import IAtmos from '../interface/atmos.interface';

process.env.NODE_ENV = 'test';
dotenv.config();
validateEnv();
let provider;

const mongo = new Mongo();
mongo.connectToTheDatabase().then(() => {
  console.log(`database connected`);
});

const testprovider: IProvider = { name: 'Test Provider', path: '4818b0' };
const hasher = new Keccak(256);

describe('Geo', () => {
  before(done => {
    providerModel.deleteMany({}, err => {
      console.log(err);
    });
    geotsModel.deleteMany({}, err => {
      console.log(err);
    });
    anchorModel.deleteMany({}, () => {
      done();
    });
  });

  describe('anchor model', () => {
    it('should create 1 anchor, and anchor 2 geots instances', async () => {
      await providerModel.create(testprovider)
        .then(() => {
          console.log(
            `${testprovider.name} created`
          );
        })
        .catch((error: string) => { console.log(error); });
      provider = await providerModel.findOne({ name: testprovider.name });

      const anchor = new anchorModel({ provider: provider });
      await anchor.save();
      expect(anchor.provider).to.equal(provider);
      const metadata: IMetadata = { model: 'mri-esm2-ssp126', project_id: 'proj_29lo8RFQiVowh4u5WHdbFSLKExL', source: 'station xxxxx' };
      const point: IPoint = { type: 'Point', coordinates: [-73.91320, 40.68405] };

      const m1: IMeasurement = { type: Measurement.Temperature, unit: Unit.Celsius, value: 20 };
      const m2: IMeasurement = { type: Measurement.Humidity, unit: Unit.Percent, value: 30 };
      const atmos: IAtmos = {
        _id: nanoid(),
        location: point,
        metadata: metadata,
        ts: new Date(),
        measurements: [m1, m2],
      };

      atmos.hash = hasher.reset().update(atmos._id).update(JSON.stringify(atmos.measurements)).digest('hex');
      const geots = await geotsModel.create(atmos);
      expect(geots.ts).to.equal(atmos.ts);

      const m3: IMeasurement = { type: Measurement.Pressure, unit: Unit.Inches, value: 29.96 };
      const atmos1: IAtmos = {
        _id: nanoid(),
        location: point,
        metadata: metadata,
        ts: new Date(),
        measurements: [m3],
      };

      atmos1.hash = hasher.reset().update(atmos1._id).update(JSON.stringify(atmos1.measurements)).digest('hex');
      const geots1 = await geotsModel.create(atmos1);
      expect(geots1.ts).to.equal(geots1.ts);
      
      // ensures correct order for hashing
      const anchorables = await geotsModel.find({"anchor": null}).sort({ ts: -1, _id: 1 });
      expect(anchorables.length).to.equal(2);

      hasher.reset();
      for (const anchorable of anchorables) {
        hasher.update(anchorable.hash);
        anchorable.set('anchor', anchor);
        await anchorable.save();
      }
      const anchorHash = hasher.digest('hex');
      anchor.set('hash', anchorHash);
      await anchor.save();

      const anchors = await anchorModel.find({});
      expect(anchors.length).to.equal(1);
      expect(anchors[0].hash).to.equal(anchorHash);
      expect(await geotsModel.find({"anchor": null})).to.be.empty;
    });
  });
});