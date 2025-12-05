import { z } from 'zod';

export const transactionSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0'),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().uuid('ID de categoría inválido'),
  description: z.string().min(1, 'La descripción es requerida').max(200),
  notes: z.string().optional(),
  date: z
    .string()
    .or(z.date())
    .transform((val) => {
      if (typeof val === 'string') return new Date(val);
      return val;
    }),
  isRecurring: z.boolean().optional().default(false),
  recurringFrequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  tags: z.array(z.string()).optional(),
});
