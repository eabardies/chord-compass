import {
  chordToneLabels,
  triadNoteNames,
  triadTone,
  type Triad,
  type TriadTone,
  type TriadToneRole,
} from './triads';

/**
 * An inversion names which chord tone is lowest. The remaining tones follow in the same
 * cyclic order (root → third → fifth → root), so the three inversions of a triad are the
 * three rotations of its formula.
 */
export type TriadInversion = 'root' | 'first' | 'second';

export const TRIAD_INVERSIONS: readonly TriadInversion[] = ['root', 'first', 'second'];

export const INVERSION_NAMES: Record<TriadInversion, string> = {
  root: 'Root position',
  first: 'First inversion',
  second: 'Second inversion',
};

/** Tone roles from the lowest to the highest voice. */
export const INVERSION_TONE_ORDER: Record<TriadInversion, readonly TriadToneRole[]> = {
  root: ['root', 'third', 'fifth'],
  first: ['third', 'fifth', 'root'],
  second: ['fifth', 'root', 'third'],
};

export interface InvertedTriad {
  readonly triad: Triad;
  readonly inversion: TriadInversion;
  /** "First inversion" */
  readonly name: string;
  /** Low to high. */
  readonly tones: readonly [TriadTone, TriadTone, TriadTone];
  /** Low to high, with the root written "R": "3–5–R". */
  readonly degreeOrder: string;
  /** Low to high: "C♯–E–A". */
  readonly noteOrder: string;
  /** The lowest tone, which names the inversion: first inversion has the third in the bass. */
  readonly bass: TriadTone;
}

export function invertTriad(triad: Triad, inversion: TriadInversion): InvertedTriad {
  const [low, middle, high] = INVERSION_TONE_ORDER[inversion].map((role) => triadTone(triad, role));
  const tones: [TriadTone, TriadTone, TriadTone] = [low, middle, high];
  return {
    triad,
    inversion,
    name: INVERSION_NAMES[inversion],
    tones,
    degreeOrder: chordToneLabels(tones).join('–'),
    noteOrder: triadNoteNames(tones).join('–'),
    bass: low,
  };
}

/** The three inversions in order: root position, first, second. */
export function triadInversions(triad: Triad): InvertedTriad[] {
  return TRIAD_INVERSIONS.map((inversion) => invertTriad(triad, inversion));
}
