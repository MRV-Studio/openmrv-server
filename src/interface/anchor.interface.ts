import IProvider from './provider.interface';

interface IAnchor {
  _id?: string;
  provider?: IProvider;
  hash?: string;
  transaction_id?: string;
}

export default IAnchor;
