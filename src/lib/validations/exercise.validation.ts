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

// Los ejercicios de peso corporal guardan repeticiones por set y los de cardio
// minutos de sesión; en ambos casos el valor va en `weight` y `unit` lo distingue.
export const exerciseWeightSchema = z
  .object({
    exerciseId: z
      .string()
      .min(1, 'El ejercicio es requerido')
      .max(100, 'Identificador de ejercicio inválido'),
    exerciseType: z.enum(['machine', 'dumbbell'], { error: 'Tipo de ejercicio inválido' }),
    weight: z
      .number({ error: 'Ingresa un valor válido' })
      .positive('El valor debe ser mayor que cero')
      .max(2000, 'El valor no puede superar 2000'),
    unit: z.enum(['kg', 'lb', 'reps', 'min'], { error: 'Unidad de registro inválida' }),
  })
  .refine((data) => data.unit !== 'reps' || Number.isInteger(data.weight), {
    message: 'Las repeticiones deben ser un número entero',
    path: ['weight'],
  })
  .refine((data) => data.unit !== 'reps' || data.weight <= 500, {
    message: 'Las repeticiones no pueden superar 500',
    path: ['weight'],
  })
  .refine((data) => data.unit !== 'min' || data.weight <= 600, {
    message: 'Los minutos no pueden superar 600',
    path: ['weight'],
  });
