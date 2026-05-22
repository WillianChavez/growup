import type { WorkoutFocus, WorkoutIntensity, BodyMetricField } from '@/types/exercise.types';

export const FOCUS_OPTIONS: WorkoutFocus[] = [
  'fuerza',
  'cardio',
  'pierna',
  'pecho-espalda',
  'full-body',
  'movilidad',
  'otro',
];

export const FOCUS_LABELS: Record<WorkoutFocus, string> = {
  fuerza: 'Fuerza',
  cardio: 'Cardio',
  pierna: 'Pierna',
  'pecho-espalda': 'Pecho/Espalda',
  'full-body': 'Full body',
  movilidad: 'Movilidad',
  otro: 'Otro',
};

export const INTENSITY_OPTIONS: WorkoutIntensity[] = ['low', 'medium', 'high'];

export const INTENSITY_LABELS: Record<WorkoutIntensity, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export const MEASUREMENT_FIELDS: BodyMetricField[] = [
  'weight',
  'waist',
  'chest',
  'hip',
  'arm',
  'thigh',
];

export const MEASUREMENT_LABELS: Record<BodyMetricField, { label: string; unit: string }> = {
  weight: { label: 'Peso', unit: 'lb' },
  waist: { label: 'Cintura', unit: 'cm' },
  chest: { label: 'Pecho', unit: 'cm' },
  hip: { label: 'Cadera', unit: 'cm' },
  arm: { label: 'Brazo', unit: 'cm' },
  thigh: { label: 'Muslo', unit: 'cm' },
};
