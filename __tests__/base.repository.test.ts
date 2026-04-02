/// <reference types="vitest/globals" />
import { setupTestDatabase, teardownTestDatabase, getTestDb } from './setup.js';
import { UserRepository } from '../src/routes/example/example.repository.js';
import { NotFoundError } from '../src/core/errors.js';

let repo: UserRepository;

beforeAll(async () => {
  await setupTestDatabase();
}, 120_000);

afterAll(async () => {
  await teardownTestDatabase();
}, 30_000);

beforeEach(async () => {
  const db = getTestDb();
  repo = new UserRepository(db);

  // Clean table between tests
  await db.deleteFrom('users').execute();
});

describe('UserRepository', () => {
  it('should create a user and return it with an id', async () => {
    const user = await repo.create({ name: 'Alice', email: 'alice@example.com' });

    expect(user.id).toBeTypeOf('number');
    expect(user.name).toBe('Alice');
    expect(user.email).toBe('alice@example.com');
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });

  it('should find a user by id', async () => {
    const created = await repo.create({ name: 'Bob', email: 'bob@example.com' });
    const found = await repo.findById(created.id);

    expect(found.id).toBe(created.id);
    expect(found.email).toBe('bob@example.com');
  });

  it('should throw NotFoundError for non-existent id', async () => {
    await expect(repo.findById(999999)).rejects.toThrow(NotFoundError);
  });

  it('should list all users', async () => {
    await repo.create({ name: 'A', email: 'a@test.com' });
    await repo.create({ name: 'B', email: 'b@test.com' });

    const all = await repo.findAll();
    expect(all).toHaveLength(2);
  });

  it('should return paginated results', async () => {
    for (let i = 1; i <= 5; i++) {
      await repo.create({ name: `User${i}`, email: `u${i}@test.com` });
    }

    const page = await repo.findPaginated({ page: 1, limit: 2 });

    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(5);
    expect(page.page).toBe(1);
    expect(page.limit).toBe(2);
    expect(page.totalPages).toBe(3);
  });

  it('should update a user', async () => {
    const created = await repo.create({ name: 'Old', email: 'old@test.com' });
    const updated = await repo.updateById(created.id, { name: 'New' });

    expect(updated.name).toBe('New');
    expect(updated.email).toBe('old@test.com');
  });

  it('should throw NotFoundError when updating non-existent id', async () => {
    await expect(repo.updateById(999999, { name: 'X' })).rejects.toThrow(NotFoundError);
  });

  it('should delete a user', async () => {
    const created = await repo.create({ name: 'Del', email: 'del@test.com' });
    await repo.deleteById(created.id);

    await expect(repo.findById(created.id)).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when deleting non-existent id', async () => {
    await expect(repo.deleteById(999999)).rejects.toThrow(NotFoundError);
  });

  it('should count rows', async () => {
    await repo.create({ name: 'C1', email: 'c1@test.com' });
    await repo.create({ name: 'C2', email: 'c2@test.com' });

    const count = await repo.count();
    expect(count).toBe(2);
  });
});
