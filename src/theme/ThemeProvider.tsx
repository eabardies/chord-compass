import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { nextTheme, resolveTheme, THEME_ATTRIBUTE, type ThemePreference } from './themeResolution';
import { ThemeContext, type ThemeContextValue } from './themeContext';
import { defaultThemeStorage, type ThemeStorage } from './themeStorage';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY).matches
    : false;
}

interface ThemeProviderProps {
  children: ReactNode;
  storage?: ThemeStorage;
}

/**
 * Owns the preference ("system" until the user toggles), resolves it against the OS setting,
 * writes `data-theme` on <html> and persists explicit choices. While the preference is
 * "system" it follows OS changes live; an explicit choice is never overridden.
 */
export function ThemeProvider({ children, storage = defaultThemeStorage }: ThemeProviderProps) {
  const [preference, setPreference] = useState<ThemePreference>(() => storage.read());
  const [prefersDark, setPrefersDark] = useState(systemPrefersDark);
  const theme = resolveTheme(preference, prefersDark);

  useEffect(() => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
  }, [theme]);

  useEffect(() => {
    if (preference !== 'system' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [preference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      theme,
      toggle: () => {
        const next = nextTheme(theme);
        setPreference(next);
        storage.write(next);
      },
    }),
    [preference, theme, storage],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
