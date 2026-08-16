'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BODY_PART_LABELS, type BodyPartId } from '@/components/exercise/body-part.data';

type BodySide = 'front' | 'back';
type LabelSide = 'left' | 'right';

interface BodyCallout {
  id: BodyPartId;
  side: BodySide;
  anchorX: number;
  anchorY: number;
  labelSide: LabelSide;
  labelY: number;
}

const BODY_CALLOUTS: BodyCallout[] = [
  {
    id: 'cardio',
    side: 'front',
    anchorX: 59,
    anchorY: 30,
    labelSide: 'left',
    labelY: 16,
  },
  {
    id: 'shoulders',
    side: 'front',
    anchorX: 69,
    anchorY: 22,
    labelSide: 'right',
    labelY: 19,
  },
  {
    id: 'chest',
    side: 'front',
    anchorX: 55,
    anchorY: 27,
    labelSide: 'left',
    labelY: 25,
  },
  {
    id: 'biceps',
    side: 'front',
    anchorX: 73,
    anchorY: 35,
    labelSide: 'right',
    labelY: 31,
  },
  {
    id: 'forearms',
    side: 'front',
    anchorX: 75,
    anchorY: 46,
    labelSide: 'right',
    labelY: 45,
  },
  {
    id: 'abs',
    side: 'front',
    anchorX: 55,
    anchorY: 39,
    labelSide: 'left',
    labelY: 36,
  },
  {
    id: 'obliques',
    side: 'front',
    anchorX: 43,
    anchorY: 42,
    labelSide: 'left',
    labelY: 43,
  },
  {
    id: 'quads',
    side: 'front',
    anchorX: 55,
    anchorY: 63,
    labelSide: 'left',
    labelY: 63,
  },
  {
    id: 'adductors',
    side: 'front',
    anchorX: 62,
    anchorY: 59,
    labelSide: 'right',
    labelY: 57,
  },
  {
    id: 'traps',
    side: 'back',
    anchorX: 50,
    anchorY: 21,
    labelSide: 'right',
    labelY: 18,
  },
  {
    id: 'triceps',
    side: 'back',
    anchorX: 34,
    anchorY: 35,
    labelSide: 'left',
    labelY: 32,
  },
  {
    id: 'lats',
    side: 'back',
    anchorX: 51,
    anchorY: 31,
    labelSide: 'right',
    labelY: 27,
  },
  {
    id: 'lower-back',
    side: 'back',
    anchorX: 50,
    anchorY: 40,
    labelSide: 'right',
    labelY: 39,
  },
  {
    id: 'abductors',
    side: 'back',
    anchorX: 43,
    anchorY: 47,
    labelSide: 'left',
    labelY: 46,
  },
  {
    id: 'glutes',
    side: 'back',
    anchorX: 53,
    anchorY: 52,
    labelSide: 'right',
    labelY: 51,
  },
  {
    id: 'hamstrings',
    side: 'back',
    anchorX: 50,
    anchorY: 65,
    labelSide: 'left',
    labelY: 64,
  },
  {
    id: 'calves',
    side: 'back',
    anchorX: 50,
    anchorY: 82,
    labelSide: 'right',
    labelY: 81,
  },
];

interface BodyViewProps {
  side: BodySide;
  onSelect: (bodyPart: BodyPartId) => void;
}

function BodyView({ side, onSelect }: BodyViewProps) {
  const callouts = BODY_CALLOUTS.filter((callout) => callout.side === side);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        src={
          side === 'front'
            ? '/images/exercises/body/body-front.png'
            : '/images/exercises/body/body-back.png'
        }
        alt={side === 'front' ? 'Modelo anatómico de frente' : 'Modelo anatómico de espalda'}
        fill
        priority
        draggable={false}
        sizes="(max-width: 768px) 100vw, 540px"
        className="pointer-events-none select-none object-contain"
      />

      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      >
        {callouts.map((callout) => {
          const lineEndX = callout.labelSide === 'left' ? 19 : 81;
          const elbowX = callout.labelSide === 'left' ? 25 : 75;

          return (
            <g key={callout.id}>
              <polyline
                points={`${callout.anchorX},${callout.anchorY} ${elbowX},${callout.labelY} ${lineEndX},${callout.labelY}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                className="text-violet-600 dark:text-violet-400"
              />
              <circle
                cx={callout.anchorX}
                cy={callout.anchorY}
                r="0.65"
                vectorEffect="non-scaling-stroke"
                className="fill-violet-600 stroke-white dark:fill-violet-400 dark:stroke-slate-950"
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </svg>

      {callouts.map((callout) => {
        const label = BODY_PART_LABELS[callout.id];

        return (
          <button
            key={`muscle-${callout.id}`}
            type="button"
            aria-label={`Ver ejercicios para ${label} tocando el músculo`}
            title={label}
            onClick={() => onSelect(callout.id)}
            style={{ left: `${callout.anchorX}%`, top: `${callout.anchorY}%` }}
            className="absolute z-10 h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-transparent transition hover:bg-violet-500/20 hover:ring-2 hover:ring-violet-500/50 focus-visible:bg-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:h-12 sm:w-12"
          />
        );
      })}

      {callouts.map((callout) => {
        const label = BODY_PART_LABELS[callout.id];

        return (
          <button
            key={callout.id}
            type="button"
            aria-label={`Ver ejercicios para ${label}`}
            onClick={() => onSelect(callout.id)}
            style={{ top: `${callout.labelY}%` }}
            className={cn(
              'absolute z-10 -translate-y-1/2 rounded-md border border-violet-200 bg-white/95 px-2 py-1 text-[9px] font-semibold leading-none text-violet-800 shadow-sm backdrop-blur transition hover:scale-105 hover:border-violet-400 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:text-[11px] dark:border-violet-800 dark:bg-slate-950/95 dark:text-violet-200',
              callout.labelSide === 'left' ? 'left-1' : 'right-1'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function BodyPartSelector() {
  const router = useRouter();
  const [side, setSide] = useState<BodySide>('front');
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const lastSwipeAt = useRef(0);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current) return;

    const touch = event.changedTouches[0];
    const differenceX = touch.clientX - touchStart.current.x;
    const differenceY = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(differenceX) < 45 || Math.abs(differenceX) <= Math.abs(differenceY)) return;

    lastSwipeAt.current = Date.now();
    setSide(differenceX < 0 ? 'back' : 'front');
  };

  const handleSelect = (bodyPart: BodyPartId) => {
    if (Date.now() - lastSwipeAt.current < 350) return;
    router.push(`/exercise/${bodyPart}`);
  };

  return (
    <section
      aria-label="Selector de zona corporal"
      className="relative mx-auto flex h-[calc(100dvh-8rem)] min-h-0 w-full items-center justify-center overflow-hidden"
    >
      <div
        className="relative max-h-full max-w-full touch-pan-y overflow-hidden [container-type:inline-size] [perspective:1400px]"
        style={{ height: '80dvh', width: '48dvh' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={cn(
            'relative h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] [transform-style:preserve-3d] motion-reduce:transition-none',
            side === 'front'
              ? '[transform:translateZ(-50cqw)_rotateY(0deg)]'
              : '[transform:translateZ(-50cqw)_rotateY(-90deg)]'
          )}
        >
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(0deg)_translateZ(50cqw)]">
            <BodyView side="front" onSelect={handleSelect} />
          </div>
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(90deg)_translateZ(50cqw)]">
            <BodyView side="back" onSelect={handleSelect} />
          </div>
        </div>

        <button
          type="button"
          aria-label="Mostrar vista frontal"
          onClick={() => setSide('front')}
          disabled={side === 'front'}
          className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/65 text-white shadow-lg backdrop-blur transition-opacity disabled:pointer-events-none disabled:opacity-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Mostrar vista posterior"
          onClick={() => setSide('back')}
          disabled={side === 'back'}
          className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/65 text-white shadow-lg backdrop-blur transition-opacity disabled:pointer-events-none disabled:opacity-0"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div
          className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-2"
          aria-hidden="true"
        >
          <span
            className={cn(
              'h-2 rounded-full bg-slate-950/60 transition-all dark:bg-white/70',
              side === 'front' ? 'w-6' : 'w-2'
            )}
          />
          <span
            className={cn(
              'h-2 rounded-full bg-slate-950/60 transition-all dark:bg-white/70',
              side === 'back' ? 'w-6' : 'w-2'
            )}
          />
        </div>
      </div>
    </section>
  );
}
