import type { ProgressionTemplate } from '../domain/progressions';

function diatonic(
  id: string,
  mode: 'major' | 'minor',
  degrees: readonly number[],
  description: string,
): ProgressionTemplate {
  return {
    id,
    mode,
    kind: 'diatonic',
    steps: degrees.map((degree) => ({ degree })),
    description,
  };
}

/** Progressions shown for each mode. Their names are generated from the harmonized numerals. */
export const PROGRESSION_TEMPLATES: readonly ProgressionTemplate[] = [
  diatonic(
    'major-1-4-5',
    'major',
    [1, 4, 5],
    'The three primary chords. Countless folk, rock and country songs use nothing else.',
  ),
  diatonic(
    'major-1-5-6-4',
    'major',
    [1, 5, 6, 4],
    'The most common pop progression of the last few decades.',
  ),
  diatonic(
    'major-6-4-1-5',
    'major',
    [6, 4, 1, 5],
    'The same four chords starting from the relative minor for a more wistful feel.',
  ),
  diatonic(
    'major-2-5-1',
    'major',
    [2, 5, 1],
    'The standard jazz cadence, here with triads. Try sevenths on each chord once you know it.',
  ),
  diatonic(
    'minor-1-6-3-7',
    'minor',
    [1, 6, 3, 7],
    'A natural minor staple: every chord is borrowed from the relative major.',
  ),
  diatonic(
    'minor-1-4-5',
    'minor',
    [1, 4, 5],
    'The minor version of the primary chords, with a minor v as natural minor gives it.',
  ),
];

/**
 * The 12-bar blues uses a dominant seventh on I, IV and V. Strictly speaking only V7 is
 * diatonic to a major key; the I7 and IV7 are what give blues its sound. Each step is one bar.
 */
export const TWELVE_BAR_BLUES: ProgressionTemplate = {
  id: 'twelve-bar-blues',
  mode: 'major',
  kind: 'blues',
  steps: [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5].map((degree) => ({
    degree,
    chordTypeId: 'dominant7',
  })),
  description:
    'Twelve bars, three chords, all dominant sevenths. The I7 and IV7 are not diatonic to the major key, which is exactly what makes it sound like the blues.',
};

export function progressionsForMode(mode: 'major' | 'minor'): ProgressionTemplate[] {
  return PROGRESSION_TEMPLATES.filter((template) => template.mode === mode);
}
