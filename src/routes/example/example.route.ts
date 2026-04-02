import { Router } from 'express';
import { getDb } from '../../database/connection.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validate } from '../../middleware/validate.js';
import { UserRepository } from './example.repository.js';
import {
  createUserSchema,
  updateUserSchema,
  idParamSchema,
  paginationSchema,
} from './example.schema.js';
import type { ApiResponse, PaginatedResponse } from '../../core/types.js';
import type { Selectable } from 'kysely';
import type { UsersTable } from '../../database/schema.js';

type Params = Record<string, string>;
type UserRow = Selectable<UsersTable>;

const router = Router();

function getRepo() {
  return new UserRepository(getDb());
}

/** GET /api/v1/users — List users (paginated) */
router.get(
  '/',
  validate({ query: paginationSchema }),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const result = await getRepo().findPaginated({ page, limit });

    const body: ApiResponse<PaginatedResponse<UserRow>> = {
      success: true,
      data: result,
    };
    res.json(body);
  }),
);

/** GET /api/v1/users/:id — Get user by ID */
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as Params;
    const user = await getRepo().findById(Number(id));

    const body: ApiResponse<UserRow> = { success: true, data: user };
    res.json(body);
  }),
);

/** POST /api/v1/users — Create a new user */
router.post(
  '/',
  validate({ body: createUserSchema }),
  asyncHandler(async (req, res) => {
    const user = await getRepo().create(req.body);

    const body: ApiResponse<UserRow> = { success: true, data: user };
    res.status(201).json(body);
  }),
);

/** PUT /api/v1/users/:id — Update user */
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateUserSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as Params;
    const user = await getRepo().updateById(Number(id), req.body);

    const body: ApiResponse<UserRow> = { success: true, data: user };
    res.json(body);
  }),
);

/** DELETE /api/v1/users/:id — Delete user */
router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as Params;
    await getRepo().deleteById(Number(id));
    res.status(204).send();
  }),
);

export default router;
