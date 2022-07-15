import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import IUser from '../interface/user.interface';
import IRole from '../interface/role.interface';
import IProvider from '../interface/provider.interface';
import { nanoid } from 'nanoid'

export interface IUserMongo extends IUser, mongoose.Document {
  // duplication to enable mongoose.Document here but avoid in common IUser
  _id: string;
  provider: IProvider;
  username: string;
  email: string;
  password?: string;
  roles: IRole[];
  enabled: boolean;
}

const userSchema: mongoose.Schema<IUser> = new mongoose.Schema(
  {
    _id: {
      'type': String,
      default: () => nanoid()
    },
    provider: {
      type: String,
      ref: "Provider",
    },
    username: String,
    email: { type: String, unique: true, lowercase: true, trim: true },
    password: {
      type: String,
      // get: (): undefined => undefined,
    },
    roles: [
      {
        type: String,
        ref: "Role"
      }
    ],
    enabled: { type: Boolean, default: true }
  },
  {
    toJSON: {
      getters: true,
    },
  },
)

// Before saving the user, hash the password
userSchema.pre('save', function (this: IUserMongo, next: (err?: Error | undefined) => void) {
  if (!this.isModified('password')) {
    return next(undefined);
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    else {
      bcrypt.hash(this.password, salt, (error, hash) => {
        if (error) {
          console.error(`hash error: ${error}`);
          return next(error);
        }
        this.password = hash;
        next(undefined);
      });
    }
  });
});

// Omit the password when returning a user
userSchema.set('toJSON', {
  transform: function (doc: IUserMongo, ret: IUserMongo) {
    delete ret.password;
    return ret;
  }
});

const userModel = mongoose.model<IUserMongo>('User', userSchema);

export default userModel;
