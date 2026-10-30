import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { installMatchMedia } from './matchMedia';

// jsdom has no matchMedia; tests drive the system theme through this stub.
beforeEach(() => {
  installMatchMedia(false);
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  window.localStorage.clear();
});
