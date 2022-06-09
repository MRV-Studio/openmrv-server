import HttpException from './HttpException';

class WrongAuthenticationTokenException extends HttpException {
  constructor() {
    super(401, 'Expired authentication token, please login');
  }
}

export default WrongAuthenticationTokenException;
