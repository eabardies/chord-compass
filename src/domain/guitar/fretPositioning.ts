import { normalizePitchClass, type NoteSpelling, type PitchClass } from '../music';
import { MAX_FRET, MAX_FRET_SPAN } from './shapes';
import { soundingPitchClass } from './voicing';

/**
 * Pure fret arithmetic for generated (not curated) shapes. Nothing here knows about triads:
 * it maps pitch classes to frets on a string and picks the most compact combination of one
 * fret per string.
 */

/** A note placed on one string. `fret` 0 is the open string. */
export interface FretPosition {
  /** 0 = low E. */
  readonly stringIndex: number;
  readonly fret: number;
}

/** Highest fret a generated shape may use. Shapes straddling the 12th fret need a few more. */
export const GENERATED_MAX_FRET = MAX_FRET;

/**
 * Largest distance between the lowest and highest fret of a comfortable generated shape.
 * Open strings count as fret 0: a shape mixing an open string with fret 11 puts the hand in
 * two places at once, so it is a stretch even though no finger covers the span.
 */
export const GENERATED_MAX_FRET_SPAN = MAX_FRET_SPAN;

/**
 * Every fret from 0 to `maxFret` on which `openNote` sounds as `pitchClass`. A pitch class
 * recurs every 12 frets, so an open-string note is also available at fret 12.
 */
export function fretsSounding(
  openNote: NoteSpelling,
  pitchClass: PitchClass,
  maxFret: number = GENERATED_MAX_FRET,
): number[] {
  const first = normalizePitchClass(pitchClass - soundingPitchClass(openNote, 0));
  const frets: number[] = [];
  for (let fret = first; fret <= maxFret; fret += 12) frets.push(fret);
  return frets;
}

/** Distance between the lowest and highest fret, counting open strings as fret 0. */
export function fretSpan(frets: readonly number[]): number {
  if (frets.length === 0) return 0;
  return Math.max(...frets) - Math.min(...frets);
}

export interface FretCombination {
  readonly frets: readonly number[];
  readonly span: number;
}

/**
 * Pick one fret per string from the candidate lists, preferring in order:
 *   1. the smallest span (compact, no stretch),
 *   2. the lowest position when spans tie,
 *   3. the lowest highest-fret when both tie.
 * Rule 2 is why C major's second inversion on G B e is 0–1–0 rather than 12–13–12, and rule 1
 * is why A major's root position on A D G is 12–11–9 rather than 0–11–9.
 */
export function mostCompactCombination(
  candidatesPerString: readonly (readonly number[])[],
): FretCombination | null {
  let best: FretCombination | null = null;
  for (const frets of cartesian(candidatesPerString)) {
    const candidate = { frets, span: fretSpan(frets) };
    if (best === null || compareCombinations(candidate, best) < 0) best = candidate;
  }
  return best;
}

function compareCombinations(a: FretCombination, b: FretCombination): number {
  if (a.span !== b.span) return a.span - b.span;
  const lowestDifference = Math.min(...a.frets) - Math.min(...b.frets);
  if (lowestDifference !== 0) return lowestDifference;
  return Math.max(...a.frets) - Math.max(...b.frets);
}

function cartesian(lists: readonly (readonly number[])[]): number[][] {
  return lists.reduce<number[][]>(
    (combinations, list) =>
      combinations.flatMap((combination) => list.map((value) => [...combination, value])),
    [[]],
  );
}
