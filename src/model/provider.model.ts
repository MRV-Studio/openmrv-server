import mongoose from 'mongoose';
import IProvider from '../interface/provider.interface';
import { nanoid } from 'nanoid'

const providerSchema: mongoose.Schema<IProvider> = new mongoose.Schema(
  {
    _id: {
      'type': String,
      default: () => nanoid()
    },
    name: { type: String, unique: true },
    path: { type: String, unique: true },
  },
  {
    toJSON: {
      virtuals: true,
      getters: true,
    },
  },
)

const providerModel = mongoose.model<IProvider>('Provider', providerSchema);

export default providerModel;
