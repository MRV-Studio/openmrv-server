import { createLogger, format, transports } from 'winston';
import { LOG_PATH } from './common';

const {combine, timestamp , prettyPrint } = format;
const logger = createLogger({
  format: combine(
        timestamp(),
        prettyPrint(),
      ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: `${LOG_PATH}/error.log`, level: 'error'}),
    new transports.File({ filename: `${LOG_PATH}/warn.log`, level: 'warn'}),
    new transports.File({ filename: `${LOG_PATH}/info.log`, level: 'info'}),
  ],
  exitOnError: false,
});

export default logger;
