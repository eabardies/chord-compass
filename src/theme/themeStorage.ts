import {
  parseStoredPreference,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from './themeResolution';

/**
 * localStorage access that never throws: private windows, blocked storage and quota errors
 * all degrade to "system" and an unsaved choice.
 */
export interface ThemeStorage {
  read(): ThemePreference;
  write(theme: ResolvedTheme): void;
}

export function browserThemeStorage(storage: Storage | null | undefined): ThemeStorage {
  return {
    read() {
      try {
        return parseStoredPreference(storage?.getItem(THEME_STORAGE_KEY));
      } catch {
        return 'system';
      }
    },
    write(theme) {
      try {
        storage?.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Storage is unavailable; the choice still applies for this visit.
      }
    },
  };
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const defaultThemeStorage: ThemeStorage = browserThemeStorage(safeLocalStorage());
