import { expect } from 'chai';
import { before, describe, it, beforeEach, after } from 'mocha';
import { agent as request } from 'supertest';
import userModel from '../model/user.model';
import providerModel from '../model/provider.model';
import geotsModel from '../model/geots.model';
import AdminController from '../controller/admin.controller';
import AuthService from '../service/auth.service';
import validateEnv from '../util/validateEnv';
import dotenv from 'dotenv';
import HttpApp from '../http-app';
import { INGEST_PATH, ADMIN_PATH, ANCHOR_PATH } from '../util/common';
import Mongo from "../mongo";
import IProvider from '../interface/provider.interface';
import IAtmos from '../interface/atmos.interface';
import IPoint from '../interface/point.interface';
import IMetadata from '../interface/metadata.interface';
import { IMeasurement, Measurement, Unit} from '../interface/measurement.interface';
import IAnchor from '../interface/anchor.interface';
import anchorModel from '../model/anchor.model';

process.env.NODE_ENV = 'test';
dotenv.config();
validateEnv();
const mongo = new Mongo();
mongo.connectToTheDatabase().then(() => {
  console.log(`database connected`);
});

let authService: AuthService;
let provider;

export const app = new HttpApp(
  [
    new AdminController(),
  ],
);

const testprovider: IProvider = { name: 'Test Provider', path: '4818b0' };
const ADMIN_API = `http://localhost:3000/api/${ADMIN_PATH}`;

describe('Users', () => {
  before(done => {
    app.listen();
    authService = new AuthService();
    authService.init();
    done();
  });
  after(done => {
    app.close();
    done();
  });

  beforeEach(done => {
    providerModel.deleteMany({}, err => {
      console.log(err);
    });
    geotsModel.deleteMany({}, err => {
      console.log(err);
    });
    anchorModel.deleteMany({}, err => {
      console.log(err);
    });
    userModel.deleteMany({}, () => {
      done();
    });
  });

  describe('POST/admin/${INGEST_PATH}/data', () => {

    it('should create and anchor 1 geots with admin role', async () => {
      await providerModel.create(testprovider)
        .then(() => {
          console.log(
            `${testprovider.name} created`
          );
        })
        .catch((error: string) => { console.log(error); });
      provider = await providerModel.findOne({ name: testprovider.name });
      // create sample data
      const point: IPoint = { type: 'Point', coordinates: [-73.91320, 40.68405] };
      const metadata: IMetadata = { model: 'mri-esm2-ssp126', project_id: 'proj_29lo8RFQiVowh4u5WHdbFSLKExL', source: 'station xxxxx' }
      const m1: IMeasurement = { type: Measurement.Temperature, unit: Unit.Celsius, value: 20 };
      const m2: IMeasurement = { type: Measurement.Humidity, unit: Unit.Percent, value: 30 };
      const atmos: IAtmos = {
        location: point,
        metadata: metadata,
        ts: new Date(),
        measurements: [m1, m2],
      };

      const admin = new userModel({
        username: 'admin', email: 'admin@example.com', password: 'admin',
        roles: [authService.roleUser, authService.roleAdmin], provider: provider
      });
      await admin.save();

      const adminToken = authService.createToken(admin);
      // post to ingest endpoint
      let res = await request(ADMIN_API).post(`/${INGEST_PATH}`).set({ 'x-access-token': [adminToken.token] }).send(atmos);
      expect(res.status).to.equal(200);

      const createdData: IAtmos = res.body.geots;
      expect(createdData.ts).to.equal(atmos.ts.toISOString());

      // anchor endpoint creates a new anchor, creates a hash summary of geots data,
      // and saves it to both the database anchor and the CELO contract
      res = await request(ADMIN_API).post(`/${ANCHOR_PATH}`).set({ 'x-access-token': [adminToken.token] }).send({ limit: 100 });
      expect(res.status).to.equal(200);
      const anchorResponse: IAnchor = res.body.anchor;
      expect(anchorResponse.hash.length).to.equal(64);
      expect(anchorResponse.count).to.equal(1);
    });
  })
});