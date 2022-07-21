import IProvider from './provider.interface';

interface IAnchor {
  _id?: string;
  provider?: IProvider;
  hash?: string;
  transaction_hash?: string;
  count?: number;
}

export default IAnchor;
