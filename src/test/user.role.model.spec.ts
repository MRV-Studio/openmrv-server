/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import userModel from '../model/user.model';
import roleModel from '../model/role.model';
import providerModel from '../model/provider.model';
import AuthService from '../service/auth.service';
import validateEnv from '../util/validateEnv';
import dotenv from 'dotenv';
import Mongo from "../mongo";
import IProvider from '../interface/provider.interface';

process.env.NODE_ENV = 'test';
dotenv.config();
validateEnv();

const mongo = new Mongo();
mongo.connectToTheDatabase().then(() => {
  console.log(`database connected`);
});

let authService: AuthService;

const testprovider: IProvider = { name: 'Test Provider' };

describe('Users and Roles', () => {
  before(done => {
    authService = new AuthService();
    authService.init();
    done();
  });

  beforeEach(done => {
    providerModel.deleteMany({}, err => {
      console.log(err);
    });
    userModel.deleteMany({}, () => {
      done();
    });
  });

  describe('user/role', () => {
    it('should create 4 users, and verify authService', async () => {
      await providerModel.create(testprovider)
        .then(() => {
          console.log(
            `${testprovider.name} created`
          );
        })
        .catch((error: string) => { console.log(error); });

      const provider = await providerModel.findOne({ name: testprovider.name });

      const users = [
        { username: 'User1', email: 'user1@example.com', password: 'mypass1', provider: provider },
        { username: 'User2', email: 'user2@example.com', password: 'mypass2', provider: provider },
        { username: 'User3', email: 'user3@example.com', password: 'mypass3', provider: provider },
        { username: 'User4', email: 'user4@example.com', password: 'mypass4', provider: provider },
      ];
      await userModel.insertMany(users);

      expect(await userModel.countDocuments({})).to.equal(4);
      expect(await roleModel.countDocuments({})).to.equal(4);

      const user1 = await userModel.findOne({ username: 'User1' });
      expect(user1.username).to.equal('User1');

      await authService.addRole(user1, authService.roleUser);

      let userwithroles = await userModel.findOne({ username: 'User1' }).populate('roles', '-_id -__v');
      // const userQuery = this.user.findById(user1._id);
      expect(userwithroles).to.have.property('roles');
      expect(userwithroles.roles).to.have.lengthOf(1);
      expect(userwithroles.roles[0].role).to.equal(authService.roleUser.role);
      expect(authService.hasRole(userwithroles, authService.roleUser)).to.be.true;
      expect(authService.hasRole(userwithroles, authService.roleAdmin)).to.be.false;
      expect(authService.hasRole(userwithroles, authService.roleSuper)).to.be.false;

      await authService.addRole(user1, authService.roleAdmin);

      userwithroles = await userModel.findOne({ username: 'User1' }).populate('roles', '-_id -__v');
      expect(userwithroles.roles).to.have.lengthOf(2);
      expect(userwithroles.roles[0].role).to.equal(authService.roleUser.role);
      expect(userwithroles.roles[1].role).to.equal(authService.roleAdmin.role);
      expect(authService.hasRole(userwithroles, authService.roleUser)).to.be.true;
      expect(authService.hasRole(userwithroles, authService.roleAdmin)).to.be.true;
      expect(authService.hasRole(userwithroles, authService.roleSuper)).to.be.false;
      //contains original password
      expect(userwithroles.password).to.equal('mypass1');

      userwithroles!.password = 'mynewpass1';
      //save triggers pw hash on change
      await userwithroles.save();
      expect(userwithroles.password).to.not.equal('mynewpass1');
    });
  });
});