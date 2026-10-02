/**
 * Standard API response helper functions
 */

export const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const payload = {
    success: true,
    message,
  };
  if (data !== null) {
    payload.data = data;
  }
  return res.status(statusCode).json(payload);
};

export const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errorCode = 'SERVER_ERROR', errors = null) => {
  const payload = {
    success: false,
    message,
    error: errorCode,
  };
  if (errors !== null) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
};
