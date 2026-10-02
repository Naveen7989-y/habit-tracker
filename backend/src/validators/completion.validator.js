import { z } from 'zod';

export const completeHabitSchema = z.object({
  completedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  note: z.string().trim().max(500, 'Note cannot exceed 500 characters').optional().nullable(),
});
