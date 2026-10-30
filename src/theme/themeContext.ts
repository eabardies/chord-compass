import { createContext } from 'react';
import type { ResolvedTheme, ThemePreference } from './themeResolution';

export interface ThemeContextValue {
  readonly preference: ThemePreference;
  readonly theme: ResolvedTheme;
  /** Switch to the opposite of what is shown and remember it. */
  readonly toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
