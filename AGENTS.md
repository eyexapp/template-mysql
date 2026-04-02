# AGENTS.md — MySQL Express API (Kysely + mysql2)

## Project Identity

| Key | Value |
|-----|-------|
| Runtime | Node.js 20+ (ESM) |
| Language | TypeScript 5.8 (strict mode) |
| Category | Database-Backed REST API |
| Framework | Express 5 |
| Query Builder | Kysely 0.27 (NOT an ORM — type-safe SQL) |
| Database | MySQL 8 via mysql2 connection pool |
| Validation | Zod |
| Logging | Pino + pino-http |
| Testing | Vitest + @testcontainers/mysql |
| Linting | ESLint 9 (flat config) + Prettier |
| Git Hooks | Husky + lint-staged + commitlint |

---

## Architecture — Kysely Type-Safe SQL

```
src/
├── core/               ← CONFIG: Zod-validated env, errors, logger, types
│   ├── config.ts       ← Environment validated by Zod schema
│   ├── errors.ts       ← AppError → NotFoundError, ValidationError, ConflictError
│   ├── logger.ts       ← Pino structured logger
│   └── types.ts        ← Shared types
├── database/
│   ├── connection.ts   ← mysql2 pool + Kysely + connect/getDb pattern
│   ├── schema.ts       ← Database interface (Generated<T>, ColumnType<S,I,U>)
│   ├── base.repository.ts ← Generic CRUD + pagination
│   └── migrations/     ← Kysely Migrator (NNN_description.ts, up/down)
├── middleware/
│   ├── async-handler.ts ← asyncHandler() wrapper (mandatory)
│   ├── error-handler.ts ← Global error → JSON response
│   ├── validate.ts      ← Zod validation middleware (body/params/query)
│   └── auth.ts          ← Auth placeholder
├── routes/             ← FEATURE FOLDERS
│   ├── health/         ← /health endpoint
│   └── example/        ← Feature: schema + repository + routes
├── app.ts              ← Express factory (middleware + routes)
└── server.ts           ← Entry: connect → migrate → listen → graceful shutdown
```

### Strict Layer Rules

| Layer | Can Import From | NEVER Imports |
|-------|----------------|---------------|
| `routes/` | database/, middleware/, core/ | Other feature routes/ |
| `database/` | core/ | routes/, middleware/ |
| `middleware/` | core/ | routes/, database/ |
| `core/` | (none — foundational) | routes/, database/ |

---

## Adding New Code — Where Things Go

### New Feature Checklist
1. **Schema type**: Add table interface to `src/database/schema.ts`
2. **Migration**: `src/database/migrations/NNN_create_products.ts` (up/down)
3. **Repository**: `src/routes/products/product.repository.ts` extends `BaseRepository`
4. **Zod schemas**: `src/routes/products/product.schema.ts`
5. **Routes**: `src/routes/products/product.routes.ts`
6. **Register**: Import routes in `src/app.ts`
7. **Tests**: `__tests__/products.test.ts`

### Schema-as-Types (Kysely Pattern)
```typescript
// src/database/schema.ts
import type { Generated, ColumnType } from 'kysely';

export interface ProductTable {
  id: Generated<number>;           // Auto-increment
  name: string;
  price: ColumnType<number, number, number | undefined>;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export interface Database {
  products: ProductTable;
  // ... other tables
}
```

### Migration Pattern
```typescript
// src/database/migrations/002_create_products.ts
import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('products')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('price', 'decimal(10,2)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`NOW()`).notNull())
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`NOW() ON UPDATE NOW()`).notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('products').execute();
}
```

---

## Design & Architecture Principles

### Kysely — Type-Safe SQL, Not ORM
```typescript
// ✅ Kysely query builder — types flow from schema
const products = await db
  .selectFrom('products')
  .selectAll()
  .where('price', '>', 10)
  .orderBy('created_at', 'desc')
  .limit(20)
  .execute();

// ❌ NEVER use raw SQL strings — Kysely prevents SQL injection
```

### BaseRepository Pattern
```typescript
export class ProductRepository extends BaseRepository<'products'> {
  constructor() {
    super('products');
  }

  async findByName(name: string) {
    return this.db.selectFrom('products').selectAll().where('name', '=', name).execute();
  }
}
```

### Validation Middleware
```typescript
router.post('/',
  validate({ body: createProductSchema }),
  asyncHandler(async (req, res) => {
    const product = await repo.create(req.body);
    res.status(201).json({ success: true, data: product });
  })
);
```

---

## Error Handling

### Error Hierarchy
- `AppError` (base) → `NotFoundError`, `ValidationError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`
- Global `errorHandler` middleware → `{ success: false, error: { code, message } }`
- ALL async handlers wrapped with `asyncHandler()` — mandatory

### asyncHandler — NEVER Skip
```typescript
// ✅ MANDATORY
router.get('/:id', asyncHandler(async (req, res) => { ... }));

// ❌ NEVER — unhandled rejection crashes the server
router.get('/:id', async (req, res) => { ... });
```

---

## Code Quality

### Naming Conventions
| Artifact | Convention | Example |
|----------|-----------|---------|
| Schema type | `PascalCase + Table` | `ProductTable` |
| Repository | `name.repository.ts` | `product.repository.ts` |
| Route | `name.routes.ts` | `product.routes.ts` |
| Zod schema | `name.schema.ts` | `product.schema.ts` |
| Migration | `NNN_description.ts` | `002_create_products.ts` |
| DB columns | `snake_case` | `created_at`, `updated_at` |
| IDs | Auto-increment integer | NOT UUID |

### ESM Requirements
- `.js` extensions in all relative imports
- `import type` for type-only imports
- `"type": "module"` in package.json

---

## Testing Strategy

| Level | What | Where | Tool |
|-------|------|-------|------|
| Unit | Errors, validation, middleware | `__tests__/` | Vitest |
| Integration | Routes + real MySQL | `__tests__/` | Vitest + @testcontainers/mysql |

### Testcontainers Pattern
```typescript
// __tests__/setup.ts
import { MySqlContainer } from '@testcontainers/mysql';

let container: StartedMySqlContainer;

export async function setupTestDatabase() {
  container = await new MySqlContainer('mysql:8').start();
  // Connect and migrate...
}
```

---

## Security & Performance

### Security
- Kysely parameterized queries — SQL injection impossible
- Zod validation on all inputs — before database touch
- Environment config validated by Zod — fail fast on bad config
- Auto-increment IDs (not exposing UUID generation strategy)

### Performance
- mysql2 connection pool — reuse connections
- Kysely compiles to efficient SQL — no ORM overhead
- Pagination in BaseRepository — never return full tables
- Graceful shutdown: drain connections, close pool

---

## Commands

| Action | Command |
|--------|---------|
| Dev | `npm run dev` |
| Build | `npm run build` |
| Start | `npm start` |
| Test | `npm test` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Migrate | `npm run migrate` |

---

## Prohibitions — NEVER Do These

1. **NEVER** use raw SQL strings — Kysely query builder only
2. **NEVER** skip `asyncHandler()` on async route handlers
3. **NEVER** skip `.js` extensions in imports (ESM requirement)
4. **NEVER** use UUIDs for IDs — auto-increment integers
5. **NEVER** use camelCase for DB column names — `snake_case` always
6. **NEVER** use `any` type — strict TypeScript
7. **NEVER** modify applied migrations — create new ones
8. **NEVER** skip Zod validation on user input
9. **NEVER** use `console.log` — Pino logger always
10. **NEVER** create database connections outside `connection.ts`
