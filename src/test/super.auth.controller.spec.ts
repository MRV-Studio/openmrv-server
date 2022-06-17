import { expect } from 'chai';
import { before, after, describe, it, beforeEach } from 'mocha';
import { agent as request } from 'supertest';
import userModel from '../model/user.model';
import IUser from '../interface/user.interface';
import TokenData from '../interface/tokenData.interface';
import AuthController from '../controller/auth.controller';
import UserController from '../controller/user.controller';
import SuperController from '../controller/super.controller';
import AuthService from '../service/auth.service';
import validateEnv from '../util/validateEnv';
import dotenv from 'dotenv';
import HttpApp from '../http-app';
import jwt from 'jsonwebtoken';
import { USER_PATH, ID_PATH, SUPER_PATH, AUTH_PATH, COUNT_PATH, DISABLE_PATH, LOGIN_PATH, LOGOUT_PATH, REGISTER_PATH } from '../util/common';

process.env.NODE_ENV = 'test';
dotenv.config();
validateEnv();
let authService: AuthService;

export const app = new HttpApp(
  [
    new AuthController(),
    new UserController(),
    new SuperController(),
  ],
);
const SUPER_API = `http://localhost:3000/api/${SUPER_PATH}`;
const AUTH_API = `http://localhost:3000/api/${AUTH_PATH}`;
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
    userModel.deleteMany({}, () => {
      done();
    });
  });

  describe('GET /users', () => {
    it('should return AuthenticationTokenMissingException with no token', async () => {
      const users = [
        { username: 'User1', email: 'user1@example.com', password: 'mypass1', roles: [authService.roleUser] },
        { username: 'User2', email: 'user2@example.com', password: 'mypass2', roles: [authService.roleUser] }
      ];
      await userModel.insertMany(users);

      const res = await request(SUPER_API).get(`/${USER_PATH}`);
      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Authentication token missing');
    });

    it('should return AccessedDeniedException with token with userRole only', async () => {
      const users = [
        { username: 'User1', email: 'user1@example.com', password: 'mypass1', roles: [authService.roleUser] },
        { username: 'User2', email: 'user2@example.com', password: 'mypass2', roles: [authService.roleUser] }
      ];
      await userModel.insertMany(users);

      const user = new userModel({ username: 'User3', email: 'user3@example.com', password: 'mypass1', roles: [authService.roleUser] });
      await user.save();
      const token = authService.createToken(user);

      let res = await request(SUPER_API).get(`/${USER_PATH}`).set({ 'x-access-token': [token.token] });
      expect(res.status).to.equal(403);
      expect(res.body.message).to.equal('Access denied');

      res = await request(SUPER_API).get(`/${USER_PATH}/${COUNT_PATH}`).set({ 'x-access-token': [token.token] });
      expect(res.status).to.equal(403);
      expect(res.body.message).to.equal('Access denied');
    });

    it('should return all users and count on request with super role', async () => {
      const users = [
        { username: 'User1', email: 'user1@example.com', password: 'mypass1', roles: [authService.roleUser] },
        { username: 'User2', email: 'user2@example.com', password: 'mypass2', roles: [authService.roleUser] }
      ];
      await userModel.insertMany(users);

      const user = new userModel({ username: 'super', email: 'super@example.com', password: 'super', roles: [authService.roleUser, authService.roleAdmin, authService.roleSuper] });
      await user.save();

      const token = authService.createToken(user);
      let res = await request(SUPER_API).get(`/${USER_PATH}`).set({ 'x-access-token': [token.token] });
      expect(res.status).to.equal(200);
      expect(res.body.length).to.equal(3);

      const user1: IUser = res.body[0];
      expect(user1.username).to.equal('User1');
      expect(user1).not.to.have.property('password');
      expect(authService.hasRole(user1, authService.roleUser)).to.be.true;
      expect(authService.hasRole(user1, authService.roleAdmin)).to.be.false;
      expect(authService.hasRole(user1, authService.roleSuper)).to.be.false;

      res = await request(SUPER_API).get(`/${USER_PATH}/${COUNT_PATH}`).set({ 'x-access-token': [token.token] });
      expect(res.status).to.equal(200);
      expect(res.body).to.equal(3);
    });
  });

  describe('GET/user/:id', () => {
    it('should return AuthenticationTokenMissingException on missing token', async () => {
      const user = new userModel({ username: 'User1', email: 'user1@example.com', password: 'mypass1' });
      await user.save();
      const res = await request(SUPER_API).get(`/${USER_PATH}/${ID_PATH}/${user._id}`);
      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Authentication token missing');
    });

    it('should return AccessedDeniedException with token with userRole only', async () => {
      const user = new userModel({ username: 'User1', email: 'user1@example.com', password: 'mypass1', roles: [authService.roleUser] });
      await user.save();
      const token = authService.createToken(user);
      const res = await request(SUPER_API).get(`/${USER_PATH}/${ID_PATH}/${user._id}`).set({ 'x-access-token': [token.token] });
      expect(res.status).to.equal(403);
      expect(res.body.message).to.equal('Access denied');
    });

    it('should return user on request with admin role ', async () => {
      //create second user and token, attempt to auth first user with second token
      let user1 = new userModel({ username: 'User1', email: 'user1@example.com', password: 'mypass1', roles: [authService.roleUser] });
      await user1.save();
      const userSuper = new userModel({ username: 'super', email: 'super@example.com', password: 'super', roles: [authService.roleUser, authService.roleAdmin, authService.roleSuper] });
      await userSuper.save();
      const superToken = authService.createToken(userSuper);
      let res = await request(SUPER_API).get(`/${USER_PATH}/${ID_PATH}/${user1._id}`).set({ 'x-access-token': [superToken.token] });
      expect(res.status).to.equal(200);

      user1 = res.body;
      expect(user1.username).to.equal('User1');
      expect(user1).not.to.have.property('password');
      expect(authService.hasRole(user1, authService.roleUser)).to.be.true;
      expect(authService.hasRole(user1, authService.roleAdmin)).to.be.false;
      expect(authService.hasRole(user1, authService.roleSuper)).to.be.false;


      res = await request(SUPER_API).post(`/${USER_PATH}/${DISABLE_PATH}/${ID_PATH}/${user1._id}`).set({ 'x-access-token': [superToken.token] });
      const emailandpassword = { email: user1.email, password: user1.password };
      res = await request(AUTH_API).post(`/${LOGIN_PATH}`).send(emailandpassword);
      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Unauthorized');
    });
  });

  describe('admin/POST/register, auth/POST/login', () => {
    it('should create a user if email not taken and login and fetch user object from token', async () => {
      const userSuper = new userModel({ username: 'useradmin', email: 'useradmin@example.com', password: 'adminpass', roles: [authService.roleUser, authService.roleAdmin, authService.roleSuper] });
      await userSuper.save();
      const superToken = authService.createToken(userSuper)

      const user = { username: 'User1', email: 'user1@example.com', password: 'mypass1', roles: [authService.roleUser] };
      let res = await request(SUPER_API).post(`/${REGISTER_PATH}`).set({ 'x-access-token': [superToken.token] }).send(user);

      expect(res.status).to.equal(201);

      
      const resUser: IUser = res.body.user;
      expect(resUser).not.to.have.property('password');
      expect(resUser.username).to.equal(user.username);
      expect(resUser.email).to.equal(user.email);

      const createdUser = await userModel.findOne({ email: user.email }).populate('roles', '-_id -__v');
      expect(createdUser.username).to.equal(user.username);
      expect(createdUser.email).to.equal(user.email);
      expect(createdUser.password).to.not.equal(user.password);
      expect(authService.hasRole(createdUser, authService.roleUser)).to.be.true;
      expect(authService.hasRole(createdUser, authService.roleAdmin)).to.be.false;
      expect(authService.hasRole(createdUser, authService.roleSuper)).to.be.false;

      // login workflow:
      // login and receive token
      // decode _id
      // call back to this endpoint with _id and token to populate the client user object
      const emailandpassword = { email: user.email, password: user.password };
      res = await request(AUTH_API).post(`/${LOGIN_PATH}`).send(emailandpassword);
      expect(res.status).to.equal(200);
      const tokenData: TokenData = res.body.tokenData;
      expect(tokenData).to.have.property('token');
      const usertoken = jwt.decode(tokenData.token, { json: true });
      const id = usertoken._id;
      console.log(id);

      res = await request(USER_API).get(`/${ID_PATH}/${id}`).set({ 'x-access-token': [tokenData.token] });
      expect(res.status).to.equal(200);
      let user1 = res.body;
      expect(user1.username).to.equal('User1');
      expect(user1).not.to.have.property('password');
      expect(authService.hasRole(user1, authService.roleUser)).to.be.true;
      expect(authService.hasRole(user1, authService.roleAdmin)).to.be.false;
      expect(authService.hasRole(user1, authService.roleSuper)).to.be.false;

      user1.username = 'User11';
      res = await request(SUPER_API).put(`/${USER_PATH}/${ID_PATH}/${user1._id}`).set({ 'x-access-token': [superToken.token] }).send(user1);
      res = await request(USER_API).get(`/${ID_PATH}/${user1._id}`).set({ 'x-access-token': [tokenData.token] });
      user1 = res.body;
      expect(user1.username).to.equal('User11');
      expect(user1).not.to.have.property('password');
      expect(authService.hasRole(user1, authService.roleUser)).to.be.true;
      expect(authService.hasRole(user1, authService.roleAdmin)).to.be.false;
      expect(authService.hasRole(user1, authService.roleSuper)).to.be.false;

      res = await request(AUTH_API).post(`/${LOGOUT_PATH}`).set({ 'x-access-token': [tokenData.token] });
      expect(res.status).to.equal(200);

      res = await request(SUPER_API).delete(`/${USER_PATH}/${ID_PATH}/${user1._id}`).set({ 'x-access-token': [superToken.token] }).send(user1);
      expect(res.status).to.equal(200);
      res = await request(USER_API).get(`/${ID_PATH}/${user1._id}`).set({ 'x-access-token': [tokenData.token] });
      expect(res.status).to.equal(404);
    });
  });
});