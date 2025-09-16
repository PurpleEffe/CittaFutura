import { config } from 'dotenv';

config();

const nodeEnv = process.env.NODE_ENV ?? 'development';
const port = Number(process.env.PORT ?? 4000);
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET env variable is required');
}

export const env = {
  nodeEnv,
  port,
  jwtSecret,
  isProduction: nodeEnv === 'production',
};
