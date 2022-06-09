import mongoose from 'mongoose';
import winston from 'winston';

class Mongo {
  constructor() {
    winston.exceptions.handle(new winston.transports.File({ filename: '/var/log/openmrv-server/exceptions.log' }));
  }

  public async connectToTheDatabase(): Promise<void> {
    const mongodbURI = process.env.NODE_ENV === 'test' ? process.env.MONGODB_TEST_URI : process.env.MONGODB_URI;
    if (process.env.NODE_ENV === 'test') {
      mongoose.set('debug', true);
    }
    console.log('Connecting to MongoDB');
    mongoose.connect(`${mongodbURI}`);
  }
}

export default Mongo;
