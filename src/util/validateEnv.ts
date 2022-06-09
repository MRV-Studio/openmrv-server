import { cleanEnv, port, str } from 'envalid';

function validateEnv(): void {
  cleanEnv(process.env, {
    MONGODB_TEST_URI: str(),
    MONGODB_URI: str(),
    JWT_SECRET: str(),
    PORT: port(),
  });
}

export default validateEnv;
