import type { Kysely } from 'kysely';
import { BaseRepository } from '../../database/base.repository.js';
import type { Database } from '../../database/schema.js';

export class UserRepository extends BaseRepository<'users'> {
  constructor(db: Kysely<Database>) {
    super(db, 'users');
  }
}
