const timezoneConfigs: Record<
  string,
  { countryCode: string; latitude: number; longitude: number; label: string }
> = {
  'America/New_York': {
    countryCode: 'US',
    latitude: 40.7128,
    longitude: -74.006,
    label: 'Nueva York',
  },
  'America/Chicago': {
    countryCode: 'US',
    latitude: 41.8781,
    longitude: -87.6298,
    label: 'Chicago',
  },
  'America/Denver': { countryCode: 'US', latitude: 39.7392, longitude: -104.9903, label: 'Denver' },
  'America/Los_Angeles': {
    countryCode: 'US',
    latitude: 34.0522,
    longitude: -118.2437,
    label: 'Los Ángeles',
  },
  'America/El_Salvador': {
    countryCode: 'SV',
    latitude: 13.6929,
    longitude: -89.2182,
    label: 'San Salvador',
  },
  'America/Mexico_City': {
    countryCode: 'MX',
    latitude: 19.4326,
    longitude: -99.1332,
    label: 'Ciudad de México',
  },
  'America/Sao_Paulo': {
    countryCode: 'BR',
    latitude: -23.5505,
    longitude: -46.6333,
    label: 'São Paulo',
  },
  'America/Argentina/Buenos_Aires': {
    countryCode: 'AR',
    latitude: -34.6037,
    longitude: -58.3816,
    label: 'Buenos Aires',
  },
  'Europe/Madrid': { countryCode: 'ES', latitude: 40.4168, longitude: -3.7038, label: 'Madrid' },
  'Europe/London': { countryCode: 'GB', latitude: 51.5074, longitude: -0.1278, label: 'Londres' },
  'Europe/Paris': { countryCode: 'FR', latitude: 48.8566, longitude: 2.3522, label: 'París' },
  'Europe/Berlin': { countryCode: 'DE', latitude: 52.52, longitude: 13.405, label: 'Berlín' },
  'Europe/Rome': { countryCode: 'IT', latitude: 41.9028, longitude: 12.4964, label: 'Roma' },
  'Asia/Tokyo': { countryCode: 'JP', latitude: 35.6762, longitude: 139.6503, label: 'Tokio' },
  'Asia/Hong_Kong': {
    countryCode: 'HK',
    latitude: 22.3193,
    longitude: 114.1694,
    label: 'Hong Kong',
  },
  'Asia/Shanghai': { countryCode: 'CN', latitude: 31.2304, longitude: 121.4737, label: 'Shanghai' },
  'Asia/Singapore': { countryCode: 'SG', latitude: 1.3521, longitude: 103.8198, label: 'Singapur' },
  'Asia/Kolkata': { countryCode: 'IN', latitude: 28.6139, longitude: 77.209, label: 'Delhi' },
  'Australia/Sydney': {
    countryCode: 'AU',
    latitude: -33.8688,
    longitude: 151.2093,
    label: 'Sídney',
  },
  'Pacific/Auckland': {
    countryCode: 'NZ',
    latitude: -36.8485,
    longitude: 174.7633,
    label: 'Auckland',
  },
};

const regionFallbacks: Record<
  string,
  { countryCode: string; latitude: number; longitude: number; label: string }
> = {
  America: {
    countryCode: 'US',
    latitude: 39.8283,
    longitude: -98.5795,
    label: 'Estados Unidos',
  },
  Europe: { countryCode: 'GB', latitude: 51.1657, longitude: 10.4515, label: 'Europa' },
  Asia: { countryCode: 'IN', latitude: 34.0479, longitude: 100.6197, label: 'Asia' },
  Africa: { countryCode: 'ZA', latitude: -30.5595, longitude: 22.9375, label: 'África' },
  Pacific: { countryCode: 'AU', latitude: -25.2744, longitude: 133.7751, label: 'Pacífico' },
};

const defaultConfig = {
  countryCode: 'US',
  latitude: 37.0902,
  longitude: -95.7129,
  label: 'Estados Unidos',
};

export function getTimezoneConfig(timezone: string | null | undefined) {
  if (!timezone) {
    return defaultConfig;
  }

  const normalized = timezone.trim();
  if (timezoneConfigs[normalized]) {
    return timezoneConfigs[normalized];
  }

  const region = normalized.split('/')[0];
  if (regionFallbacks[region]) {
    return regionFallbacks[region];
  }

  return defaultConfig;
}
