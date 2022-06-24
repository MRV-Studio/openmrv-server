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
import { INGEST_PATH, ADMIN_PATH } from '../util/common';
import Mongo from "../mongo";
import IProvider from '../interface/provider.interface';
import IAtmos from '../interface/atmos.interface';
import IPoint from '../interface/point.interface';
import IMetadata from '../interface/metadata.interface';

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
    userModel.deleteMany({}, () => {
      done();
    });
  });

  describe('POST/admin/${INGEST_PATH}/data', () => {

    it('should return AccessedDeniedException with user role, then create with admin role', async () => {
      await providerModel.create(testprovider)
        .then(() => {
          console.log(
            `${testprovider.name} created`
          );
        })
        .catch((error: string) => { console.log(error); });
      provider = await providerModel.findOne({ name: testprovider.name });
      const user = new userModel({ username: 'User', email: 'user@example.com', password: 'mypass1', roles: [authService.roleUser] });
      await user.save();
      const token = authService.createToken(user);

      const point: IPoint = { type: 'Point', coordinates: [-54.85791380261676, -3.555281316044591] };
      const metadata: IMetadata = { model: 'mri-esm2-ssp126', project_id: 'proj_29lo8RFQiVowh4u5WHdbFSLKExL', source: 'station xxxxx' }
      const atmos: IAtmos = {
        provider: provider,
        location: point,
        metadata: metadata,
        ts: new Date()
      };

      let res = await request(ADMIN_API).post(`/${INGEST_PATH}`).set({ 'x-access-token': [token.token] }).send(atmos);
      expect(res.status).to.equal(403);
      expect(res.body.message).to.equal('Access denied');

      const admin = new userModel({ username: 'admin', email: 'admin@example.com', password: 'admin', roles: [authService.roleUser, authService.roleAdmin] });
      await admin.save();

      const adminToken = authService.createToken(admin);
      res = await request(ADMIN_API).post(`/${INGEST_PATH}`).set({ 'x-access-token': [adminToken.token] }).send(atmos);
      expect(res.status).to.equal(200);

      const createdData: IAtmos = res.body.geots;
      expect(createdData.ts).to.equal(atmos.ts.toISOString());

    });
  })
});