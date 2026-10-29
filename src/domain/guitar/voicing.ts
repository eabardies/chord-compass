import {
  chordToneForPitchClass,
  normalizePitchClass,
  pitchClassOf,
  type Chord,
  type ChordTone,
  type NoteSpelling,
  type PitchClass,
} from '../music';
import {
  fretRange,
  hasOpenString,
  type Barre,
  type Finger,
  type FretValue,
  type ShapeDefinition,
} from './shapes';
import { movableShapeOffset, transposeFrets } from './transpose';
import { STRING_COUNT, type GuitarTuning } from './tuning';

/** What one string contributes to a voiced shape. */
export interface StringNote {
  /** 0 = low E. */
  readonly index: number;
  readonly openNote: NoteSpelling;
  readonly fret: FretValue;
  readonly finger: Finger | null;
  /** Spelled as the chord spells it (A major's C♯, never D♭). Null when muted. */
  readonly tone: ChordTone | null;
}

/**
 * A shape placed at a concrete position for a concrete chord: the data a diagram needs.
 * The definition is the curated source; frets/barres may be transposed copies.
 */
export interface VoicedShape {
  readonly definition: ShapeDefinition;
  readonly chord: Chord;
  readonly frets: readonly FretValue[];
  readonly fingers: readonly (Finger | null)[];
  readonly barres: readonly Barre[];
  /** Semitones the definition was shifted by (0 for fixed shapes). */
  readonly offset: number;
  /** Lowest fretted fret, or 1 for a shape made only of open strings. */
  readonly lowestFret: number;
  /** "Open position", "5th fret barre", ... */
  readonly positionLabel: string;
  readonly strings: readonly StringNote[];
}

export function soundingPitchClass(openNote: NoteSpelling, fret: number): PitchClass {
  return normalizePitchClass(pitchClassOf(openNote) + fret);
}

/** Place a definition on a chord at a given offset. Throws if a sounding note is not a chord tone. */
export function voiceShape(
  definition: ShapeDefinition,
  chord: Chord,
  tuning: GuitarTuning,
  offset: number,
): VoicedShape {
  const { frets, barres } = transposeFrets(definition.frets, definition.barres, offset);
  const strings = frets.map((fret, index): StringNote => {
    const openNote = tuning.strings[index];
    const finger = definition.fingers[index];
    if (fret === null) return { index, openNote, fret, finger, tone: null };
    const tone = chordToneForPitchClass(chord, soundingPitchClass(openNote, fret));
    if (!tone) {
      throw new Error(
        `Shape ${definition.id}: string ${index} at fret ${fret} is not in ${chord.symbol}`,
      );
    }
    return { index, openNote, fret, finger, tone };
  });
  const range = fretRange(frets);
  const lowestFret = range?.min ?? 1;
  return {
    definition,
    chord,
    frets,
    fingers: definition.fingers,
    barres,
    offset,
    lowestFret,
    positionLabel: positionLabel(frets, barres.length > 0, lowestFret),
    strings,
  };
}

function positionLabel(frets: readonly FretValue[], hasBarre: boolean, lowestFret: number): string {
  if (hasOpenString(frets)) return 'Open position';
  return `${ordinal(lowestFret)} fret${hasBarre ? ' barre' : ''}`;
}

export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/**
 * Every shape in the library that can play `chord`: fixed shapes written for this root and
 * type, then movable shapes transposed to it, ordered from the nut upwards.
 */
export function shapesForChord(
  chord: Chord,
  library: readonly ShapeDefinition[],
  tuning: GuitarTuning,
): VoicedShape[] {
  const rootPitchClass = pitchClassOf(chord.root);
  const voiced: VoicedShape[] = [];
  for (const definition of library) {
    if (definition.chordTypeId !== chord.type.id) continue;
    if (definition.kind === 'fixed') {
      if (definition.rootPitchClass === rootPitchClass)
        voiced.push(voiceShape(definition, chord, tuning, 0));
      continue;
    }
    const offset = movableShapeOffset(definition, rootPitchClass);
    if (offset !== null) voiced.push(voiceShape(definition, chord, tuning, offset));
  }
  return voiced.sort(compareShapes);
}

function compareShapes(a: VoicedShape, b: VoicedShape): number {
  const aOpen = hasOpenString(a.frets) ? 0 : 1;
  const bOpen = hasOpenString(b.frets) ? 0 : 1;
  if (aOpen !== bOpen) return aOpen - bOpen;
  return a.lowestFret - b.lowestFret;
}

export function assertStringCount(values: readonly unknown[], what: string, id: string): void {
  if (values.length !== STRING_COUNT) {
    throw new Error(`Shape ${id}: ${what} must list ${STRING_COUNT} strings, got ${values.length}`);
  }
}
