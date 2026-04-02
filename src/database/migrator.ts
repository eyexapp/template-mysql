import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Migrator, FileMigrationProvider, type Kysely } from 'kysely';
import type { Database } from './schema.js';
import { logger } from '../core/logger.js';

export function createMigrator(db: Kysely<Database>): Migrator {
  return new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(import.meta.dirname, 'migrations'),
    }),
  });
}

export async function runMigrations(db: Kysely<Database>): Promise<void> {
  const migrator = createMigrator(db);
  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((result) => {
    if (result.status === 'Success') {
      logger.info({ migration: result.migrationName }, 'Migration applied');
    } else if (result.status === 'Error') {
      logger.error({ migration: result.migrationName }, 'Migration failed');
    }
  });

  if (error) {
    logger.error({ error }, 'Migration error');
    throw error;
  }
}

// CLI entry point: `npm run migrate`
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const { connectToDatabase, disconnectFromDatabase } = await import('./connection.js');
  const db = connectToDatabase();
  try {
    await runMigrations(db);
    logger.info('All migrations applied successfully');
  } finally {
    await disconnectFromDatabase();
  }
}
