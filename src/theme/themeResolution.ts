/**
 * Pure theme logic shared by the provider and the tests. The inline script in index.html
 * applies the same rule before React loads (same storage key, same accepted values) so a
 * returning dark-mode user never sees a light flash; keep the two in step.
 */
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

/** localStorage key holding "light" or "dark". Absent (or anything else) means "system". */
export const THEME_STORAGE_KEY = 'chord-compass-theme';

export const THEME_ATTRIBUTE = 'data-theme';

export function isResolvedTheme(value: unknown): value is ResolvedTheme {
  return value === 'light' || value === 'dark';
}

/** A stored value is only honoured when it is exactly "light" or "dark". */
export function parseStoredPreference(value: string | null | undefined): ThemePreference {
  return isResolvedTheme(value) ? value : 'system';
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}

/** Toggling always lands on an explicit theme, the opposite of what is currently shown. */
export function nextTheme(current: ResolvedTheme): ResolvedTheme {
  return current === 'dark' ? 'light' : 'dark';
}
