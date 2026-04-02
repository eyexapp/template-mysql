---
name: security-performance
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - security
  - performance
  - index
  - sql injection
  - connection pool
---

# Security & Performance — MySQL

## Performance

### Indexing Strategy

```sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index (leftmost prefix rule)
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- EXPLAIN to verify index usage
EXPLAIN SELECT * FROM users WHERE email = 'test@test.com';
```

### Kysely Select Optimization

```typescript
// ✅ Select only needed fields
const users = await db
  .selectFrom("users")
  .select(["id", "name", "email"])
  .execute();

// ❌ Avoid selectAll in production queries
db.selectFrom("users").selectAll();
```

### Pagination (Cursor-Based)

```typescript
async function paginate(cursor?: string, limit = 20) {
  let query = db.selectFrom("users").selectAll().orderBy("id", "asc").limit(limit);

  if (cursor) {
    query = query.where("id", ">", cursor);
  }

  return query.execute();
}
```

### Connection Pool (mysql2)

```typescript
createPool({
  connectionLimit: 20,     // Max connections
  waitForConnections: true,
  queueLimit: 0,           // Unlimited queue
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});
```

## Security

### SQL Injection Prevention

```typescript
// ✅ Kysely parameterizes all queries automatically
db.selectFrom("users").where("email", "=", userInput).execute();
// Generated: SELECT * FROM users WHERE email = ?

// ✅ sql template tag for raw SQL — also parameterized
sql`SELECT * FROM users WHERE email = ${userInput}`;

// ❌ NEVER concatenate strings
sql.raw(`SELECT * FROM users WHERE email = '${userInput}'`);
```

### Password Hashing

```typescript
import bcrypt from "bcrypt";

const hash = await bcrypt.hash(password, 12);
const valid = await bcrypt.compare(password, hash);
```

### Connection Security

```typescript
createPool({
  ssl: { rejectUnauthorized: true },  // Enforce TLS
});
```

### Least Privilege

```sql
-- App user with minimal permissions
CREATE USER 'appuser'@'%' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON myapp.* TO 'appuser'@'%';
-- No DROP, ALTER, CREATE, GRANT
```
