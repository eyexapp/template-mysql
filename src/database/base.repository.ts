import {
  type Kysely,
  type Insertable,
  type Selectable,
  type Updateable,
  sql,
} from 'kysely';
import type { Database } from './schema.js';
import type { PaginatedResponse, PaginationParams } from '../core/types.js';
import { NotFoundError } from '../core/errors.js';

export abstract class BaseRepository<
  TableName extends keyof Database & string,
  Select = Selectable<Database[TableName]>,
  Insert = Insertable<Database[TableName]>,
  Update = Updateable<Database[TableName]>,
> {
  constructor(
    protected readonly db: Kysely<Database>,
    protected readonly tableName: TableName,
  ) {}

  async findAll(): Promise<Select[]> {
    const rows = await this.db.selectFrom(this.tableName).selectAll().execute();
    return rows as Select[];
  }

  async findPaginated({ page, limit }: PaginationParams): Promise<PaginatedResponse<Select>> {
    const offset = (page - 1) * limit;

    const [items, countResult] = await Promise.all([
      this.db.selectFrom(this.tableName).selectAll().offset(offset).limit(limit).execute(),
      this.db
        .selectFrom(this.tableName)
        .select(sql<number>`count(*)`.as('total'))
        .executeTakeFirstOrThrow(),
    ]);

    const total = Number(countResult.total);

    return {
      items: items as Select[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<Select> {
    const row = await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('id' as never, '=', id as never)
      .executeTakeFirst();

    if (!row) {
      throw new NotFoundError(this.tableName, id);
    }
    return row as Select;
  }

  async create(data: Insert): Promise<Select> {
    const now = new Date();
    const insertData = {
      ...(data as Record<string, unknown>),
      created_at: now,
      updated_at: now,
    };

    const result = await this.db
      .insertInto(this.tableName)
      .values(insertData as never)
      .executeTakeFirstOrThrow();

    const id = Number(result.insertId);
    return this.findById(id);
  }

  async updateById(id: number, data: Update): Promise<Select> {
    const updateData = {
      ...(data as Record<string, unknown>),
      updated_at: new Date(),
    };

    const result = await this.db
      .updateTable(this.tableName)
      .set(updateData as never)
      .where('id' as never, '=', id as never)
      .executeTakeFirstOrThrow();

    if (Number(result.numUpdatedRows) === 0) {
      throw new NotFoundError(this.tableName, id);
    }
    return this.findById(id);
  }

  async deleteById(id: number): Promise<void> {
    const result = await this.db
      .deleteFrom(this.tableName)
      .where('id' as never, '=', id as never)
      .executeTakeFirstOrThrow();

    if (Number(result.numDeletedRows) === 0) {
      throw new NotFoundError(this.tableName, id);
    }
  }

  async count(): Promise<number> {
    const result = await this.db
      .selectFrom(this.tableName)
      .select(sql<number>`count(*)`.as('total'))
      .executeTakeFirstOrThrow();

    return Number(result.total);
  }
}
