import { normalizeMoney } from '@/lib/money';

interface RateCacheEntry {
  expires: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

const rateCache = new Map<string, RateCacheEntry>();
const CACHE_TTL = 60 * 60 * 1000;

async function fetchRates(
  base: string,
  symbols: string[]
): Promise<{ base: string; date: string; rates: Record<string, number> }> {
  const normalizedBase = base.toUpperCase();
  const cacheKey = `${normalizedBase}:${symbols.sort().join(',')}`;
  const cached = rateCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return { base: cached.base, date: cached.date, rates: cached.rates };
  }

  const symbolsParam = symbols.map((symbol) => symbol.toUpperCase()).join(',');
  const url = `https://api.frankfurter.app/latest?from=${normalizedBase}&symbols=${symbolsParam}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('No se pudo obtener tasas de cambio');
  }

  const data = await response.json();
  const rates: Record<string, number> = {};
  for (const [currency, rate] of Object.entries(data.rates || {})) {
    rates[currency.toUpperCase()] = Number(rate);
  }

  const entry: RateCacheEntry = {
    expires: Date.now() + CACHE_TTL,
    base: data.base,
    date: data.date,
    rates,
  };

  rateCache.set(cacheKey, entry);
  return { base: entry.base, date: entry.date, rates: entry.rates };
}

export async function convertCurrency({
  base,
  amount,
  targets,
}: {
  base: string;
  amount: number;
  targets: string[];
}) {
  const normalizedBase = base.toUpperCase();
  const symbols = targets.filter((target) => target.toUpperCase() !== normalizedBase);

  if (symbols.length === 0) {
    return {
      base: normalizedBase,
      date: new Date().toISOString().split('T')[0],
      conversions: [],
    };
  }

  const { date, rates } = await fetchRates(normalizedBase, symbols);
  const conversions = symbols.map((target) => {
    const rate = rates[target.toUpperCase()];
    if (!rate) {
      throw new Error(`No hay tasa para ${target}`);
    }
    const converted = normalizeMoney(amount * rate);
    return { currency: target.toUpperCase(), rate, converted };
  });

  return {
    base: normalizedBase,
    date,
    conversions,
  };
}
