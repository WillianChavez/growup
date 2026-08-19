const CENTS_FACTOR = 100;

export function normalizeMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * CENTS_FACTOR) / CENTS_FACTOR;
}

// Un monto "de dos decimales" no siempre cumple Number.isInteger(value * 100):
// 530.06 * 100 === 53005.99999999999 en punto flotante. Comparamos contra el
// entero más cercano con tolerancia para no rechazar montos legítimos.
export function hasAtMostTwoDecimals(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  const cents = value * CENTS_FACTOR;
  return Math.abs(cents - Math.round(cents)) < 1e-6;
}

export function toCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * CENTS_FACTOR);
}

export function fromCents(cents: number): number {
  if (!Number.isFinite(cents)) return 0;
  return normalizeMoney(cents / CENTS_FACTOR);
}

export function sumAsMoney(values: number[]): number {
  const totalCents = values.reduce((sum, value) => sum + toCents(value), 0);
  return fromCents(totalCents);
}
