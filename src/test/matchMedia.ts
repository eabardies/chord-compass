/**
 * A minimal, controllable window.matchMedia for jsdom. Only the dark-scheme query is
 * meaningful; `setSystemDark` flips it and notifies listeners like a real OS change.
 */
type Listener = (event: MediaQueryListEvent) => void;

const DARK_QUERY = '(prefers-color-scheme: dark)';
let systemDark = false;
const listeners = new Set<Listener>();

export function installMatchMedia(initialDark: boolean): void {
  systemDark = initialDark;
  listeners.clear();
  window.matchMedia = (query: string): MediaQueryList => {
    const list = {
      media: query,
      get matches() {
        return query === DARK_QUERY && systemDark;
      },
      onchange: null,
      addEventListener: (_type: string, listener: Listener) => {
        listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: Listener) => {
        listeners.delete(listener);
      },
      addListener: (listener: Listener) => listeners.add(listener),
      removeListener: (listener: Listener) => listeners.delete(listener),
      dispatchEvent: () => true,
    };
    return list as unknown as MediaQueryList;
  };
}

/** Simulate the operating system switching its colour scheme. */
export function setSystemDark(dark: boolean): void {
  systemDark = dark;
  const event = { matches: dark, media: DARK_QUERY } as MediaQueryListEvent;
  for (const listener of listeners) listener(event);
}
