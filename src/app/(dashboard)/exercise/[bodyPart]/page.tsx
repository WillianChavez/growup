import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  BODY_PART_IDS,
  BODY_PART_LABELS,
  type BodyPartId,
} from '@/components/exercise/body-part.data';
import { MachineCatalog } from '@/components/exercise/machine-catalog';

interface BodyPartExercisePageProps {
  params: Promise<{ bodyPart: string }>;
}

export function generateStaticParams() {
  return BODY_PART_IDS.map((bodyPart) => ({ bodyPart }));
}

export default async function BodyPartExercisePage({ params }: BodyPartExercisePageProps) {
  const { bodyPart: requestedBodyPart } = await params;

  if (!BODY_PART_IDS.includes(requestedBodyPart as BodyPartId)) notFound();

  const bodyPart = requestedBodyPart as BodyPartId;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/exercise"
          aria-label="Volver al selector corporal"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{BODY_PART_LABELS[bodyPart]}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Máquinas y ejercicios relacionados con esta zona.
          </p>
        </div>
      </div>

      <MachineCatalog bodyPart={bodyPart} />
    </div>
  );
}
