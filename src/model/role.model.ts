import mongoose from 'mongoose';
import IRole from '../interface/role.interface';
import { nanoid } from 'nanoid'

const roleSchema: mongoose.Schema<IRole> = new mongoose.Schema(
  {
    _id: {
      'type': String,
      default: () => nanoid()
    },
    role: { type: String, unique: true },
  },
  {
    toJSON: {
      virtuals: true,
      getters: true,
    },
  },
)

const roleModel = mongoose.model<IRole>('Role', roleSchema);

export default roleModel;
