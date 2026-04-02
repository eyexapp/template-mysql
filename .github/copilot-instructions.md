# MySQL Express Template — Copilot Instructions

## Project Overview

TypeScript REST API template using **Express 5**, **Kysely** (type-safe SQL query builder), and **mysql2** connection pool. This is a production-ready starter — architecture, testing, and DX are ready; features are left to the user.

## Tech Stack

- **Runtime**: Node.js 20+ (ESM)
- **Language**: TypeScript 5.8 (strict mode)
- **Framework**: Express 5
- **Database**: MySQL 8 via mysql2 connection pool
- **Query Builder**: Kysely 0.27 (NOT an ORM — close to raw SQL with full type safety)
- **Migrations**: Kysely Migrator (file-based, up/down)
- **Validation**: Zod
- **Logging**: Pino + pino-http
- **Testing**: Vitest + @testcontainers/mysql (real MySQL in Docker)
- **Linting**: ESLint 9 (flat config) + Prettier
- **Git Hooks**: Husky + lint-staged + commitlint (conventional commits)

## Architecture

```
src/
├── core/           # Config (Zod-validated env), errors, logger, types
├── database/       # Kysely connection, schema types, base repository, migrations
├── middleware/      # async-handler, auth placeholder, error-handler, validate
├── routes/         # Feature folders (health, example/users)
├── app.ts          # Express factory (middleware + routes)
└── server.ts       # Entry point (connect → migrate → listen → graceful shutdown)
```

### Key Patterns

1. **Schema-as-types**: `Database` interface in `schema.ts` with `Generated<T>` and `ColumnType<S,I,U>` for column types. Kysely infers `Selectable`, `Insertable`, `Updateable` from these.
2. **Generic BaseRepository**: `BaseRepository<TableName>` provides CRUD + pagination using Kysely's query builder. Feature repos extend it.
3. **Feature folders**: Each feature (e.g., `routes/example/`) contains schema, repository, and route files.
4. **Validation middleware**: Zod schemas validate body, params, and query via `validate()` middleware.
5. **Error hierarchy**: `AppError` → `NotFoundError`, `ValidationError`, `ConflictError`, etc. Global error handler formats structured JSON responses.

## Coding Conventions

- Use `import type` for type-only imports
- Use `.js` extensions in all relative imports (ESM requirement)
- Use `z.coerce.number().int().positive()` for integer ID params (NOT ObjectId)
- Auto-increment integer IDs (not UUIDs)
- Column names: `snake_case` in DB, keep as-is in TypeScript (no camelCase mapping)
- Timestamps: `created_at` / `updated_at` (MySQL TIMESTAMP DEFAULT NOW())
- All async route handlers wrapped with `asyncHandler()`
- Config via Zod-validated environment variables (`.env` file)

## Database

- **Connection**: `mysql2/promise` pool via `MysqlDialect`
- **Singleton**: `connectToDatabase()` → `getDb()` pattern
- **Migrations**: File-based in `src/database/migrations/`, run with `npm run migrate`
- **New migration**: Create `NNN_description.ts` exporting `{ up, down }` using Kysely schema builder

## Testing

- **Unit tests**: Import directly, no Docker needed (errors, validate middleware)
- **Integration tests**: Use `@testcontainers/mysql` — spins a real MySQL container (Docker required)
- **Test setup**: `__tests__/setup.ts` exports `setupTestDatabase()` / `teardownTestDatabase()`
- **Run**: `npm test` (all), `npx vitest run __tests__/errors.test.ts` (specific)

## Commands

```bash
npm run dev          # Start with tsx (hot reload)
npm run build        # Compile TypeScript
npm start            # Run compiled JS
npm test             # Run all tests
npm run lint         # ESLint check
npm run format       # Prettier format
npm run migrate      # Run pending migrations
```
