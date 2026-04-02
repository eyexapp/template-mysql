import { env } from './core/config.js';
import { logger } from './core/logger.js';
import { connectToDatabase, disconnectFromDatabase } from './database/connection.js';
import { runMigrations } from './database/migrator.js';
import { createApp } from './app.js';

async function main() {
  const db = await connectToDatabase();
  await runMigrations(db);

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    server.close(async () => {
      await disconnectFromDatabase();
      logger.info('Server stopped');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.fatal(err, 'Failed to start server');
  process.exit(1);
});
