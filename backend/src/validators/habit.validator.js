import { z } from 'zod';

export const VALID_CATEGORIES = [
  'Health',
  'Fitness',
  'Study',
  'Work',
  'Personal',
  'Finance',
  'Mindfulness',
  'Sleep',
  'Nutrition',
  'Other',
];

export const createHabitSchema = z.object({
  name: z.string().trim().min(1, 'Habit name is required').max(100, 'Habit name cannot exceed 100 characters'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
  category: z.string().trim().min(1).default('Other'),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex code (e.g. #6366f1)').default('#6366f1'),
  icon: z.string().trim().min(1).default('Activity'),
  frequency: z.string().trim().min(1).default('Daily'),
  targetCount: z.coerce.number().int().min(1, 'Target count must be at least 1').max(1000).default(1),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Reminder time must be in HH:mm format (e.g. 08:30)').optional().nullable(),
  startDate: z.string().datetime().optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  endDate: z.string().datetime().optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
});

export const updateHabitSchema = createHabitSchema.partial();
