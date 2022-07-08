import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import IProvider from '../interface/provider.interface';
import userModel from '../model/user.model';
import roleModel from '../model/role.model';
import providerModel from '../model/provider.model';
import geotsModel from '../model/geots.model';
import AuthService from '../service/auth.service';
import validateEnv from '../util/validateEnv';
import dotenv from 'dotenv';
import Mongo from "../mongo";

process.env.NODE_ENV = 'test';

dotenv.config();
validateEnv();
const mongo = new Mongo();
mongo.connectToTheDatabase().then(() => {
  console.log(`database connected`);
});

const testprovider: IProvider = { name: 'Test Provider', path: '4818b0' };

const roles = [
  { role: 'user' },
  { role: 'admin' },
  { role: 'validator' },
  { role: 'super' },
];

describe('Test Provider, Role and User Data', () => {
  beforeEach(done => {
    providerModel.deleteMany({}, err => {
      console.log(err);
    });
    geotsModel.deleteMany({}, err => {
      console.log(err);
    });
    roleModel.deleteMany({}, err => {
      console.log(err);
    });
    userModel.deleteMany({}, () => {
      done();
    });
  });

  describe('test-level provider, roles, and users', () => {
    it('should create 1 provider, 4 roles, 4 users', async () => {
      await providerModel.create(testprovider)
        .then(() => {
          console.log(
            `${testprovider.name} created`
          );
        })
        .catch((error: string) => { console.log(error); });

      const provider = await providerModel.findOne({ name: testprovider.name });

      await roleModel.insertMany(roles)
        .then(() => {
          console.log(
            `${roles.length} roles created`
          );
        })
        .catch((error: string) => { console.log(error); });

      const authService = new AuthService();
      await authService.init();

      const superPassword = 'super-password';
      const sup = new userModel({
        provider: provider,
        username: 'super', email: 'super@test.com', password: superPassword,
        roles: [authService.roleUser, authService.roleAdmin, authService.roleSuper]
      });
      await sup.save();

      const adminPassword = 'admin-password';
      const admin = new userModel({
        provider: provider,
        username: 'admin', email: 'admin@test.com', password: adminPassword,
        roles: [authService.roleUser, authService.roleAdmin]
      });
      await admin.save();

      const validatorPassword = 'validator-password';
      const validator = new userModel({
        provider: provider,
        username: 'validator', email: 'validator@test.com', password: validatorPassword,
        roles: [authService.roleValidator]
      });
      await validator.save();

      const userPassword = 'user-password';
      const user = new userModel({
        provider: provider,
        username: 'validator', email: 'user@test.com', password: userPassword,
        roles: [authService.roleUser]
      });
      await user.save();

      expect(await providerModel.countDocuments({})).to.equal(1);
      expect(await userModel.countDocuments({})).to.equal(4);
      expect(await roleModel.countDocuments({})).to.equal(4);
    });
  });
});