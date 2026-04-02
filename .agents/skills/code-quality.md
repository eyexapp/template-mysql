---
name: code-quality
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - code quality
  - naming
  - kysely
  - type safety
  - patterns
---

# Code Quality — MySQL + Kysely

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Table | plural snake_case | `users`, `blog_posts` |
| Column | snake_case | `created_at`, `password_hash` |
| Index | `idx_table_column` | `idx_users_email` |
| Migration | `NNN_description` | `001_create_users` |
| TS interface | PascalCase + Table | `UsersTable` |

## Type-Safe Queries with Kysely

```typescript
// ✅ Compile-time checked — typos caught during build
const users = await db
  .selectFrom("users")
  .select(["id", "name", "email"])  // Only valid columns
  .where("email", "=", email)       // Type-checked
  .execute();

// ✅ Joins — fully typed
const ordersWithUsers = await db
  .selectFrom("orders")
  .innerJoin("users", "users.id", "orders.user_id")
  .select(["orders.id", "orders.total", "users.name"])
  .execute();
```

## Zod Validation

```typescript
import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

export const UserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});
```

## Transaction Pattern

```typescript
async function createUserWithProfile(userData: NewUser, profileData: NewProfile) {
  return db.transaction().execute(async (trx) => {
    const userResult = await trx
      .insertInto("users")
      .values(userData)
      .executeTakeFirstOrThrow();

    await trx
      .insertInto("profiles")
      .values({ ...profileData, user_id: userResult.insertId!.toString() })
      .execute();

    return userResult.insertId!.toString();
  });
}
```

## Raw SQL (When Needed)

```typescript
import { sql } from "kysely";

const result = await sql<{ count: number }>`
  SELECT COUNT(*) as count FROM users WHERE created_at > ${startDate}
`.execute(db);
```
