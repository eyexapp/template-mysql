/// <reference types="vitest/globals" />
import { NotFoundError, ValidationError, ConflictError } from '../src/core/errors.js';

describe('Error classes', () => {
  it('NotFoundError should have 404 status', () => {
    const err = new NotFoundError('user', 42);
    expect(err.statusCode).toBe(404);
    expect(err.message).toContain('42');
    expect(err.name).toBe('NotFoundError');
  });

  it('ValidationError should have 400 status and details', () => {
    const details = [{ field: 'email', message: 'required' }];
    const err = new ValidationError('Invalid input', details);
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual(details);
  });

  it('ConflictError should have 409 status', () => {
    const err = new ConflictError('Duplicate email');
    expect(err.statusCode).toBe(409);
  });
});
