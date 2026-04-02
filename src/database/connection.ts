import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2/promise';
import type { Database } from './schema.js';
import { env, logger } from '../core/index.js';

let db: Kysely<Database> | null = null;

export function createDatabase(config?: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}): Kysely<Database> {
  const { host, port, user, password, database } = config ?? {
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
  };

  const dialect = new MysqlDialect({
    pool: createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
    }),
  });

  return new Kysely<Database>({ dialect });
}

export function connectToDatabase(): Kysely<Database> {
  if (db) return db;

  db = createDatabase();
  logger.info({ database: env.MYSQL_DATABASE }, 'MySQL connection pool created');
  return db;
}

export function getDb(): Kysely<Database> {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase() first.');
  }
  return db;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
    logger.info('MySQL connection pool destroyed');
  }
}
