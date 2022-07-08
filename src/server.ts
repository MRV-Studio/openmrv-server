import dotenv from 'dotenv';
import HttpApp from './http-app';
import UserController from './controller/user.controller';
import AdminController from './controller/admin.controller';
import SuperController from './controller/super.controller';
import AuthController from './controller/auth.controller';
import validateEnv from './util/validateEnv';
import Mongo from './mongo';

dotenv.config();
validateEnv();

const mongo = new Mongo();
mongo.connectToTheDatabase().then(()  => {
  console.log(`database connected`);
});

const httpApp = new HttpApp(
  [
    new AdminController(),
    new AuthController(),
    new UserController(),
    new SuperController(),
  ],
);

httpApp.listen();

