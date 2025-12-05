/**
 * Middleware de Prisma para convertir fechas automáticamente
 * - Al guardar: convierte de zona horaria del usuario a UTC
 * - Al leer: convierte de UTC a zona horaria del usuario
 */

import { Prisma } from '@prisma/client';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { getContextTimezone } from './prisma-context';

// Campos DateTime que deben convertirse (excluyendo createdAt/updatedAt que son automáticos)
const DATE_FIELDS_BY_MODEL: Record<string, string[]> = {
  HabitEntry: ['date', 'completedAt'],
  Transaction: ['date'],
  Book: ['startDate', 'endDate'],
  IncomeSource: ['startDate', 'endDate'],
  RecurringExpense: ['startDate', 'endDate', 'lastPaid'],
  Asset: ['purchaseDate'],
  Debt: ['startDate', 'endDate', 'paidDate'],
  Goal: ['targetDate', 'completedAt'],
  DailyJournal: ['date'],
};

/**
 * Convierte una fecha de zona horaria del usuario a UTC para guardar
 * La fecha viene en la zona horaria del usuario y se convierte al inicio del día en UTC
 */
function convertToUTC(date: Date, timezone: string): Date {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return date;
  }
  // La fecha viene en la zona horaria del usuario
  // Convertirla al inicio del día en esa zona horaria y luego a UTC
  const zonedDate = toZonedTime(date, timezone);
  const startOfDay = new Date(zonedDate);
  startOfDay.setHours(0, 0, 0, 0);
  return fromZonedTime(startOfDay, timezone);
}

/**
 * Convierte una fecha de UTC a zona horaria del usuario
 */
function convertFromUTC(date: Date, timezone: string): Date {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return date;
  }
  // Convertir de UTC a la zona horaria del usuario
  return toZonedTime(date, timezone);
}

/**
 * Convierte recursivamente fechas en un objeto
 */
function convertDatesInObject(
  obj: unknown,
  modelName: string,
  convertFn: (date: Date) => Date
): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return convertFn(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertDatesInObject(item, modelName, convertFn));
  }

  const dateFields = DATE_FIELDS_BY_MODEL[modelName] || [];
  const converted = { ...obj } as Record<string, unknown>;

  for (const [key, value] of Object.entries(converted)) {
    if (dateFields.includes(key) && value instanceof Date) {
      converted[key] = convertFn(value);
    } else if (value && typeof value === 'object') {
      converted[key] = convertDatesInObject(value, modelName, convertFn);
    }
  }

  return converted;
}

/**
 * Middleware de Prisma para conversión automática de fechas
 */
export function createTimezoneMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const timezone = getContextTimezone();
    const modelName = params.model || '';

    const convertToUTCFn = (date: Date) => convertToUTC(date, timezone);

    // Al escribir (create, update, upsert): convertir de zona horaria del usuario a UTC
    if (['create', 'update', 'upsert', 'createMany', 'updateMany'].includes(params.action)) {
      if (params.args?.data) {
        params.args.data = convertDatesInObject(
          params.args.data,
          modelName,
          convertToUTCFn
        ) as typeof params.args.data;
      }
      if (params.args?.create) {
        params.args.create = convertDatesInObject(
          params.args.create,
          modelName,
          convertToUTCFn
        ) as typeof params.args.create;
      }
      if (params.args?.update) {
        params.args.update = convertDatesInObject(
          params.args.update,
          modelName,
          convertToUTCFn
        ) as typeof params.args.update;
      }
    }

    // Para where en TODAS las operaciones: convertir fechas en condiciones a UTC
    // Esto incluye findMany, findFirst, update, delete, etc.
    if (params.args?.where) {
      params.args.where = convertDatesInObject(
        params.args.where,
        modelName,
        convertToUTCFn
      ) as typeof params.args.where;
    }

    // Ejecutar la operación
    const result = await next(params);

    // Al leer (findMany, findFirst, findUnique, etc.): convertir de UTC a zona horaria del usuario
    if (
      ['findMany', 'findFirst', 'findUnique', 'findUniqueOrThrow', 'findFirstOrThrow'].includes(
        params.action
      )
    ) {
      const convertFromUTCFn = (date: Date) => convertFromUTC(date, timezone);
      return convertDatesInObject(result, modelName, convertFromUTCFn);
    }

    // Para create, update, upsert: también convertir el resultado
    if (['create', 'update', 'upsert'].includes(params.action) && result) {
      const convertFromUTCFn = (date: Date) => convertFromUTC(date, timezone);
      return convertDatesInObject(result, modelName, convertFromUTCFn);
    }

    return result;
  };
}
