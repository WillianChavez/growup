import { getTimezoneConfig } from '@/lib/location-utils';

const weatherCache = new Map<string, { expires: number; data: WeatherSummary }>();
const CACHE_TTL = 15 * 60 * 1000;

const weatherCodeDescriptions: Record<number, string> = {
  0: 'Cielo despejado',
  1: 'Mayormente soleado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina con escarcha',
  51: 'Lluvia ligera',
  53: 'Lluvia moderada',
  55: 'Lluvia intensa',
  56: 'Lluvia helada ligera',
  57: 'Lluvia helada intensa',
  61: 'Chubascos ligeros',
  63: 'Chubascos moderados',
  65: 'Chubascos intensos',
  66: 'Aguanieve ligera',
  67: 'Aguanieve intensa',
  71: 'Nieve ligera',
  73: 'Nieve moderada',
  75: 'Nieve intensa',
  77: 'Granizo',
  80: 'Lluvia intermitente ligera',
  81: 'Lluvia intermitente moderada',
  82: 'Lluvia intermitente intensa',
  85: 'Nieve intermitente ligera',
  86: 'Nieve intermitente intensa',
  95: 'Tormenta eléctrica',
  96: 'Tormenta con granizo ligera',
  99: 'Tormenta con granizo intensa',
};

interface WeatherSummary {
  temperature: number;
  windspeed: number;
  precipitationProbability?: number;
  weatherCode: number;
  description: string;
  location: string;
  timezone: string;
}

export async function getWeatherSummary(timezone: string): Promise<WeatherSummary | null> {
  const config = getTimezoneConfig(timezone);
  const cacheKey = `${config.latitude}:${config.longitude}_${timezone}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${config.latitude}&longitude=${config.longitude}&current_weather=true&hourly=precipitation_probability&timezone=${encodeURIComponent(
    timezone
  )}`;
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const current = data.current_weather;
  const precipitation = Array.isArray(data.hourly?.precipitation_probability)
    ? data.hourly.precipitation_probability[0]
    : undefined;

  const weatherCode = current?.weathercode ?? 0;
  const summary: WeatherSummary = {
    temperature: current?.temperature ?? 0,
    windspeed: current?.windspeed ?? 0,
    precipitationProbability: precipitation,
    weatherCode,
    description: weatherCodeDescriptions[weatherCode] || 'Condiciones variadas',
    location: config.label,
    timezone,
  };

  weatherCache.set(cacheKey, {
    expires: Date.now() + CACHE_TTL,
    data: summary,
  });

  return summary;
}
