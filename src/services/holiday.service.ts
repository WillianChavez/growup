import { isAfter, isEqual } from 'date-fns';

interface HolidayRecord {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
}

interface HolidayCacheEntry {
  expires: number;
  data: HolidayRecord[];
}

const holidayCache = new Map<string, HolidayCacheEntry>();
const CACHE_TTL = 12 * 60 * 60 * 1000;

const BASE_URL = 'https://date.nager.at/api/v3/PublicHolidays';

async function fetchHolidays(countryCode: string, year: number): Promise<HolidayRecord[]> {
  const cacheKey = `${countryCode}:${year}`;
  const cached = holidayCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const response = await fetch(`${BASE_URL}/${year}/${countryCode}`);
  if (!response.ok) {
    return [];
  }

  const data: HolidayRecord[] = await response.json();
  const entry: HolidayCacheEntry = {
    expires: Date.now() + CACHE_TTL,
    data,
  };
  holidayCache.set(cacheKey, entry);
  return data;
}

export async function getNextHoliday(countryCode: string, fromDate: Date) {
  const year = fromDate.getFullYear();
  const holidays = await fetchHolidays(countryCode, year);
  const upcoming = holidays.find((holiday) => {
    const holidayDate = new Date(holiday.date);
    return isAfter(holidayDate, fromDate) || isEqual(holidayDate, fromDate);
  });

  if (upcoming) {
    return upcoming;
  }

  const nextYearHolidays = await fetchHolidays(countryCode, year + 1);
  return nextYearHolidays[0] ?? null;
}
