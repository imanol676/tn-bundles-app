import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  tnClientId: process.env.TN_CLIENT_ID || '',
  tnClientSecret: process.env.TN_CLIENT_SECRET || '',
  appBaseUrl: process.env.APP_BASE_URL || '',
  tnAccessToken: process.env.TN_ACCESS_TOKEN || ''
};
