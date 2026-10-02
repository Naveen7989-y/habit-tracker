import { verifyToken } from '../utils/token.js';
import { errorResponse } from '../utils/response.js';
import prisma from '../config/prisma.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Check HTTP-only cookie fallback
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return errorResponse(res, 401, 'Authentication token is missing. Please log in.', 'UNAUTHORIZED');
    }

    // 3. Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 401, 'Session expired. Please log in again.', 'TOKEN_EXPIRED');
      }
      return errorResponse(res, 401, 'Invalid authentication token.', 'INVALID_TOKEN');
    }

    // 4. Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        timezone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return errorResponse(res, 401, 'User account no longer exists.', 'USER_NOT_FOUND');
    }

    // 5. Attach user object to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
