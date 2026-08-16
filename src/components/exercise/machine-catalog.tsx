'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Info, Search, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { BODY_PART_LABELS, type BodyPartId } from '@/components/exercise/body-part.data';
import { ExerciseWeightInput } from '@/components/exercise/machine-weight-input';
import {
  DUMBBELL_EXERCISES,
  type DumbbellCategory,
  type DumbbellExercise,
} from '@/components/exercise/dumbbell-exercises.data';
import {
  MACHINE_CATEGORY_LABELS,
  SMARTFIT_MACHINES,
  type GymMachine,
  type MachineCategory,
} from '@/components/exercise/machine-catalog.data';
import type { ExerciseType, ExerciseWeightRecord, WeightUnit } from '@/types/exercise.types';

type CatalogItem =
  | { kind: 'machine'; category: MachineCategory; data: GymMachine }
  | { kind: 'dumbbell'; category: MachineCategory; data: DumbbellExercise };

const DUMBBELL_CATEGORY_MAP: Record<DumbbellCategory, MachineCategory> = {
  pecho: 'torso',
  espalda: 'torso',
  hombros: 'brazos',
  biceps: 'brazos',
  triceps: 'brazos',
  piernas: 'piernas',
  core: 'core',
};

const CATEGORY_ORDER: MachineCategory[] = [
  'piernas',
  'torso',
  'brazos',
  'core',
  'multifuncional',
  'cardio',
];

const BODY_PART_KEYWORDS: Record<Exclude<BodyPartId, 'cardio'>, string[]> = {
  shoulders: ['deltoide', 'hombro'],
  chest: ['pectoral', 'pecho'],
  biceps: ['biceps', 'braquial'],
  forearms: ['antebrazo', 'braquiorradial'],
  abs: ['abdominal', 'core'],
  obliques: ['oblicuo'],
  quads: ['cuadriceps'],
  adductors: ['aductor', 'muslo interno'],
  traps: ['trapecio'],
  triceps: ['triceps'],
  lats: ['dorsal', 'romboide', 'redondo mayor', 'espalda media'],
  'lower-back': ['lumbar', 'erector espinal', 'cuadrado lumbar'],
  abductors: ['abductor', 'gluteo medio', 'gluteo menor'],
  glutes: ['gluteo'],
  hamstrings: ['isquiotibial'],
  calves: ['pantorrilla', 'gastrocnemio', 'soleo'],
};

const CATALOG_ITEMS: CatalogItem[] = [
  ...SMARTFIT_MACHINES.map(
    (machine): CatalogItem => ({
      kind: 'machine',
      category: machine.category,
      data: machine,
    })
  ),
  ...DUMBBELL_EXERCISES.map(
    (exercise): CatalogItem => ({
      kind: 'dumbbell',
      category: DUMBBELL_CATEGORY_MAP[exercise.category],
      data: exercise,
    })
  ),
].sort((first, second) => {
  const categoryDifference =
    CATEGORY_ORDER.indexOf(first.category) - CATEGORY_ORDER.indexOf(second.category);

  if (categoryDifference !== 0) return categoryDifference;
  return first.data.name.localeCompare(second.data.name, 'es');
});

const FAVORITES_STORAGE_KEY = 'growup-exercise-favorites';

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getSearchableText(item: CatalogItem) {
  const commonFields = [
    item.data.name,
    item.data.alias,
    MACHINE_CATEGORY_LABELS[item.category],
    ...item.data.muscles,
  ];

  if (item.kind === 'machine') commonFields.push(item.data.machineNumber ?? '');

  return normalize(commonFields.join(' '));
}

function matchesBodyPart(item: CatalogItem, bodyPart: BodyPartId) {
  if (bodyPart === 'cardio') return item.category === 'cardio';

  const muscles = normalize(item.data.muscles.join(' '));
  return BODY_PART_KEYWORDS[bodyPart].some((keyword) => muscles.includes(normalize(keyword)));
}

function MuscleBadges({ muscles, limit = 2 }: { muscles: string[]; limit?: number }) {
  const remainingMuscles = muscles.slice(limit);

  return (
    <div
      className="flex min-h-5 flex-wrap items-center gap-1"
      aria-label={`Músculos: ${muscles.join(', ')}`}
    >
      {muscles.slice(0, limit).map((muscle) => (
        <Badge key={muscle} variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
          {muscle}
        </Badge>
      ))}
      {remainingMuscles.length > 0 && (
        <Badge
          variant="outline"
          className="h-5 px-1.5 text-[10px] font-normal text-slate-500"
          title={remainingMuscles.join(', ')}
        >
          +{remainingMuscles.length}
        </Badge>
      )}
    </div>
  );
}

interface FavoriteButtonProps {
  isFavorite: boolean;
  itemName: string;
  onToggle: () => void;
}

function FavoriteButton({ isFavorite, itemName, onToggle }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      aria-label={`${isFavorite ? 'Quitar de' : 'Agregar a'} favoritos: ${itemName}`}
      aria-pressed={isFavorite}
      title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      onClick={onToggle}
      className={cn(
        'absolute bottom-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm backdrop-blur transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400',
        isFavorite
          ? 'border-yellow-300 bg-yellow-100 text-yellow-600 dark:border-yellow-500 dark:bg-yellow-950 dark:text-yellow-300'
          : 'border-white/70 bg-white/90 text-slate-500 hover:text-yellow-500 dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-300'
      )}
    >
      <Star className={cn('h-4 w-4', isFavorite && 'fill-current')} />
    </button>
  );
}

function ExerciseImageCarousel({
  exerciseName,
  images,
  children,
}: {
  exerciseName: string;
  images: string[];
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisibleOnTouchDevice, setIsVisibleOnTouchDevice] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    if (!container || !isTouchDevice) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisibleOnTouchDevice(entry.isIntersecting),
      { threshold: 0.65 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if ((!isHovered && !isVisibleOnTouchDevice) || images.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveImage((currentImage) => (currentImage + 1) % images.length);
    }, 1600);

    return () => window.clearInterval(interval);
  }, [images.length, isHovered, isVisibleOnTouchDevice]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[16/9] overflow-hidden border-b bg-slate-100 dark:bg-slate-900"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {images.map((image, index) => (
        <Image
          key={image}
          src={image}
          alt={`${exerciseName}, posición ${index === 0 ? 'inicial' : 'final'}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
          className={cn(
            'object-contain p-2 transition-[opacity,transform] duration-500',
            index === activeImage
              ? 'scale-100 opacity-100'
              : 'pointer-events-none scale-[0.98] opacity-0'
          )}
        />
      ))}

      <span className="absolute bottom-1.5 left-1.5 rounded bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur">
        {activeImage === 0 ? 'Inicio' : 'Final'}
      </span>

      <div
        className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full bg-slate-950/55 p-1 backdrop-blur"
        aria-label={`Imágenes de ${exerciseName}`}
      >
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Mostrar posición ${index === 0 ? 'inicial' : 'final'}`}
            aria-current={index === activeImage}
            onClick={() => setActiveImage(index)}
            className={cn(
              'h-1.5 rounded-full transition-all',
              index === activeImage ? 'w-4 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/80'
            )}
          />
        ))}
      </div>

      {children}
    </div>
  );
}

function MachineCard({
  machine,
  isFavorite,
  onToggleFavorite,
  weightRecords,
  isSavingWeight,
  onSaveWeight,
}: {
  machine: GymMachine;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  weightRecords: ExerciseWeightRecord[];
  isSavingWeight: boolean;
  onSaveWeight: (weight: number, unit: WeightUnit) => Promise<boolean>;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:bg-slate-950 dark:hover:border-slate-700">
      <ExerciseImageCarousel exerciseName={machine.name} images={machine.images}>
        {machine.machineNumber && (
          <div className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-md bg-slate-950 px-1.5 font-mono text-xs font-bold text-yellow-300 shadow dark:bg-yellow-400 dark:text-slate-950">
            #{machine.machineNumber}
          </div>
        )}
        <FavoriteButton
          isFavorite={isFavorite}
          itemName={machine.name}
          onToggle={onToggleFavorite}
        />
      </ExerciseImageCarousel>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div>
          <h2 className="text-[15px] font-semibold leading-5">{machine.name}</h2>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
            {machine.alias}
          </p>
        </div>

        <div className="mt-auto">
          <MuscleBadges muscles={machine.muscles} />
        </div>

        {machine.category !== 'cardio' && (
          <ExerciseWeightInput
            key={weightRecords[0]?.id ?? machine.id}
            exerciseName={machine.name}
            latestRecord={weightRecords[0]}
            recordCount={weightRecords.length}
            isSaving={isSavingWeight}
            onSave={onSaveWeight}
          />
        )}
      </div>
    </article>
  );
}

function DumbbellCard({
  exercise,
  isFavorite,
  onToggleFavorite,
  weightRecords,
  isSavingWeight,
  onSaveWeight,
}: {
  exercise: DumbbellExercise;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  weightRecords: ExerciseWeightRecord[];
  isSavingWeight: boolean;
  onSaveWeight: (weight: number, unit: WeightUnit) => Promise<boolean>;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:bg-slate-950 dark:hover:border-slate-700">
      <ExerciseImageCarousel exerciseName={exercise.name} images={exercise.images}>
        <FavoriteButton
          isFavorite={isFavorite}
          itemName={exercise.name}
          onToggle={onToggleFavorite}
        />
      </ExerciseImageCarousel>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div>
          <h2 className="text-[15px] font-semibold leading-5">{exercise.name}</h2>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
            {exercise.alias}
          </p>
        </div>

        <div className="mt-auto">
          <MuscleBadges muscles={exercise.muscles} limit={1} />
        </div>

        <ExerciseWeightInput
          key={weightRecords[0]?.id ?? exercise.id}
          exerciseName={exercise.name}
          label={exercise.weightLabel ?? 'Peso por mancuerna'}
          latestRecord={weightRecords[0]}
          recordCount={weightRecords.length}
          isSaving={isSavingWeight}
          onSave={onSaveWeight}
        />
      </div>
    </article>
  );
}

export function MachineCatalog({ bodyPart }: { bodyPart: BodyPartId }) {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [weightRecords, setWeightRecords] = useState<ExerciseWeightRecord[]>([]);
  const [savingExerciseKey, setSavingExerciseKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedFavorites = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]');

      if (Array.isArray(savedFavorites)) {
        setFavorites(
          new Set(savedFavorites.filter((item): item is string => typeof item === 'string'))
        );
      }
    } catch {
      setFavorites(new Set());
    } finally {
      setFavoritesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!favoritesLoaded) return;
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]));
  }, [favorites, favoritesLoaded]);

  useEffect(() => {
    let isCancelled = false;

    const loadWeightRecords = async () => {
      try {
        const response = await fetch('/api/exercise-weights');
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error);
        if (!isCancelled) setWeightRecords(result.data ?? []);
      } catch (error) {
        console.error('Error loading machine weights:', error);
      }
    };

    void loadWeightRecords();
    return () => {
      isCancelled = true;
    };
  }, []);

  const recordsByExercise = useMemo(() => {
    const groupedRecords = new Map<string, ExerciseWeightRecord[]>();

    for (const record of weightRecords) {
      const exerciseKey = `${record.exerciseType}-${record.exerciseId}`;
      const currentRecords = groupedRecords.get(exerciseKey) ?? [];
      currentRecords.push(record);
      groupedRecords.set(exerciseKey, currentRecords);
    }

    return groupedRecords;
  }, [weightRecords]);

  const getItemId = (item: CatalogItem) => `${item.kind}-${item.data.id}`;

  const toggleFavorite = (itemId: string) => {
    setFavorites((currentFavorites) => {
      const nextFavorites = new Set(currentFavorites);
      if (nextFavorites.has(itemId)) nextFavorites.delete(itemId);
      else nextFavorites.add(itemId);
      return nextFavorites;
    });
  };

  const saveExerciseWeight = async (
    exerciseType: ExerciseType,
    exerciseId: string,
    weight: number,
    unit: WeightUnit
  ): Promise<boolean> => {
    const exerciseKey = `${exerciseType}-${exerciseId}`;
    setSavingExerciseKey(exerciseKey);

    try {
      const response = await fetch('/api/exercise-weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseType, exerciseId, weight, unit }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo guardar el peso');
      }

      setWeightRecords((currentRecords) => [result.data, ...currentRecords]);
      toast.success('Peso guardado en tu historial');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar el peso');
      return false;
    } finally {
      setSavingExerciseKey(null);
    }
  };

  const filteredItems = useMemo(() => {
    const term = normalize(search.trim());

    return CATALOG_ITEMS.filter((item) => {
      if (!matchesBodyPart(item, bodyPart)) return false;
      return !term || getSearchableText(item).includes(term);
    }).sort((first, second) => {
      const favoriteDifference =
        Number(favorites.has(getItemId(second))) - Number(favorites.has(getItemId(first)));

      if (favoriteDifference !== 0) return favoriteDifference;
      if (first.kind !== second.kind) return first.kind === 'dumbbell' ? -1 : 1;
      return 0;
    });
  }, [bodyPart, favorites, search]);

  return (
    <section className="space-y-4" aria-label="Catálogo de ejercicios">
      <div className="relative max-w-xl">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <Input
          type="search"
          aria-label="Buscar ejercicios"
          placeholder="Buscar por nombre, número o músculo…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-10 pl-9 pr-10"
        />
        {search && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" aria-live="polite">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filteredItems.length}{' '}
            {filteredItems.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
          </p>
          <Badge className="bg-violet-600 text-white hover:bg-violet-600">
            {BODY_PART_LABELS[bodyPart]}
          </Badge>
        </div>
        <p className="hidden text-xs text-slate-400 sm:block">
          El equipo puede variar según la sede.
        </p>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredItems.map((item) =>
            item.kind === 'machine' ? (
              <MachineCard
                key={getItemId(item)}
                machine={item.data}
                isFavorite={favorites.has(getItemId(item))}
                onToggleFavorite={() => toggleFavorite(getItemId(item))}
                weightRecords={recordsByExercise.get(`machine-${item.data.id}`) ?? []}
                isSavingWeight={savingExerciseKey === `machine-${item.data.id}`}
                onSaveWeight={(weight, unit) =>
                  saveExerciseWeight('machine', item.data.id, weight, unit)
                }
              />
            ) : (
              <DumbbellCard
                key={getItemId(item)}
                exercise={item.data}
                isFavorite={favorites.has(getItemId(item))}
                onToggleFavorite={() => toggleFavorite(getItemId(item))}
                weightRecords={recordsByExercise.get(`dumbbell-${item.data.id}`) ?? []}
                isSavingWeight={savingExerciseKey === `dumbbell-${item.data.id}`}
                onSaveWeight={(weight, unit) =>
                  saveExerciseWeight('dumbbell', item.data.id, weight, unit)
                }
              />
            )
          )}
        </div>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <h2 className="font-semibold">No encontramos resultados</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Prueba con otro nombre, número o grupo muscular.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setSearch('')}
          >
            Mostrar todos
          </Button>
        </div>
      )}

      <div className="flex gap-2.5 rounded-lg border bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p>
          Las tarjetas combinan máquinas y movimientos con mancuernas. Las imágenes de inicio y
          final son una referencia visual; ajusta el peso a tu nivel y consulta a un entrenador si
          tienes dudas sobre la técnica.
        </p>
      </div>
    </section>
  );
}
