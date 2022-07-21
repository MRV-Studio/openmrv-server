import { cleanEnv, port, str } from 'envalid';

function validateEnv(): void {
  cleanEnv(process.env, {
    MONGODB_TEST_URI: str(),
    MONGODB_URI: str(),
    JWT_SECRET: str(),
    PORT: port(),
    CELO_LOCAL_TESTNET_PRIVKEY: str(),
  });
}

export default validateEnv;
