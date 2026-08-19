import { NextRequest, NextResponse } from 'next/server';
import { ExerciseWeightService } from '@/services/exercise-weight.service';
import { exerciseWeightSchema } from '@/lib/validations/exercise.validation';
import { withUserContext } from '@/lib/api-context-helper';
import { SMARTFIT_MACHINES } from '@/components/exercise/machine-catalog.data';
import { DUMBBELL_EXERCISES } from '@/components/exercise/dumbbell-exercises.data';
import type { ApiResponse } from '@/types/api.types';
import type { ExerciseType, ExerciseWeightRecord } from '@/types/exercise.types';

const VALID_EXERCISE_IDS: Record<ExerciseType, Set<string>> = {
  machine: new Set(SMARTFIT_MACHINES.map((machine) => machine.id)),
  dumbbell: new Set(DUMBBELL_EXERCISES.map((exercise) => exercise.id)),
};

function isValidExercise(exerciseType: ExerciseType, exerciseId: string) {
  return VALID_EXERCISE_IDS[exerciseType].has(exerciseId);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const requestedType = searchParams.get('exerciseType');
    const exerciseId = searchParams.get('exerciseId') ?? undefined;
    const exerciseType =
      requestedType === 'machine' || requestedType === 'dumbbell' ? requestedType : undefined;

    if (requestedType && !exerciseType) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Tipo de ejercicio inválido' },
        { status: 400 }
      );
    }

    if (exerciseId && (!exerciseType || !isValidExercise(exerciseType, exerciseId))) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Ejercicio no encontrado' },
        { status: 404 }
      );
    }

    const records = await withUserContext(request, (context) =>
      ExerciseWeightService.findAllByUser(context.userId, exerciseType, exerciseId)
    );

    if (!records) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse<ExerciseWeightRecord[]>>({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('Error fetching exercise weight records:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener los pesos registrados' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const validation = exerciseWeightSchema.safeParse(await request.json());

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    if (!isValidExercise(validation.data.exerciseType, validation.data.exerciseId)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Ejercicio no encontrado' },
        { status: 404 }
      );
    }

    const record = await withUserContext(request, (context) =>
      ExerciseWeightService.create(context.userId, validation.data)
    );

    if (!record) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse<ExerciseWeightRecord>>(
      { success: true, data: record, message: 'Registro guardado' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving exercise weight:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al guardar el peso' },
      { status: 500 }
    );
  }
}
