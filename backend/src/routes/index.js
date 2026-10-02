import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import habitRoutes from './habit.routes.js';
import statisticsRoutes from './statistics.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import calendarRoutes from './calendar.routes.js';

const router = Router();

// Health check endpoint
router.use('/health', healthRoutes);

// Authentication endpoints: /api/auth/*
router.use('/auth', authRoutes);

// User profile endpoints: /api/users/*
router.use('/users', userRoutes);

// Habit management endpoints: /api/habits/*
router.use('/habits', habitRoutes);

// Dashboard endpoints: /api/dashboard/*
router.use('/dashboard', dashboardRoutes);

// Calendar & Heatmap endpoints: /api/calendar/*
router.use('/calendar', calendarRoutes);

// Statistics and analytics endpoints: /api/statistics/*
router.use('/statistics', statisticsRoutes);

export default router;
