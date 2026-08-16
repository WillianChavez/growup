export type BodyPartId =
  | 'cardio'
  | 'shoulders'
  | 'chest'
  | 'biceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'adductors'
  | 'traps'
  | 'triceps'
  | 'lats'
  | 'lower-back'
  | 'abductors'
  | 'glutes'
  | 'hamstrings'
  | 'calves';

export const BODY_PART_LABELS: Record<BodyPartId, string> = {
  cardio: 'Cardio',
  shoulders: 'Hombros',
  chest: 'Pecho',
  biceps: 'Bíceps',
  forearms: 'Antebrazos',
  abs: 'Abdominales',
  obliques: 'Oblicuos',
  quads: 'Cuádriceps',
  adductors: 'Aductores',
  traps: 'Trapecios',
  triceps: 'Tríceps',
  lats: 'Dorsales',
  'lower-back': 'Zona lumbar',
  abductors: 'Abductores',
  glutes: 'Glúteos',
  hamstrings: 'Isquiotibiales',
  calves: 'Pantorrillas',
};

export const BODY_PART_IDS = Object.keys(BODY_PART_LABELS) as BodyPartId[];
