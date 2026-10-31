import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Contrast checks for the token pairs the triad diagrams and their controls draw with, in
 * both themes. WCAG 2.x: 4.5:1 for text, 3:1 for graphical objects and large text.
 */

type Theme = 'light' | 'dark';
type Tokens = Record<string, string>;

function parseThemes(css: string): Record<Theme, Tokens> {
  const block = (selector: string) => {
    const start = css.indexOf(selector);
    if (start < 0) throw new Error(`No block for ${selector}`);
    const open = css.indexOf('{', start);
    const close = css.indexOf('}', open);
    return css.slice(open + 1, close);
  };
  const tokens = (body: string): Tokens =>
    Object.fromEntries(
      Array.from(body.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi), (match) => [
        match[1],
        match[2].toLowerCase(),
      ]),
    );
  return {
    light: tokens(block("[data-theme='light']")),
    dark: tokens(block("[data-theme='dark']")),
  };
}

function luminance(hex: string): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const TEXT = 4.5;
const GRAPHIC = 3;

/** [foreground, surface, minimum ratio, what it is used for] */
const PAIRS: readonly [string, string, number, string][] = [
  ['color-text-primary', 'color-surface', TEXT, 'card text, active string labels'],
  ['color-text-primary', 'color-background', TEXT, 'page text'],
  ['color-text-secondary', 'color-surface', TEXT, 'fret numbers, string labels, orientation'],
  ['color-chord-tone-text', 'color-chord-tone', TEXT, 'degree and note inside a marker'],
  ['color-chord-tone-text', 'color-accent-hover', TEXT, 'degree and note inside the root marker'],
  ['color-text-primary', 'color-surface', TEXT, 'label inside an open-string marker'],
  ['color-selected-text', 'color-selected-surface', TEXT, 'pressed string-set and chord buttons'],
  ['color-text-on-accent', 'color-accent', TEXT, 'the "Practise all … triads" button'],
  ['color-diagram-nut', 'color-surface-muted', GRAPHIC, 'nut and active strings on the board'],
  ['color-diagram-line', 'color-surface-muted', GRAPHIC, 'frets and inactive strings on the board'],
  ['color-diagram-line', 'color-surface', GRAPHIC, 'strings left of the nut'],
  ['color-accent-hover', 'color-surface-muted', GRAPHIC, 'the root ring'],
  ['color-accent', 'color-surface', GRAPHIC, 'inversion boxes and highlighted scale tiles'],
  ['color-accent', 'color-selected-surface', GRAPHIC, 'border of a pressed button'],
  ['color-input-border', 'color-surface', GRAPHIC, 'border of an unpressed chord card'],
  ['color-text-primary', 'color-surface-muted', TEXT, 'selected-chord summary'],
];

describe('theme contrast for the triad diagrams', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');
  const themes = parseThemes(css);

  it('parses both themes', () => {
    expect(Object.keys(themes.light).length).toBeGreaterThan(20);
    expect(Object.keys(themes.dark)).toEqual(Object.keys(themes.light));
  });

  it.each(['light', 'dark'] as const)('%s theme keeps every pair readable', (theme) => {
    const tokens = themes[theme];
    for (const [foreground, surface, minimum, purpose] of PAIRS) {
      expect(tokens[foreground], `${foreground} missing in ${theme}`).toBeDefined();
      expect(tokens[surface], `${surface} missing in ${theme}`).toBeDefined();
      const ratio = contrast(tokens[foreground], tokens[surface]);
      expect(
        ratio,
        `${theme}: ${foreground} on ${surface} (${purpose}) is ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(minimum);
    }
  });
});
