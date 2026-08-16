import { prisma } from '@/lib/db';
import type { ExerciseWeightRecord as PrismaExerciseWeightRecord } from '@prisma/client';
import type { ExerciseType, ExerciseWeightRecord, WeightUnit } from '@/types/exercise.types';

interface CreateExerciseWeightData {
  exerciseId: string;
  exerciseType: ExerciseType;
  weight: number;
  unit: WeightUnit;
}

const POUNDS_PER_KILOGRAM = 2.2046226218;

function serializeRecord(record: PrismaExerciseWeightRecord): ExerciseWeightRecord {
  return {
    ...record,
    exerciseType: record.exerciseType as ExerciseType,
    unit: record.unit as WeightUnit,
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
    const weightKg = data.unit === 'kg' ? data.weight : data.weight / POUNDS_PER_KILOGRAM;

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
