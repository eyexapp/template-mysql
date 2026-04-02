# MySQL Express Template

Production-ready TypeScript REST API template with **Express 5**, **Kysely** (type-safe SQL query builder), and **MySQL 8**.

> Architecture, testing, and DX infrastructure are ready — features are left to you.

## Features

- **TypeScript 5.8** — Strict mode, ESM, path aliases (`@/*`)
- **Express 5** — Latest major with native promise support
- **Kysely 0.27** — Type-safe SQL query builder (NOT an ORM — close to raw SQL)
- **mysql2** — Fast MySQL driver with connection pooling
- **Migrations** — Kysely Migrator (file-based, up/down)
- **Zod** — Request validation (body, params, query)
- **Pino** — Structured JSON logging with pino-http
- **Vitest** — Unit + integration tests with `@testcontainers/mysql`
- **ESLint 9** — Flat config with typescript-eslint
- **Prettier** — Consistent formatting
- **Husky** — Pre-commit hooks (lint-staged + commitlint)

## Quick Start

### Prerequisites

- Node.js 20+
- MySQL 8 (local or Docker)
- Docker (for integration tests with testcontainers)

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# Run migrations
npm run migrate

# Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload (tsx) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm test` | Run all tests |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format all files |
| `npm run migrate` | Run pending database migrations |

## Project Structure

```
src/
├── core/                    # Foundation layer
│   ├── config.ts            # Zod-validated environment variables
│   ├── errors.ts            # AppError hierarchy (404, 400, 409, 401, 403)
│   ├── logger.ts            # Pino logger with pino-pretty in dev
│   └── types.ts             # Shared types (BaseEntity, ApiResponse, Pagination)
│
├── database/                # Data layer
│   ├── schema.ts            # Kysely table types (Database interface)
│   ├── connection.ts        # mysql2 pool + Kysely singleton
│   ├── base.repository.ts   # Generic CRUD repository using Kysely
│   ├── migrator.ts          # Kysely Migrator with CLI entry point
│   └── migrations/          # Numbered migration files (up/down)
│       └── 001_initial.ts
│
├── middleware/               # Express middleware
│   ├── async-handler.ts     # Async error wrapper
│   ├── auth.ts              # Bearer auth placeholder
│   ├── error-handler.ts     # Global error → JSON response
│   └── validate.ts          # Zod validation (body/params/query)
│
├── routes/                   # Feature folders
│   ├── health.route.ts      # GET /api/v1/health
│   └── example/             # Demo CRUD feature
│       ├── example.schema.ts      # Zod schemas
│       ├── example.repository.ts  # UserRepository extends BaseRepository
│       └── example.route.ts       # CRUD routes for /api/v1/users
│
├── app.ts                   # Express factory (middleware + routes)
└── server.ts                # Entry point (connect → migrate → listen)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Health check with DB ping |
| `GET` | `/api/v1/users` | List users (paginated: `?page=1&limit=20`) |
| `GET` | `/api/v1/users/:id` | Get user by ID |
| `POST` | `/api/v1/users` | Create user (`{ name, email }`) |
| `PUT` | `/api/v1/users/:id` | Update user |
| `DELETE` | `/api/v1/users/:id` | Delete user |

## Kysely — Not an ORM

Kysely is a **type-safe SQL query builder**, not an ORM. You write SQL-like queries with full TypeScript type safety:

```typescript
// Type-safe query — column names and types are checked at compile time
const users = await db
  .selectFrom('users')
  .select(['id', 'name', 'email'])
  .where('email', 'like', '%@example.com')
  .orderBy('created_at', 'desc')
  .limit(10)
  .execute();
```

### Schema Types

Table types are defined in `src/database/schema.ts` using Kysely's type helpers:

```typescript
import type { Generated, ColumnType } from 'kysely';

interface UsersTable {
  id: Generated<number>;              // auto-increment, read-only on insert
  name: string;
  email: string;
  created_at: ColumnType<Date, Date | undefined, never>;  // readable, optional on insert, never on update
  updated_at: ColumnType<Date, Date | undefined, Date>;    // readable, optional on insert, updatable
}

interface Database {
  users: UsersTable;
}
```

### Adding a New Table

1. **Define table type** in `schema.ts` and add to `Database` interface
2. **Create migration** in `src/database/migrations/` (e.g., `002_products.ts`)
3. **Create feature folder** in `src/routes/` with schema, repository, and route files
4. **Register route** in `src/routes/index.ts`

## Migrations

Migrations use Kysely's schema builder:

```typescript
// src/database/migrations/002_products.ts
import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('products')
    .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('price', 'decimal(10, 2)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(db.fn.now()))
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(db.fn.now()))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('products').execute();
}
```

Run: `npm run migrate`

## Testing

### Unit Tests (no Docker)

```bash
npx vitest run __tests__/errors.test.ts __tests__/validate.test.ts
```

### Integration Tests (Docker required)

```bash
# Requires Docker running — testcontainers spins up a real MySQL instance
npx vitest run __tests__/base.repository.test.ts
```

The integration test setup (`__tests__/setup.ts`) starts a MySQL container, runs migrations, and provides a `getTestDb()` helper.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `MYSQL_HOST` | — | MySQL host |
| `MYSQL_PORT` | `3306` | MySQL port |
| `MYSQL_USER` | — | MySQL user |
| `MYSQL_PASSWORD` | `""` | MySQL password |
| `MYSQL_DATABASE` | — | MySQL database name |
| `LOG_LEVEL` | `info` | Pino log level |

## License

MIT
