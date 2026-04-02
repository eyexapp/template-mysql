/// <reference types="vitest/globals" />
import express from 'express';
import request from 'supertest';
import { validate } from '../src/middleware/validate.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { z } from 'zod';

function buildApp() {
  const app = express();
  app.use(express.json());

  const bodySchema = z.object({ name: z.string().min(1) });
  const querySchema = z.object({ page: z.coerce.number().int().positive() });
  const paramsSchema = z.object({ id: z.coerce.number().int().positive() });

  app.post('/body', validate({ body: bodySchema }), (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/query', validate({ query: querySchema }), (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/params/:id', validate({ params: paramsSchema }), (_req, res) => {
    res.json({ ok: true });
  });

  app.use(errorHandler);
  return app;
}

describe('validate middleware', () => {
  const app = buildApp();

  it('should pass valid body', async () => {
    const res = await request(app).post('/body').send({ name: 'hello' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('should reject invalid body with 400', async () => {
    const res = await request(app).post('/body').send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should pass valid query', async () => {
    const res = await request(app).get('/query?page=1');
    expect(res.status).toBe(200);
  });

  it('should reject invalid query', async () => {
    const res = await request(app).get('/query?page=-1');
    expect(res.status).toBe(400);
  });

  it('should pass valid params', async () => {
    const res = await request(app).get('/params/5');
    expect(res.status).toBe(200);
  });

  it('should reject invalid params', async () => {
    const res = await request(app).get('/params/abc');
    expect(res.status).toBe(400);
  });
});
