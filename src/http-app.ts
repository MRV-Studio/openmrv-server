import express from 'express';
import morgan from 'morgan';
import winston from 'winston';
import cors from 'cors';
import Controller from './interface/controller.interface';
import errorMiddleware from './middleware/error.middleware';
import http from 'http';
import { LOG_PATH } from './util/common';

class HttpApp {
  public app: express.Application;
  public server: http.Server;

  constructor(controllers: Controller[]) {
    this.app = express();
    this.app.set('port', (process.env.PORT || 3000));

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cors());
    this.server = http.createServer(this.app);

    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('tiny'));
    }

    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
    winston.exceptions.handle(new winston.transports.File({ filename: `${LOG_PATH}/exceptions.log` }));
  }

  public listen(): void {
    this.server.listen(process.env.PORT, () => {
      console.log(`http server listening on port ${process.env.PORT}`);
    });
  }

  public getServer(): http.Server {
    return this.server;
  }

  public close(): void {
    this.server.close();
  }

  private initializeMiddlewares() {
    this.app.use(express.json());
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller) => {
      this.app.use('/api', controller.router);
    });
  }
}

export default HttpApp;
