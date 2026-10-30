import {
  chordToneForPitchClass,
  pitchClassOf,
  scaleNotes,
  type Chord,
  type Interval,
  type NoteSpelling,
  type PitchClass,
} from '../music';
import { stringNumber, type GuitarTuning } from './tuning';
import { soundingPitchClass } from './voicing';

/**
 * Every position on the neck classified against the chord root's major scale and the chord
 * itself. The major scale is the reference the chord formulas are written against, so a
 * position is either a scale tone (with its 1–7 degree and scale spelling), an altered chord
 * tone outside the scale (♭3, ♭7, ♯5, spelled as the chord spells it), or neither.
 */
export interface FretboardPosition {
  /** 0 = low E. */
  readonly stringIndex: number;
  /** Guitar numbering, 6 = low E. */
  readonly stringNumber: number;
  readonly fret: number;
  readonly pitchClass: PitchClass;
  /**
   * Spelled from the scale degree for scale tones, from the chord formula for altered chord
   * tones; null for positions that are neither, which have no canonical spelling.
   */
  readonly note: NoteSpelling | null;
  /** 1..7 within the root's major scale, or null outside it. */
  readonly scaleDegree: number | null;
  /** The chord-formula interval when the position is a chord tone, e.g. ♭3. */
  readonly chordDegree: Interval | null;
  readonly isScaleTone: boolean;
  readonly isChordTone: boolean;
  readonly isRoot: boolean;
  /** A chord tone that is not in the major scale (Am's C, A7's G, Aaug's E♯). */
  readonly isAlteredChordTone: boolean;
}

export const FRETBOARD_MAX_FRET = 12;

/** Pitch class and spelling of a string at a fret, for the open-string note given. */
export function frettedPitchClass(openNote: NoteSpelling, fret: number): PitchClass {
  if (!Number.isInteger(fret) || fret < 0) throw new Error(`Invalid fret ${fret}`);
  return soundingPitchClass(openNote, fret);
}

/**
 * Classify every string and fret from 0 to `maxFret`. Positions are ordered low string to
 * high string, then by fret. Fret 12 repeats fret 0 one octave up, so both carry the same
 * degree and spelling.
 */
export function buildFretboardMap(
  chord: Chord,
  tuning: GuitarTuning,
  maxFret: number = FRETBOARD_MAX_FRET,
): FretboardPosition[] {
  const scale = scaleNotes({ tonic: chord.root, mode: 'major' });
  const scaleByPitchClass = new Map(
    scale.map((note, index) => [pitchClassOf(note), { note, degree: index + 1 }]),
  );
  const rootPitchClass = pitchClassOf(chord.root);
  const positions: FretboardPosition[] = [];
  tuning.strings.forEach((openNote, stringIndex) => {
    for (let fret = 0; fret <= maxFret; fret += 1) {
      const pitchClass = frettedPitchClass(openNote, fret);
      const scaleTone = scaleByPitchClass.get(pitchClass) ?? null;
      const chordTone = chordToneForPitchClass(chord, pitchClass) ?? null;
      positions.push({
        stringIndex,
        stringNumber: stringNumber(stringIndex),
        fret,
        pitchClass,
        note: scaleTone?.note ?? chordTone?.note ?? null,
        scaleDegree: scaleTone?.degree ?? null,
        chordDegree: chordTone?.interval ?? null,
        isScaleTone: scaleTone !== null,
        isChordTone: chordTone !== null,
        isRoot: pitchClass === rootPitchClass,
        isAlteredChordTone: chordTone !== null && scaleTone === null,
      });
    }
  });
  return positions;
}
