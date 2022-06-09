import HttpException from './HttpException';

class AccessDeniedException extends HttpException {
  constructor() {
    super(403, 'Access denied');
  }
}

export default AccessDeniedException;
