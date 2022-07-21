import mongoose from 'mongoose';
import IAnchor from '../interface/anchor.interface';
import { nanoid } from 'nanoid';

const anchorSchema: mongoose.Schema<IAnchor> = new mongoose.Schema(
  {
    _id: {
      'type': String,
      default: () => nanoid()
    },
    provider: {
      type: String,
      ref: "Provider",
    },
    hash: { type: String },
    transaction_hash: {
      type: String,
      default: 'unhashed',
    },
    count: {type: Number, default: 0},
  },
  {
    toJSON: {
      getters: true,
    },
    id: false,
    timestamps: true,
  }
);

const anchorModel = mongoose.model<IAnchor>('Anchor', anchorSchema);

export default anchorModel;
