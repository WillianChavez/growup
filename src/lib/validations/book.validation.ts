import { z } from 'zod';

export const bookSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'El título es muy largo'),
  author: z.string().min(1, 'El autor es requerido').max(200, 'El nombre del autor es muy largo'),
  pages: z.number().min(1, 'El número de páginas debe ser mayor a 0'),
  currentPage: z.number().min(0).default(0),
  isbn: z.string().max(20).optional(),
  coverUrl: z.string().url('URL inválida').optional(),
  status: z.enum(['reading', 'completed', 'to-read', 'abandoned']),
  rating: z.number().min(1).max(5).optional(),
  review: z.string().max(2000).optional(),
  notes: z.string().max(1000).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  genre: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
});

export const bookQuoteSchema = z.object({
  bookId: z.string().uuid(),
  quote: z.string().min(1, 'La cita es requerida').max(1000, 'La cita es muy larga'),
  pageNumber: z.number().min(1).optional(),
  isFavorite: z.boolean().default(false),
});

export type BookInput = z.infer<typeof bookSchema>;
export type BookQuoteInput = z.infer<typeof bookQuoteSchema>;
