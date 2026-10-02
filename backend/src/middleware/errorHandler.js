import { errorResponse } from '../utils/response.js';
import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
  console.error('[Error caught by global handler]:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return errorResponse(res, 400, 'Validation failed', 'VALIDATION_ERROR', formattedErrors);
  }

  // Prisma unique constraint violation (P2002)
  if (err.code === 'P2002') {
    const fields = err.meta?.target ? err.meta.target.join(', ') : 'field';
    return errorResponse(res, 409, `A record with this ${fields} already exists`, 'DUPLICATE_ENTRY');
  }

  // Prisma record not found (P2025)
  if (err.code === 'P2025') {
    return errorResponse(res, 404, 'Record not found in database', 'RECORD_NOT_FOUND');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid authentication token', 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Authentication token has expired', 'TOKEN_EXPIRED');
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  return errorResponse(res, statusCode, message, errorCode);
};
