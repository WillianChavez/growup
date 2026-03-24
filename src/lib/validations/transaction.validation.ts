import { z } from 'zod';

const monetaryAmountSchema = z
  .number()
  .finite('El monto debe ser un número válido')
  .positive('El monto debe ser mayor a 0')
  .refine((value) => Number.isInteger(value * 100), {
    message: 'El monto solo puede tener hasta 2 decimales',
  });

export const transactionSchema = z.object({
  amount: monetaryAmountSchema,
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
