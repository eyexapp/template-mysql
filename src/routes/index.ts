import { Router } from 'express';
import healthRouter from './health.route.js';
import { exampleRouter } from './example/index.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/users', exampleRouter);

export default router;
