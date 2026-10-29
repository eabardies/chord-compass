import type { Interval, PitchClass } from '../music';

/**
 * Frets are always listed low E → high E:
 *   null  muted string
 *   0     open string
 *   n > 0 fretted at fret n
 */
export type FretValue = number | null;

export type Finger = 1 | 2 | 3 | 4;

export interface Barre {
  readonly fret: number;
  /** Lowest string index covered (0 = low E). */
  readonly fromString: number;
  /** Highest string index covered (5 = high E). */
  readonly toString: number;
  readonly finger: Finger;
}

/**
 * "fixed" shapes live at one position and may use open strings.
 * "movable" shapes contain no open strings and can be shifted along the neck; their fret
 * values describe the shape at its written position, for the chord of `rootPitchClass`.
 */
export type ShapeKind = 'fixed' | 'movable';

/**
 * Whether a human has confirmed the fingering is playable as written. Musical correctness
 * (every note belongs to the chord) is checked by code; comfort is not.
 */
export type Playability = 'verified' | 'unverified';

export interface ShapeDefinition {
  readonly id: string;
  readonly chordTypeId: string;
  /** Pitch class of the chord root the shape is written for. */
  readonly rootPitchClass: PitchClass;
  readonly kind: ShapeKind;
  /** Short name shown to users, e.g. "Open position" or "E-shape barre". */
  readonly label: string;
  readonly frets: readonly FretValue[];
  /** Finger per string, parallel to `frets`; null for muted and open strings. */
  readonly fingers: readonly (Finger | null)[];
  readonly barres: readonly Barre[];
  /** Chord degrees intentionally left out, e.g. the fifth in an open C7. */
  readonly omittedDegrees: readonly Interval[];
  readonly playability: Playability;
}

/** Highest fret a transposed shape may reach. Shapes beyond this get cramped on most guitars. */
export const MAX_FRET = 15;

/** Largest distance between the lowest and highest fretted note of a comfortable shape. */
export const MAX_FRET_SPAN = 4;

export function frettedValues(frets: readonly FretValue[]): number[] {
  return frets.filter((fret): fret is number => fret !== null && fret > 0);
}

export function fretRange(frets: readonly FretValue[]): { min: number; max: number } | null {
  const fretted = frettedValues(frets);
  if (fretted.length === 0) return null;
  return { min: Math.min(...fretted), max: Math.max(...fretted) };
}

export function hasOpenString(frets: readonly FretValue[]): boolean {
  return frets.some((fret) => fret === 0);
}
