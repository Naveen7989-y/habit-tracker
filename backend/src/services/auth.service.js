import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { generateToken } from '../utils/token.js';

class AuthService {
  /**
   * Register a new user
   */
  async register({ name, email, password, timezone = 'UTC' }) {
    // 1. Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error = new Error('An account with this email address already exists');
      error.statusCode = 409;
      error.errorCode = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    // 2. Hash password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Create user record
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        timezone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 4. Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return { user, token };
  }

  /**
   * Authenticate an existing user
   */
  async login({ email, password }) {
    // 1. Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.errorCode = 'INVALID_CREDENTIALS';
      throw error;
    }

    // 2. Compare password hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.errorCode = 'INVALID_CREDENTIALS';
      throw error;
    }

    // 3. Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // 4. Return sanitized user data (never include hashed password)
    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      timezone: user.timezone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { user: sanitizedUser, token };
  }

  /**
   * Fetch current user profile with summary metrics
   */
  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            habits: { where: { isArchived: false } },
            completions: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.errorCode = 'USER_NOT_FOUND';
      throw error;
    }

    return user;
  }

  /**
   * Update user profile & optionally change password
   */
  async updateProfile(userId, updateData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.errorCode = 'USER_NOT_FOUND';
      throw error;
    }

    const dataToUpdate = {};
    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.avatar !== undefined) dataToUpdate.avatar = updateData.avatar;
    if (updateData.timezone !== undefined) dataToUpdate.timezone = updateData.timezone;

    // Password change verification
    if (updateData.newPassword) {
      const isMatch = await bcrypt.compare(updateData.currentPassword, user.password);
      if (!isMatch) {
        const error = new Error('Current password does not match');
        error.statusCode = 400;
        error.errorCode = 'INVALID_CURRENT_PASSWORD';
        throw error;
      }
      dataToUpdate.password = await bcrypt.hash(updateData.newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}

export const authService = new AuthService();
