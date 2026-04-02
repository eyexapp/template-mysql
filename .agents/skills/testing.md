---
name: testing
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - test
  - vitest
  - testcontainers
  - integration test
---

# Testing — MySQL (Vitest + Testcontainers)

## Unit Tests (Mock Repository)

```typescript
import { describe, it, expect, vi } from "vitest";

describe("UserService", () => {
  const mockRepo = {
    findByEmail: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
  };

  const service = new UserService(mockRepo as any);

  it("should create user", async () => {
    mockRepo.findByEmail.mockResolvedValue(undefined);
    mockRepo.create.mockResolvedValue("new-id");

    const id = await service.create({
      name: "Alice",
      email: "a@b.com",
      password: "password123",
    });

    expect(id).toBe("new-id");
    expect(mockRepo.create).toHaveBeenCalledOnce();
  });
});
```

## Integration Tests (Testcontainers)

```typescript
import { MySqlContainer } from "@testcontainers/mysql";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";

let container: any;
let testDb: Kysely<Database>;

beforeAll(async () => {
  container = await new MySqlContainer("mysql:8").start();
  testDb = new Kysely<Database>({
    dialect: new MysqlDialect({
      pool: createPool({
        host: container.getHost(),
        port: container.getPort(),
        database: container.getDatabase(),
        user: container.getUsername(),
        password: container.getUserPassword(),
      }),
    }),
  });
  // Run migrations
  await runMigrations(testDb);
}, 60000);

afterAll(async () => {
  await testDb.destroy();
  await container.stop();
});

describe("UserRepository (integration)", () => {
  it("should insert and find user", async () => {
    const repo = new UserRepository(testDb);
    const id = await repo.create({
      name: "Alice",
      email: "alice@test.com",
      password_hash: "hash",
    });

    const user = await repo.findById(id);
    expect(user?.name).toBe("Alice");
  });
});
```

## Migration Tests

```typescript
describe("migrations", () => {
  it("should run all migrations without error", async () => {
    await expect(runMigrations(testDb)).resolves.not.toThrow();
  });

  it("should rollback cleanly", async () => {
    await expect(rollbackMigrations(testDb)).resolves.not.toThrow();
  });
});
```

## Rules

- Mock repositories for service unit tests.
- Testcontainers for real MySQL integration tests.
- Test migrations up and down.
- `npx vitest run` for all tests.
