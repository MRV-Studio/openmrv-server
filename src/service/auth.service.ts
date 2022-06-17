import jwt from 'jsonwebtoken';
import UserWithThatEmailAlreadyExistsException from '../exception/UserWithThatEmailAlreadyExistsException';
import DataStoredInToken from '../interface/dataStoredInToken';
import TokenData from '../interface/tokenData.interface';
import IUser from '../interface/user.interface';
import IRole from '../interface/role.interface';
import userModel from '../model/user.model';
import roleModel from '../model/role.model';
import logger from '../util/logger';

class AuthService {
  private userModel = userModel;

  public userRole = 'user';
  public adminRole = 'admin';
  public validatorRole = 'validator';
  public superRole = 'super';

  public roleUser: IRole;
  public roleAdmin: IRole;
  public roleSuper: IRole;
  public roleValidator: IRole;

  public async init(): Promise<void> {
    this.roleUser = await roleModel.findOne({ role: this.userRole });
    this.roleAdmin = await roleModel.findOne({ role: this.adminRole });
    this.roleSuper = await roleModel.findOne({ role: this.superRole });
    this.roleValidator = await roleModel.findOne({ role: this.validatorRole });
  }

  public async register(userData: IUser) {
    if (
      await this.userModel.findOne({ email: userData.email })
    ) {
      throw new UserWithThatEmailAlreadyExistsException(userData.email);
    }
    // password hashed by userModel.userSchema.pre
    const user = await this.userModel.create(userData)
      .catch((error: string) => {
        logger.log({ level: 'warn', message: `userModel.create failed: ${error}` });
      });
    // returns res.body.user
    return { user };
  }

  public createToken(user: IUser): TokenData {
    const expiresIn = 60 * 60 * 24 * 7; // 7 days
    // enforced by util/validateEnv
    const secret = process.env.JWT_SECRET;
    const dataStoredInToken: DataStoredInToken = {
      _id: user._id,
    };
    return {
      expiresIn,
      token: jwt.sign(dataStoredInToken, secret, { expiresIn }),
    };
  }

  public hasRole(user: IUser, role: IRole): boolean {
    for (let i = 0; i < user.roles.length; i++) {
      if (user.roles[i].role === role.role) {
        return true;
      }
    }
    return false;
  }

  public async addRole(user: IUser, role: IRole): Promise<void> {
    if (!this.hasRole(user, role)) {
      await userModel.findByIdAndUpdate(
        user._id,
        { $push: { roles: role } },
        { new: true, useFindAndModify: false })
        .catch((error: string) => {
          logger.log({ level: 'warn', message: `addRole failed: ${error}` });
        });
    }
  }

  public async disableUser(user: IUser): Promise<void> {
    await userModel.findByIdAndUpdate(user._id, { enabled: false });
  }
}

export default AuthService;
