export type DumbbellCategory =
  | 'pecho'
  | 'espalda'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'piernas'
  | 'core';

export type ExerciseDifficulty = 'beginner' | 'intermediate';

export interface DumbbellExercise {
  id: string;
  name: string;
  alias: string;
  images: [string, string];
  category: DumbbellCategory;
  muscles: string[];
  difficulty: ExerciseDifficulty;
  description: string;
  weightLabel?: string;
}

export const DUMBBELL_CATEGORY_LABELS: Record<DumbbellCategory, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombros: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  piernas: 'Piernas y glúteos',
  core: 'Core',
};

const imagePair = (slug: string): [string, string] => [
  `/images/exercises/dumbbells/${slug}-inicio.jpg`,
  `/images/exercises/dumbbells/${slug}-final.jpg`,
];

export const DUMBBELL_EXERCISES: DumbbellExercise[] = [
  {
    id: 'press-banca-mancuernas',
    name: 'Press de banca con mancuernas',
    alias: 'Dumbbell bench press',
    images: imagePair('press-banca'),
    category: 'pecho',
    muscles: ['Pectoral mayor', 'Tríceps', 'Deltoide anterior'],
    difficulty: 'beginner',
    description:
      'Empuja las mancuernas desde el pecho manteniendo los pies firmes y la espalda estable.',
  },
  {
    id: 'press-inclinado-mancuernas',
    name: 'Press inclinado con mancuernas',
    alias: 'Incline dumbbell press',
    images: imagePair('press-inclinado'),
    category: 'pecho',
    muscles: ['Pectoral superior', 'Tríceps', 'Deltoide anterior'],
    difficulty: 'beginner',
    description: 'Empuja desde un banco inclinado para enfatizar la parte superior del pecho.',
  },
  {
    id: 'press-declinado-mancuernas',
    name: 'Press declinado con mancuernas',
    alias: 'Decline dumbbell bench press',
    images: imagePair('press-declinado-mancuernas'),
    category: 'pecho',
    muscles: ['Pectoral inferior', 'Tríceps', 'Deltoide anterior'],
    difficulty: 'intermediate',
    description:
      'Empuja las mancuernas desde un banco declinado para enfatizar la zona inferior del pecho.',
  },
  {
    id: 'aperturas-planas',
    name: 'Aperturas con mancuernas',
    alias: 'Dumbbell fly',
    images: imagePair('aperturas-planas'),
    category: 'pecho',
    muscles: ['Pectoral mayor', 'Deltoide anterior'],
    difficulty: 'beginner',
    description: 'Abre y cierra los brazos en arco con los codos ligeramente flexionados.',
  },
  {
    id: 'aperturas-inclinadas',
    name: 'Aperturas inclinadas',
    alias: 'Incline dumbbell fly',
    images: imagePair('aperturas-inclinadas'),
    category: 'pecho',
    muscles: ['Pectoral superior', 'Deltoide anterior'],
    difficulty: 'beginner',
    description: 'Realiza el movimiento de abrazo sobre un banco inclinado sin perder el control.',
  },
  {
    id: 'aperturas-declinadas',
    name: 'Aperturas declinadas con mancuernas',
    alias: 'Decline dumbbell fly',
    images: imagePair('aperturas-declinadas'),
    category: 'pecho',
    muscles: ['Pectoral inferior', 'Deltoide anterior'],
    difficulty: 'intermediate',
    description:
      'Abre las mancuernas en arco sobre un banco declinado y júntalas contrayendo el pectoral inferior.',
  },
  {
    id: 'flexion-mancuernas-agarre-neutro',
    name: 'Flexión con mancuernas y agarre neutro',
    alias: 'Neutral-grip dumbbell push-up',
    images: [
      '/images/exercises/dumbbells/flexion-mancuernas-agarre-neutro-inicio.png',
      '/images/exercises/dumbbells/flexion-mancuernas-agarre-neutro-final.png',
    ],
    category: 'pecho',
    muscles: ['Pectoral mayor', 'Tríceps', 'Deltoide anterior', 'Serrato anterior', 'Abdominales'],
    difficulty: 'intermediate',
    description:
      'Usa las mancuernas como soportes para mantener las muñecas neutras y ampliar el recorrido de la flexión.',
    weightLabel: 'Peso corporal o añadido',
  },
  {
    id: 'pullover-mancuerna',
    name: 'Pullover con mancuerna',
    alias: 'Bent-arm dumbbell pullover',
    images: imagePair('pullover'),
    category: 'pecho',
    muscles: ['Pectorales', 'Dorsales', 'Serrato anterior'],
    difficulty: 'intermediate',
    description:
      'Lleva una mancuerna detrás de la cabeza y regresa sin arquear en exceso la espalda.',
  },
  {
    id: 'remo-un-brazo',
    name: 'Remo con mancuerna a un brazo',
    alias: 'One-arm dumbbell row',
    images: imagePair('remo-un-brazo'),
    category: 'espalda',
    muscles: ['Dorsales', 'Romboides', 'Bíceps'],
    difficulty: 'beginner',
    description: 'Jala la mancuerna hacia la cadera con el torso estable y la espalda neutra.',
  },
  {
    id: 'remo-inclinado-dos-mancuernas',
    name: 'Remo inclinado con dos mancuernas',
    alias: 'Bent-over dumbbell row',
    images: imagePair('remo-inclinado'),
    category: 'espalda',
    muscles: ['Dorsales', 'Romboides', 'Bíceps'],
    difficulty: 'beginner',
    description:
      'Inclina el torso y lleva ambas mancuernas hacia los costados sin redondear la espalda.',
  },
  {
    id: 'remo-pecho-apoyado',
    name: 'Remo con pecho apoyado',
    alias: 'Incline dumbbell row',
    images: imagePair('remo-pecho-apoyado'),
    category: 'espalda',
    muscles: ['Espalda media', 'Dorsales', 'Bíceps'],
    difficulty: 'beginner',
    description:
      'Apoya el pecho en el banco inclinado para reducir el impulso y aislar la espalda.',
  },
  {
    id: 'encogimientos-mancuernas',
    name: 'Encogimientos con mancuernas',
    alias: 'Dumbbell shrug',
    images: imagePair('encogimientos'),
    category: 'espalda',
    muscles: ['Trapecio superior'],
    difficulty: 'beginner',
    description: 'Eleva los hombros en línea recta sin girarlos y baja lentamente.',
  },
  {
    id: 'press-hombros-mancuernas',
    name: 'Press de hombros con mancuernas',
    alias: 'Dumbbell shoulder press',
    images: imagePair('press-hombros'),
    category: 'hombros',
    muscles: ['Deltoides', 'Tríceps'],
    difficulty: 'intermediate',
    description: 'Empuja las mancuernas sobre la cabeza manteniendo el abdomen firme.',
  },
  {
    id: 'press-arnold',
    name: 'Press Arnold',
    alias: 'Arnold dumbbell press',
    images: imagePair('press-arnold'),
    category: 'hombros',
    muscles: ['Deltoides', 'Tríceps'],
    difficulty: 'intermediate',
    description: 'Gira las palmas mientras elevas las mancuernas en un movimiento continuo.',
  },
  {
    id: 'elevaciones-laterales',
    name: 'Elevaciones laterales',
    alias: 'Side lateral raise',
    images: imagePair('elevaciones-laterales'),
    category: 'hombros',
    muscles: ['Deltoide lateral'],
    difficulty: 'beginner',
    description:
      'Eleva las mancuernas hacia los lados hasta la altura de los hombros sin balancearte.',
  },
  {
    id: 'elevaciones-frontales',
    name: 'Elevaciones frontales',
    alias: 'Front dumbbell raise',
    images: imagePair('elevaciones-frontales'),
    category: 'hombros',
    muscles: ['Deltoide anterior'],
    difficulty: 'beginner',
    description: 'Sube las mancuernas al frente con los brazos controlados y el torso quieto.',
  },
  {
    id: 'aperturas-inversas',
    name: 'Aperturas inversas',
    alias: 'Reverse dumbbell fly',
    images: imagePair('aperturas-inversas'),
    category: 'hombros',
    muscles: ['Deltoide posterior', 'Romboides', 'Trapecio'],
    difficulty: 'beginner',
    description:
      'Inclina el torso y abre los brazos para trabajar hombros posteriores y espalda alta.',
  },
  {
    id: 'curl-biceps',
    name: 'Curl de bíceps con mancuernas',
    alias: 'Dumbbell biceps curl',
    images: imagePair('curl-biceps'),
    category: 'biceps',
    muscles: ['Bíceps', 'Braquial', 'Antebrazos'],
    difficulty: 'beginner',
    description: 'Flexiona los codos sin separarlos del torso y evita usar impulso.',
  },
  {
    id: 'curl-martillo',
    name: 'Curl martillo',
    alias: 'Hammer curl',
    images: imagePair('curl-martillo'),
    category: 'biceps',
    muscles: ['Braquial', 'Bíceps', 'Braquiorradial'],
    difficulty: 'beginner',
    description: 'Mantén las palmas enfrentadas durante todo el curl para enfatizar el braquial.',
  },
  {
    id: 'curl-inclinado',
    name: 'Curl inclinado con mancuernas',
    alias: 'Incline dumbbell curl',
    images: imagePair('curl-inclinado'),
    category: 'biceps',
    muscles: ['Bíceps', 'Braquial'],
    difficulty: 'beginner',
    description: 'Deja caer los brazos junto al banco inclinado y flexiona sin mover los hombros.',
  },
  {
    id: 'curl-concentracion',
    name: 'Curl de concentración',
    alias: 'Concentration curl',
    images: imagePair('curl-concentracion'),
    category: 'biceps',
    muscles: ['Bíceps', 'Braquial'],
    difficulty: 'beginner',
    description: 'Apoya el codo contra el muslo y realiza cada repetición lentamente.',
  },
  {
    id: 'extension-triceps-sentado',
    name: 'Extensión de tríceps sobre la cabeza',
    alias: 'Seated triceps press',
    images: imagePair('extension-triceps-sentado'),
    category: 'triceps',
    muscles: ['Tríceps'],
    difficulty: 'beginner',
    description:
      'Baja la mancuerna detrás de la cabeza manteniendo los codos orientados al frente.',
  },
  {
    id: 'patada-triceps',
    name: 'Patada de tríceps',
    alias: 'Dumbbell triceps kickback',
    images: imagePair('patada-triceps'),
    category: 'triceps',
    muscles: ['Tríceps'],
    difficulty: 'beginner',
    description:
      'Con el brazo pegado al torso, extiende el codo hasta alinear por completo el brazo.',
  },
  {
    id: 'extension-triceps-acostado',
    name: 'Extensión de tríceps acostado',
    alias: 'Lying dumbbell triceps extension',
    images: imagePair('extension-triceps-acostado'),
    category: 'triceps',
    muscles: ['Tríceps'],
    difficulty: 'intermediate',
    description: 'Flexiona solamente los codos para acercar las mancuernas y vuelve a extender.',
  },
  {
    id: 'press-agarre-cerrado',
    name: 'Press con agarre cerrado',
    alias: 'Close-grip dumbbell press',
    images: imagePair('press-agarre-cerrado'),
    category: 'triceps',
    muscles: ['Tríceps', 'Pectorales', 'Deltoide anterior'],
    difficulty: 'beginner',
    description:
      'Mantén las mancuernas juntas mientras empujas para aumentar el trabajo de tríceps.',
  },
  {
    id: 'sentadilla-mancuernas',
    name: 'Sentadilla con mancuernas',
    alias: 'Dumbbell squat',
    images: imagePair('sentadilla'),
    category: 'piernas',
    muscles: ['Cuádriceps', 'Glúteos', 'Core'],
    difficulty: 'beginner',
    description:
      'Desciende llevando la cadera atrás, con las rodillas alineadas y el pecho elevado.',
  },
  {
    id: 'sentadilla-sumo',
    name: 'Sentadilla sumo con mancuerna',
    alias: 'Plié dumbbell squat',
    images: imagePair('sentadilla-sumo'),
    category: 'piernas',
    muscles: ['Glúteos', 'Aductores', 'Cuádriceps'],
    difficulty: 'beginner',
    description:
      'Usa una postura amplia y baja la mancuerna entre las piernas con la espalda neutra.',
  },
  {
    id: 'zancadas-mancuernas',
    name: 'Zancadas con mancuernas',
    alias: 'Dumbbell lunges',
    images: imagePair('zancadas'),
    category: 'piernas',
    muscles: ['Cuádriceps', 'Glúteos', 'Isquiotibiales'],
    difficulty: 'beginner',
    description: 'Da un paso largo y baja ambas rodillas manteniendo el tronco vertical.',
  },
  {
    id: 'sentadilla-bulgara',
    name: 'Sentadilla búlgara',
    alias: 'Dumbbell split squat',
    images: imagePair('sentadilla-bulgara'),
    category: 'piernas',
    muscles: ['Cuádriceps', 'Glúteos', 'Isquiotibiales'],
    difficulty: 'intermediate',
    description: 'Apoya el pie trasero en un banco y desciende controlando la pierna delantera.',
  },
  {
    id: 'peso-muerto-rumano',
    name: 'Peso muerto rumano con mancuernas',
    alias: 'Stiff-legged dumbbell deadlift',
    images: imagePair('peso-muerto-rumano'),
    category: 'piernas',
    muscles: ['Isquiotibiales', 'Glúteos', 'Erectores espinales'],
    difficulty: 'beginner',
    description:
      'Lleva la cadera atrás y baja las mancuernas cerca de las piernas sin curvar la espalda.',
  },
  {
    id: 'subidas-banco',
    name: 'Subidas al banco con mancuernas',
    alias: 'Dumbbell step-up',
    images: imagePair('subidas-banco'),
    category: 'piernas',
    muscles: ['Cuádriceps', 'Glúteos', 'Pantorrillas'],
    difficulty: 'intermediate',
    description: 'Sube al banco impulsándote con la pierna apoyada y baja de forma controlada.',
  },
  {
    id: 'flexion-lateral-mancuerna',
    name: 'Flexión lateral con mancuerna',
    alias: 'Dumbbell side bend',
    images: imagePair('flexion-lateral'),
    category: 'core',
    muscles: ['Oblicuos', 'Cuadrado lumbar'],
    difficulty: 'beginner',
    description: 'Inclina el torso hacia un lado sin girarlo y regresa usando los oblicuos.',
  },
  {
    id: 'spell-caster',
    name: 'Arco diagonal con mancuerna',
    alias: 'Spell caster',
    images: imagePair('spell-caster'),
    category: 'core',
    muscles: ['Oblicuos', 'Recto abdominal', 'Hombros'],
    difficulty: 'beginner',
    description:
      'Mueve la mancuerna en un arco diagonal controlado mientras estabilizas la cadera.',
  },
];
