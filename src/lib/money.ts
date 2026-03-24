const CENTS_FACTOR = 100;

export function normalizeMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * CENTS_FACTOR) / CENTS_FACTOR;
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
