import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { logger } from './core/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  // Security & parsing
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Request logging
  app.use(pinoHttp({ logger }));

  // Routes
  app.use('/api/v1', routes);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
