import IProvider from './provider.interface';
import IRole from './role.interface';

interface IUser {
  _id: string;
  provider: IProvider;
  username: string;
  email: string;
  password?: string;
  roles: IRole[];
  enabled: boolean;
}

export default IUser;
