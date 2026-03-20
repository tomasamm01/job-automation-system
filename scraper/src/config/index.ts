import dotenv from 'dotenv';

dotenv.config();

export const config = {
  backend: {
    url: process.env.BACKEND_URL || 'http://localhost:5000',
    apiKey: process.env.BACKEND_API_KEY || '',
    timeout: parseInt(process.env.BACKEND_TIMEOUT || '30000'),
    retries: parseInt(process.env.BACKEND_RETRIES || '3'),
  },
  scraper: {
    batchSize: parseInt(process.env.BATCH_SIZE || '50'),
    concurrency: parseInt(process.env.CONCURRENCY || '3'),
    userAgent: process.env.USER_AGENT || 'JobScraperBot/1.0',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  sources: {
    remoteok: {
      enabled: process.env.REMOTEOK_ENABLED !== 'false',
      schedule: process.env.REMOTEOK_SCHEDULE || '*/30 * * * *',
      apiUrl: 'https://remoteok.com/api',
    },
    linkedin: {
      enabled: process.env.LINKEDIN_ENABLED === 'true',
      schedule: process.env.LINKEDIN_SCHEDULE || '0 */2 * * *',
    },
    getonboard: {
      enabled: process.env.GETONBOARD_ENABLED === 'true',
      schedule: process.env.GETONBOARD_SCHEDULE || '0 */3 * * *',
    },
  },
};
