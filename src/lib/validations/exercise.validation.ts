import { z } from 'zod';

export const workoutFocusEnum = z.enum([
  'fuerza',
  'cardio',
  'pierna',
  'pecho-espalda',
  'full-body',
  'movilidad',
  'otro',
]);

export const workoutSchema = z.object({
  date: z.string().or(z.date()),
  focus: workoutFocusEnum,
  durationMin: z.number().int().positive().max(600).optional(),
  intensity: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().max(500).optional(),
});

const measurement = z.number().positive().max(1000).nullable().optional();

const bodyMetricBase = z.object({
  date: z.string().or(z.date()),
  weight: measurement,
  waist: measurement,
  chest: measurement,
  hip: measurement,
  arm: measurement,
  thigh: measurement,
  notes: z.string().max(500).optional(),
});

export const bodyMetricSchema = bodyMetricBase.refine(
  (data) =>
    [data.weight, data.waist, data.chest, data.hip, data.arm, data.thigh].some(
      (value) => value !== null && value !== undefined
    ),
  { message: 'Registra al menos una medición (peso o medida)' }
);

export const bodyMetricUpdateSchema = bodyMetricBase.partial();
