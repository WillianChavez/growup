import type { BookStatus } from '@/types/book.types';
import type { GoalStatus } from '@/types/goal.types';

export type ReadingViewMode = 'list' | 'board';
export type GoalsViewMode = 'list' | 'board' | 'accordion' | 'timeline';

export interface ReadingPreferences {
  viewMode?: ReadingViewMode;
  activeTab?: BookStatus;
}

export interface GoalsPreferences {
  viewMode?: GoalsViewMode;
  activeFilter?: 'todos' | 'proceso' | 'logrados' | 'pausados';
  activeBoardColumn?: GoalStatus;
  timelineColumns?: {
    activity: number;
    from: number;
    to: number;
  };
}

export interface AppUserSettings {
  reading?: ReadingPreferences;
  goals?: GoalsPreferences;
  [key: string]: unknown;
}

export function parseUserSettings(settings: string | null | undefined): AppUserSettings {
  if (!settings) {
    return {};
  }

  try {
    const parsed = JSON.parse(settings) as AppUserSettings;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function mergeUserSettings(
  currentSettings: string | null | undefined,
  partial: Partial<AppUserSettings>
): string {
  const parsed = parseUserSettings(currentSettings);
  return JSON.stringify({
    ...parsed,
    ...partial,
  });
}
