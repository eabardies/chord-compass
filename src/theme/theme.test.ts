import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  nextTheme,
  parseStoredPreference,
  resolveTheme,
  THEME_STORAGE_KEY,
} from './themeResolution';
import { browserThemeStorage } from './themeStorage';

describe('theme resolution', () => {
  it('treats a missing or invalid stored value as the system preference', () => {
    expect(parseStoredPreference(null)).toBe('system');
    expect(parseStoredPreference(undefined)).toBe('system');
    expect(parseStoredPreference('')).toBe('system');
    expect(parseStoredPreference('blue')).toBe('system');
    expect(parseStoredPreference('DARK')).toBe('system');
  });

  it('honours a stored light or dark choice', () => {
    expect(parseStoredPreference('light')).toBe('light');
    expect(parseStoredPreference('dark')).toBe('dark');
  });

  it('resolves "system" from the operating system and explicit choices as themselves', () => {
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('toggles to the opposite of what is shown', () => {
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('light');
  });
});

describe('theme storage', () => {
  const fakeStorage = (initial: Record<string, string> = {}) => {
    const data = new Map(Object.entries(initial));
    return {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      data,
    } as unknown as Storage & { data: Map<string, string> };
  };

  it('reads and writes under the documented key', () => {
    const storage = fakeStorage();
    const themeStorage = browserThemeStorage(storage);
    expect(themeStorage.read()).toBe('system');
    themeStorage.write('dark');
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(themeStorage.read()).toBe('dark');
    expect(THEME_STORAGE_KEY).toBe('chord-compass-theme');
  });

  it('ignores malformed stored values', () => {
    expect(browserThemeStorage(fakeStorage({ [THEME_STORAGE_KEY]: 'sepia' })).read()).toBe(
      'system',
    );
  });

  it('survives unavailable or failing storage', () => {
    expect(browserThemeStorage(null).read()).toBe('system');
    expect(() => browserThemeStorage(null).write('dark')).not.toThrow();
    const failing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    } as unknown as Storage;
    expect(browserThemeStorage(failing).read()).toBe('system');
    expect(() => browserThemeStorage(failing).write('light')).not.toThrow();
  });
});

describe('pre-render theme script', () => {
  it('uses the same storage key and values as the theme module', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain(`getItem('${THEME_STORAGE_KEY}')`);
    expect(html).toContain(`theme !== 'light' && theme !== 'dark'`);
    expect(html).toContain(`setAttribute('data-theme', theme)`);
    expect(html).toContain('prefers-color-scheme: dark');
  });
});
