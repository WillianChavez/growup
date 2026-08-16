export type WorkoutFocus =
  | 'fuerza'
  | 'cardio'
  | 'pierna'
  | 'pecho-espalda'
  | 'full-body'
  | 'movilidad'
  | 'otro';

export type WorkoutIntensity = 'low' | 'medium' | 'high';

export interface WorkoutSession {
  id: string;
  userId: string;
  date: Date;
  focus: WorkoutFocus;
  durationMin: number | null;
  intensity: WorkoutIntensity | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutFormData {
  date: string | Date;
  focus: WorkoutFocus;
  durationMin?: number;
  intensity?: WorkoutIntensity;
  notes?: string;
}

export interface WorkoutWeeklyStats {
  weekStart: Date;
  weekEnd: Date;
  sessionCount: number;
  targetPerWeek: number;
  totalMinutes: number;
  byFocus: { focus: WorkoutFocus; count: number }[];
}

export type BodyMetricField = 'weight' | 'waist' | 'chest' | 'hip' | 'arm' | 'thigh';

export interface BodyMetric {
  id: string;
  userId: string;
  date: Date;
  weight: number | null;
  waist: number | null;
  chest: number | null;
  hip: number | null;
  arm: number | null;
  thigh: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BodyMetricFormData {
  date: string | Date;
  weight?: number | null;
  waist?: number | null;
  chest?: number | null;
  hip?: number | null;
  arm?: number | null;
  thigh?: number | null;
  notes?: string;
}

export interface BodyMetricPoint {
  date: Date;
  value: number;
}

/** Resultado de sincronizar el peso con el objetivo de salud. */
export interface WeightGoalSync {
  goalId: string;
  changed: boolean;
  completedMilestones: string[];
  progress: number;
}

export type WeightUnit = 'kg' | 'lb';
export type ExerciseType = 'machine' | 'dumbbell';

export interface ExerciseWeightRecord {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseType: ExerciseType;
  weight: number;
  unit: WeightUnit;
  weightKg: number;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
}
