import { expect } from 'chai';
import { before, describe, it, beforeEach, after } from 'mocha';
import { agent as request } from 'supertest';
import userModel from '../model/user.model';
import providerModel from '../model/provider.model';
import UserController from '../controller/user.controller';
import AuthService from '../service/auth.service';
import validateEnv from '../util/validateEnv';
import dotenv from 'dotenv';
import HttpApp from '../http-app';
import { USER_PATH, ID_PATH } from '../util/common';
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
let provider;

export const app = new HttpApp(
  [
    new UserController(),
  ],
);

const testprovider: IProvider = { name: 'Test Provider' };

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
    userModel.deleteMany({}, () => {
      done();
    });
    providerModel.create(testprovider)
      .then(() => {
        console.log(
          `${testprovider.name} created`
        );
      })
      .catch((error: string) => { console.log(error); });

    provider = providerModel.findOne({ name: testprovider.name });
  });

  describe('GET/user/:id', () => {

    it('should return AuthenticationTokenMissingException on missing token', async () => {

      const user = new userModel({ username: 'User1', email: 'user1@example.com', password: 'mypass1', provider: provider });
      await user.save();
      const res = await request(USER_API).get(`/${ID_PATH}/${user._id}`);
      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Authentication token missing');
    });

    it('should return WrongAuthenticationTokenException with token.id !== request.id', async () => {
      //create second user and token, attempt to auth first user with second token
      const user1 = new userModel({ username: 'User1', email: 'user1@example.com', password: 'mypass1', roles: [authService.roleUser], provider: provider  });
      await user1.save();
      const user2 = new userModel({ username: 'User2', email: 'user2@example.com', password: 'mypass2', roles: [authService.roleUser], provider: provider });
      await user2.save();
      const token = authService.createToken(user2);
      const res = await request(USER_API).get(`/${ID_PATH}/${user1._id}`).set({ 'x-access-token': [token.token] });
      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Expired authentication token, please login');

    });

    it('should return User with token.id === request.id', async () => {
      const user = new userModel({ username: 'User1', email: 'user1@example.com', password: 'mypass1', roles: [authService.roleUser], provider: provider });
      await user.save();
      const token = authService.createToken(user);
      let res = await request(USER_API).get(`/${ID_PATH}/${user._id}`).set({ 'x-access-token': [token.token] });
      expect(res.status).to.equal(200);
      const user1 = res.body;
      expect(user1.username).to.equal('User1');
      expect(user1).not.to.have.property('password');
      expect(authService.hasRole(user1, authService.roleUser)).to.be.true;
      expect(authService.hasRole(user1, authService.roleAdmin)).to.be.false;
      expect(authService.hasRole(user1, authService.roleSuper)).to.be.false;

      await authService.disableUser(user1);
      res = await request(USER_API).get(`/${ID_PATH}/${user1._id}`).set({ 'x-access-token': [token.token] });
      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Unauthorized');
    });
  })
});