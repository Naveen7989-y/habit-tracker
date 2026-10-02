import { errorResponse } from '../utils/response.js';

export const notFound = (req, res, next) => {
  return errorResponse(res, 404, `Endpoint not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND');
};
