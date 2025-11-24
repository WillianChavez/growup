import { z } from 'zod';

export const goalSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'El título es muy largo'),
  description: z.string().max(1000).optional(),
  category: z.enum([
    'personal',
    'professional',
    'health',
    'financial',
    'relationships',
    'learning',
    'creative',
    'other',
  ]),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['not-started', 'in-progress', 'completed', 'abandoned']).default('not-started'),
  targetDate: z.date().optional(),
  progress: z.number().min(0).max(100).default(0),
  milestones: z.array(
    z.object({
      title: z.string().min(1, 'El título del milestone es requerido'),
      completed: z.boolean().default(false),
      completedAt: z.date().optional(),
    })
  ).optional(),
});

export type GoalInput = z.infer<typeof goalSchema>;

