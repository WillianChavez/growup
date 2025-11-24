import { z } from 'zod';

export const habitSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(100),
  description: z.string().optional(),
  emoji: z.string().default('🎯'),
  categoryId: z.string().uuid('ID de categoría inválido'),
});

export const habitEntrySchema = z.object({
  date: z.string().or(z.date()),
  completed: z.boolean(),
  notes: z.string().optional(),
});
