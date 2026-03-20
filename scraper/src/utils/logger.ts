import winston from 'winston';
import { config } from '../config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  config.logging.format === 'json'
    ? winston.format.json()
    : winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
      })
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

export class SourceLogger {
  constructor(private sourceName: string) {}

  info(message: string, meta?: any) {
    logger.info(`[${this.sourceName}] ${message}`, meta);
  }

  error(message: string, error?: any) {
    logger.error(`[${this.sourceName}] ${message}`, { error: error?.message || error });
  }

  warn(message: string, meta?: any) {
    logger.warn(`[${this.sourceName}] ${message}`, meta);
  }

  debug(message: string, meta?: any) {
    logger.debug(`[${this.sourceName}] ${message}`, meta);
  }
}
