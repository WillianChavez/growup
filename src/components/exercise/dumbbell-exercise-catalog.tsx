'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Dumbbell, Info, Search, Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DUMBBELL_CATEGORY_LABELS,
  DUMBBELL_EXERCISES,
  type DumbbellCategory,
} from '@/components/exercise/dumbbell-exercises.data';

type ExerciseFilter = 'all' | DumbbellCategory;

const FILTERS: ExerciseFilter[] = [
  'all',
  'pecho',
  'espalda',
  'hombros',
  'biceps',
  'triceps',
  'piernas',
  'core',
];

const CATEGORY_STYLES: Record<DumbbellCategory, string> = {
  pecho:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300',
  espalda:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
  hombros:
    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300',
  biceps:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300',
  triceps:
    'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-300',
  piernas:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  core: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function DumbbellExerciseCatalog() {
  const [filter, setFilter] = useState<ExerciseFilter>('all');
  const [search, setSearch] = useState('');

  const filteredExercises = useMemo(() => {
    const term = normalize(search.trim());

    return DUMBBELL_EXERCISES.filter((exercise) => {
      if (filter !== 'all' && exercise.category !== filter) return false;
      if (!term) return true;

      return normalize(
        [
          exercise.name,
          exercise.alias,
          DUMBBELL_CATEGORY_LABELS[exercise.category],
          ...exercise.muscles,
        ].join(' ')
      ).includes(term);
    });
  }, [filter, search]);

  const getFilterCount = (currentFilter: ExerciseFilter) =>
    currentFilter === 'all'
      ? DUMBBELL_EXERCISES.length
      : DUMBBELL_EXERCISES.filter((exercise) => exercise.category === currentFilter).length;

  return (
    <section className="space-y-5" aria-labelledby="dumbbell-catalog-title">
      <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-5 shadow-sm sm:p-7 dark:border-violet-950 dark:from-violet-950/40 dark:via-slate-950 dark:to-blue-950/30">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-500/10"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-400">
              <Dumbbell className="h-4 w-4" />
              Peso libre
            </div>
            <h2
              id="dumbbell-catalog-title"
              className="text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Ejercicios con mancuernas
            </h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Aprende a reconocer la posición inicial y final de cada movimiento.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-violet-200/80 bg-white/80 px-4 py-3 backdrop-blur dark:border-violet-900 dark:bg-slate-950/70">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{DUMBBELL_EXERCISES.length}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                ejercicios ilustrados
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-xl">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <Input
            type="search"
            aria-label="Buscar ejercicios con mancuernas"
            placeholder="Buscar por ejercicio o músculo…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 pl-9 pr-10"
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

        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por grupo muscular">
          {FILTERS.map((currentFilter) => {
            const label =
              currentFilter === 'all' ? 'Todos' : DUMBBELL_CATEGORY_LABELS[currentFilter];
            const isActive = filter === currentFilter;

            return (
              <Button
                key={currentFilter}
                type="button"
                size="sm"
                variant={isActive ? 'default' : 'outline'}
                aria-pressed={isActive}
                onClick={() => setFilter(currentFilter)}
                className={cn(
                  'shrink-0 rounded-full',
                  isActive &&
                    'bg-violet-700 text-white hover:bg-violet-600 dark:bg-violet-500 dark:hover:bg-violet-400'
                )}
              >
                {label}
                <span
                  className={cn(
                    'ml-1 rounded-full px-1.5 py-0.5 text-[10px] leading-none',
                    isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
                  )}
                >
                  {getFilterCount(currentFilter)}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
        {filteredExercises.length}{' '}
        {filteredExercises.length === 1 ? 'ejercicio encontrado' : 'ejercicios encontrados'}
      </p>

      {filteredExercises.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredExercises.map((exercise) => (
            <article
              key={exercise.id}
              className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:bg-slate-950 dark:hover:border-slate-700"
            >
              <div className="grid grid-cols-2 border-b bg-slate-100 dark:bg-slate-900">
                {exercise.images.map((image, index) => (
                  <div
                    key={image}
                    className={cn(
                      'relative aspect-[3/2] overflow-hidden',
                      index === 0 && 'border-r'
                    )}
                  >
                    <Image
                      src={image}
                      alt={`${exercise.name}, posición ${index === 0 ? 'inicial' : 'final'}`}
                      fill
                      sizes="(max-width: 1280px) 50vw, 25vw"
                      className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <span className="absolute bottom-2 left-2 rounded-md bg-slate-950/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                      {index === 0 ? 'Inicio' : 'Final'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold leading-tight">{exercise.name}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {exercise.alias}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('shrink-0', CATEGORY_STYLES[exercise.category])}
                  >
                    {DUMBBELL_CATEGORY_LABELS[exercise.category]}
                  </Badge>
                </div>

                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {exercise.description}
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="font-normal">
                    {exercise.difficulty === 'beginner' ? 'Principiante' : 'Intermedio'}
                  </Badge>
                  {exercise.muscles.map((muscle) => (
                    <Badge key={muscle} variant="secondary" className="font-normal">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <h3 className="font-semibold">No encontramos ese ejercicio</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Prueba con otro nombre o grupo muscular.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSearch('');
              setFilter('all');
            }}
          >
            Mostrar todos
          </Button>
        </div>
      )}

      <div className="flex gap-3 rounded-xl border bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
        <p>
          Las imágenes muestran una referencia de la posición inicial y final. Ajusta el peso a tu
          nivel y consulta a un entrenador si tienes dudas sobre la técnica.
        </p>
      </div>
    </section>
  );
}
