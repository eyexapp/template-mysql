---
name: architecture
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - architecture
  - mysql
  - kysely
  - express
  - migrations
---

# Architecture — MySQL (Kysely Type-Safe SQL + Express + TypeScript)

## Project Structure

```
src/
├── index.ts                    ← Server entry
├── app.ts                      ← Express app setup
├── routes/
│   └── user.routes.ts
├── controllers/
│   └── user.controller.ts
├── services/
│   └── user.service.ts
├── repositories/
│   └── user.repository.ts      ← Kysely queries
├── schemas/
│   └── user.schema.ts          ← Zod validation
├── middleware/
│   ├── validate.middleware.ts
│   └── error.middleware.ts
├── types/
│   └── database.ts             ← Kysely Database interface
└── lib/
    ├── db.ts                   ← Kysely + mysql2 pool
    └── logger.ts               ← Pino logger
migrations/
├── 001_create_users.ts
└── 002_add_orders.ts
```

## Kysely Database Interface

```typescript
// types/database.ts
import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  users: UsersTable;
  orders: OrdersTable;
}

export interface UsersTable {
  id: Generated<string>;
  name: string;
  email: string;
  password_hash: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;
```

## Kysely Setup

```typescript
// lib/db.ts
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { Database } from "../types/database";

export const db = new Kysely<Database>({
  dialect: new MysqlDialect({
    pool: createPool({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectionLimit: 20,
    }),
  }),
});
```

## Repository (Type-Safe Queries)

```typescript
export class UserRepository {
  async findById(id: string): Promise<User | undefined> {
    return db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst();
  }

  async create(data: NewUser): Promise<string> {
    const result = await db
      .insertInto("users")
      .values(data)
      .executeTakeFirstOrThrow();
    return result.insertId!.toString();
  }

  async update(id: string, data: UserUpdate): Promise<void> {
    await db
      .updateTable("users")
      .set(data)
      .where("id", "=", id)
      .execute();
  }
}
```

## Migrations

```typescript
// migrations/001_create_users.ts
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("users")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey().defaultTo(sql`(UUID())`))
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .addColumn("email", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("password_hash", "varchar(255)", (col) => col.notNull())
    .addColumn("created_at", "timestamp", (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("updated_at", "timestamp", (col) => col.defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("users").execute();
}
```

## Rules

- Kysely for type-safe SQL queries — NOT an ORM (Mongoose, Sequelize, etc.).
- mysql2 pool for connection management.
- Zod for request validation.
- Migrations with `up()` / `down()` functions.
