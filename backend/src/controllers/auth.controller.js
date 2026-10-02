import { authService } from '../services/auth.service.js';
import { successResponse } from '../utils/response.js';
import { setAuthCookie, clearAuthCookie } from '../utils/token.js';

export const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.register(req.body);
    setAuthCookie(res, token);
    return successResponse(res, 201, 'User registered successfully', { user, token });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);
    setAuthCookie(res, token);
    return successResponse(res, 200, 'Login successful', { user, token });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  clearAuthCookie(res);
  return successResponse(res, 200, 'Logged out successfully');
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return successResponse(res, 200, 'Current user retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};
