/// <reference types="vitest/globals" />
import { MySqlContainer, type StartedMySqlContainer } from '@testcontainers/mysql';
import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2/promise';
import type { Database } from '../src/database/schema.js';
import { runMigrations } from '../src/database/migrator.js';

let container: StartedMySqlContainer;
let db: Kysely<Database>;

export async function setupTestDatabase() {
  container = await new MySqlContainer('mysql:8.0')
    .withDatabase('testdb')
    .withUsername('testuser')
    .withUserPassword('testpass')
    .withRootPassword('rootpass')
    .start();

  const dialect = new MysqlDialect({
    pool: createPool({
      host: container.getHost(),
      port: container.getPort(),
      user: container.getUsername(),
      password: container.getUserPassword(),
      database: container.getDatabase(),
    }),
  });

  db = new Kysely<Database>({ dialect });

  await runMigrations(db);
  return db;
}

export async function teardownTestDatabase() {
  await db?.destroy();
  await container?.stop();
}

export function getTestDb(): Kysely<Database> {
  return db;
}
