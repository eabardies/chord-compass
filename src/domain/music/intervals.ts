import { pitchClassOf, spellPitchClass, stepLetter, type NoteSpelling } from './notes';

/**
 * An interval is written relative to the major scale of the root: degree 3 is the major
 * third, "♭3" is one semitone lower, "♯5" one semitone higher. Degrees above 7 (9, 11, 13)
 * continue into the next octave.
 */
export interface Interval {
  /** Scale degree, 1-based. */
  readonly degree: number;
  /** Semitone adjustment from the major-scale degree: -1 = flat, 0 = natural, 1 = sharp. */
  readonly alteration: -1 | 0 | 1;
}

/** Semitones above the root for each major-scale degree 1..7. */
export const MAJOR_SCALE_SEMITONES = [0, 2, 4, 5, 7, 9, 11] as const;

const DEGREES_PER_OCTAVE = 7;

export function interval(degree: number, alteration: -1 | 0 | 1 = 0): Interval {
  if (!Number.isInteger(degree) || degree < 1) {
    throw new Error(`Invalid interval degree ${degree}`);
  }
  return { degree, alteration };
}

export function intervalSemitones(value: Interval): number {
  const octaves = Math.floor((value.degree - 1) / DEGREES_PER_OCTAVE);
  const degreeInOctave = (value.degree - 1) % DEGREES_PER_OCTAVE;
  return octaves * 12 + MAJOR_SCALE_SEMITONES[degreeInOctave] + value.alteration;
}

export function intervalLabel(value: Interval): string {
  const prefix = value.alteration === -1 ? '♭' : value.alteration === 1 ? '♯' : '';
  return `${prefix}${value.degree}`;
}

/** Parse "1", "b3", "♭3", "#5" or "♯5". */
export function parseInterval(token: string): Interval {
  const match = /^([b♭#♯]?)(\d+)$/.exec(token.trim());
  if (!match) throw new Error(`Cannot parse interval "${token}"`);
  const [, accidental, degreeText] = match;
  const alteration = accidental === 'b' || accidental === '♭' ? -1 : accidental === '' ? 0 : 1;
  return interval(Number(degreeText), alteration);
}

export function intervalsEqual(a: Interval, b: Interval): boolean {
  return a.degree === b.degree && a.alteration === b.alteration;
}

/**
 * The note `value` above `root`, spelled with the correct letter. The letter follows the
 * degree (a third above A is always some kind of C), the accidental follows the sound.
 * So A + ♯5 = E♯, not F.
 */
export function transposeNote(root: NoteSpelling, value: Interval): NoteSpelling {
  const letter = stepLetter(root.letter, value.degree - 1);
  const pitchClass = pitchClassOf(root) + intervalSemitones(value);
  return spellPitchClass(pitchClass, letter);
}
