import type { ColumnType, Generated } from 'kysely';

/** Base table columns — every table should include these */
export interface BaseTable {
  id: Generated<number>;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

/**
 * Users table definition.
 * This is the example table — replace or extend with your own tables.
 */
export interface UsersTable extends BaseTable {
  name: string;
  email: string;
}

/**
 * Database schema interface.
 * Add your tables here — Kysely uses this for type-safe query building.
 *
 * @example
 * ```ts
 * export interface Database {
 *   users: UsersTable;
 *   products: ProductsTable;
 * }
 * ```
 */
export interface Database {
  users: UsersTable;
}
