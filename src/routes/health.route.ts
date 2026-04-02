import { Router } from 'express';
import { sql } from 'kysely';
import { getDb } from '../database/connection.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const db = getDb();

    let dbStatus = 'unknown';
    try {
      await sql`SELECT 1`.execute(db);
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    res.json({
      success: true,
      data: {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus,
      },
    });
  }),
);

export default router;
