import type { TriadQuality } from '../domain/music';

/**
 * Triad qualities offered in the "Learn triads" tab, in display order. Each maps to the chord
 * type of the same name via `chordTypeForTriad`, so adding a quality here is enough once its
 * chord type exists; the inversion and fret logic is generic. All four are offered because
 * "Chords in this key" can send any diatonic triad here to practise.
 */
export const LEARNABLE_TRIAD_QUALITIES: readonly TriadQuality[] = [
  'major',
  'minor',
  'diminished',
  'augmented',
];

export const TRIAD_QUALITY_LABELS: Record<TriadQuality, string> = {
  major: 'Major',
  minor: 'Minor',
  diminished: 'Diminished',
  augmented: 'Augmented',
};
