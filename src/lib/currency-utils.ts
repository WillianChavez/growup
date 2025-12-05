export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'es-ES'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(
  number: number,
  decimals: number = 0,
  locale: string = 'es-ES'
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)}%`;
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

export function roundToDecimals(num: number, decimals: number = 2): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Formatea un número como moneda con punto decimal y coma para miles
 * Ejemplo: 11600.43 -> "11,600.43"
 */
export function formatCurrencyAmount(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Formatea un número para mostrar como moneda con símbolo $
 * Ejemplo: 11600.43 -> "$11,600.43"
 */
export function formatCurrencyDisplay(amount: number, decimals: number = 2): string {
  return `$${formatCurrencyAmount(amount, decimals)}`;
}

/**
 * Parsea un string de input de moneda (acepta punto decimal y comas como separadores de miles)
 * Ejemplo: "11,600.43" -> 11600.43
 */
export function parseCurrencyInput(value: string): number {
  if (!value || value.trim() === '') return 0;
  // Remover comas (separadores de miles) y mantener solo el punto decimal
  const cleaned = value.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formatea un valor para mostrar en un input de moneda
 * Ejemplo: 11600.43 -> "11,600.43"
 */
export function formatCurrencyInput(value: number | string): string {
  if (value === '' || value === null || value === undefined) return '';
  const numValue = typeof value === 'string' ? parseCurrencyInput(value) : value;
  if (numValue === 0) return '';
  return formatCurrencyAmount(numValue, 2);
}

/**
 * Valida y formatea el input mientras el usuario escribe
 * Permite: números, punto decimal, y comas como separadores de miles
 */
export function handleCurrencyInputChange(value: string, setValue: (value: number) => void): void {
  // Permitir vacío
  if (value === '') {
    setValue(0);
    return;
  }

  // Remover caracteres no válidos (solo números, punto y comas)
  const cleaned = value.replace(/[^\d.,]/g, '');

  // Validar formato: números con punto decimal opcional y comas opcionales
  // Permitir: "1,234.56", "1234.56", "1234", ".56", etc.
  if (/^[\d,]*\.?\d*$/.test(cleaned)) {
    const parsed = parseCurrencyInput(cleaned);
    setValue(parsed);
  }
}
