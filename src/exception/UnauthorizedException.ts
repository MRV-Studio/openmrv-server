import HttpException from './HttpException';

class UnauthorizedException extends HttpException {
  constructor() {
    super(401, 'Unauthorized');
  }
}

export default UnauthorizedException;
