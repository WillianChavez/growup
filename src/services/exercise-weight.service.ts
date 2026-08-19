import { prisma } from '@/lib/db';
import type { ExerciseWeightRecord as PrismaExerciseWeightRecord } from '@prisma/client';
import type {
  ExerciseRecordUnit,
  ExerciseType,
  ExerciseWeightRecord,
} from '@/types/exercise.types';

interface CreateExerciseWeightData {
  exerciseId: string;
  exerciseType: ExerciseType;
  weight: number;
  unit: ExerciseRecordUnit;
}

const POUNDS_PER_KILOGRAM = 2.2046226218;

function serializeRecord(record: PrismaExerciseWeightRecord): ExerciseWeightRecord {
  return {
    ...record,
    exerciseType: record.exerciseType as ExerciseType,
    unit: record.unit as ExerciseRecordUnit,
    recordedAt: record.recordedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class ExerciseWeightService {
  static async create(
    userId: string,
    data: CreateExerciseWeightData
  ): Promise<ExerciseWeightRecord> {
    // Solo los registros de peso real alimentan weightKg; reps y minutos quedan en 0
    // para que las comparaciones y gráficas de carga no los mezclen.
    const weightKg =
      data.unit === 'kg' ? data.weight : data.unit === 'lb' ? data.weight / POUNDS_PER_KILOGRAM : 0;

    const record = await prisma.exerciseWeightRecord.create({
      data: {
        userId,
        exerciseId: data.exerciseId,
        exerciseType: data.exerciseType,
        weight: data.weight,
        unit: data.unit,
        weightKg,
      },
    });

    return serializeRecord(record);
  }

  static async findAllByUser(
    userId: string,
    exerciseType?: ExerciseType,
    exerciseId?: string
  ): Promise<ExerciseWeightRecord[]> {
    const records = await prisma.exerciseWeightRecord.findMany({
      where: {
        userId,
        ...(exerciseType && { exerciseType }),
        ...(exerciseId && { exerciseId }),
      },
      orderBy: { recordedAt: 'desc' },
    });

    return records.map(serializeRecord);
  }
}
