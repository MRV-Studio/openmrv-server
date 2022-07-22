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
import { INGEST_PATH, ADMIN_PATH, NEAR_PATH, USER_PATH} from '../util/common';
import Mongo from "../mongo";
import IProvider from '../interface/provider.interface';
import IAtmos from '../interface/atmos.interface';
import IPoint from '../interface/point.interface';
import IMetadata from '../interface/metadata.interface';
import { IMeasurement, Measurement, Unit} from '../interface/measurement.interface';
import INearQueryParams from '../interface/nearqueryparams.interface';
import UserController from '../controller/user.controller';
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
    new UserController(),
  ],
);

const testprovider: IProvider = { name: 'Test Provider', path: '4818b0' };
const ADMIN_API = `http://localhost:3000/api/${ADMIN_PATH}`;
const USER_API = `http://localhost:3000/api/${USER_PATH}`;

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

    it('should return AccessedDeniedException with user role, then create 1 geots with admin role', async () => {
      await providerModel.create(testprovider)
        .then(() => {
          console.log(
            `${testprovider.name} created`
          );
        })
        .catch((error: string) => { console.log(error); });
      provider = await providerModel.findOne({ name: testprovider.name });
      const user = new userModel({ username: 'User', email: 'user@example.com', password: 'mypass1', roles: [authService.roleUser], provider: provider });
      await user.save();
      const token = authService.createToken(user);

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

      // post to ingest endpoint
      let res = await request(ADMIN_API).post(`/${INGEST_PATH}`).set({ 'x-access-token': [token.token] }).send(atmos);
      expect(res.status).to.equal(403);
      expect(res.body.message).to.equal('Access denied');

      const admin = new userModel({
        username: 'admin', email: 'admin@example.com', password: 'admin',
        roles: [authService.roleUser, authService.roleAdmin], provider: provider
      });
      await admin.save();

      const adminToken = authService.createToken(admin);
      res = await request(ADMIN_API).post(`/${INGEST_PATH}`).set({ 'x-access-token': [adminToken.token] }).send(atmos);
      expect(res.status).to.equal(200);

      const createdData: IAtmos = res.body.geots;
      expect(createdData.ts).to.equal(atmos.ts.toISOString());

      // geospatial query for data
      const params: INearQueryParams = { "lon": -73.913, "lat": 40.684, "min": 0, "max": 10000 };
      res = await request(USER_API).get(`/${NEAR_PATH}`).set({ 'x-access-token': [adminToken.token] }).query(params);
      expect(res.status).to.equal(200);

      const queryResponse: IAtmos[] = res.body;
      expect(queryResponse[0].ts).to.equal(createdData.ts);
      expect(queryResponse[0].measurements[0].value).to.equal(m1.value);
      expect(queryResponse[0].measurements[1].value).to.equal(m2.value);
      expect(queryResponse[0].hash.length).to.equal(64);
    });
  })
});