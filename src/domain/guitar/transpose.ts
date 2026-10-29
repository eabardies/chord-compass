import { normalizePitchClass, SEMITONES_PER_OCTAVE, type PitchClass } from '../music';
import { fretRange, MAX_FRET, type Barre, type FretValue, type ShapeDefinition } from './shapes';

export interface TransposedFrets {
  readonly frets: readonly FretValue[];
  readonly barres: readonly Barre[];
}

/**
 * Shift every fretted note by `semitones`. Open strings (0) and muted strings (null) are
 * never shifted: an open string sounds the same wherever your hand is, so it would stop
 * being a chord tone. Movable shapes therefore contain no open strings (enforced by
 * validation), and this function refuses to shift a shape below fret 1 or above MAX_FRET.
 */
export function transposeFrets(
  frets: readonly FretValue[],
  barres: readonly Barre[],
  semitones: number,
): TransposedFrets {
  const range = fretRange(frets);
  if (range && (range.min + semitones < 1 || range.max + semitones > MAX_FRET)) {
    throw new Error(
      `Transposing by ${semitones} leaves frets ${range.min + semitones}–${range.max + semitones}, outside 1–${MAX_FRET}`,
    );
  }
  return {
    frets: frets.map((fret) => (fret === null || fret === 0 ? fret : fret + semitones)),
    barres: barres.map((barre) => ({ ...barre, fret: barre.fret + semitones })),
  };
}

/**
 * The semitone shift that places a movable shape on `targetRoot`, choosing the lowest
 * position that keeps every fret within 1..MAX_FRET. Returns null when none fits.
 */
export function movableShapeOffset(shape: ShapeDefinition, targetRoot: PitchClass): number | null {
  const range = fretRange(shape.frets);
  if (!range) return null;
  const base = normalizePitchClass(targetRoot - shape.rootPitchClass);
  const candidates = [base - SEMITONES_PER_OCTAVE, base, base + SEMITONES_PER_OCTAVE];
  return (
    candidates.find((offset) => range.min + offset >= 1 && range.max + offset <= MAX_FRET) ?? null
  );
}
