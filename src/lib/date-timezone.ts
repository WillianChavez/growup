import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';

/**
 * Normaliza una fecha al inicio del día en la zona horaria del usuario
 * @param date - Fecha a normalizar
 * @param timezone - Zona horaria del usuario (ej: "America/El_Salvador")
 * @returns Fecha normalizada al inicio del día en UTC
 */
export function normalizeDateToUserTimezone(date: Date, timezone: string): Date {
  // Convertir la fecha a la zona horaria del usuario
  const zonedDate = toZonedTime(date, timezone);

  // Obtener el inicio del día en la zona horaria del usuario
  const startOfDay = new Date(zonedDate);
  startOfDay.setHours(0, 0, 0, 0);

  // Convertir de vuelta a UTC
  return fromZonedTime(startOfDay, timezone);
}

/**
 * Obtiene el rango de un día completo en la zona horaria del usuario
 * @param date - Fecha del día
 * @param timezone - Zona horaria del usuario
 * @returns Objeto con start y end del día en UTC
 */
export function getDayRangeInTimezone(date: Date, timezone: string): { start: Date; end: Date } {
  // Convertir la fecha a la zona horaria del usuario
  const zonedDate = toZonedTime(date, timezone);

  // Inicio del día en la zona horaria del usuario
  const startOfDay = new Date(zonedDate);
  startOfDay.setHours(0, 0, 0, 0);

  // Fin del día en la zona horaria del usuario
  const endOfDay = new Date(zonedDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Convertir de vuelta a UTC
  return {
    start: fromZonedTime(startOfDay, timezone),
    end: fromZonedTime(endOfDay, timezone),
  };
}

/**
 * Formatea una fecha en la zona horaria del usuario
 * @param date - Fecha en UTC
 * @param timezone - Zona horaria del usuario
 * @param formatString - Formato de fecha (date-fns format)
 * @returns Fecha formateada
 */
export function formatInTimezone(date: Date, timezone: string, formatString: string): string {
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, formatString, { timeZone: timezone });
}
