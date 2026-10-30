import {
  intervalLabel,
  invertTriad,
  noteName,
  TRIAD_INVERSIONS,
  type InvertedTriad,
  type NoteSpelling,
  type Triad,
  type TriadInversion,
  type TriadTone,
} from '../music';
import {
  fretsSounding,
  GENERATED_MAX_FRET,
  GENERATED_MAX_FRET_SPAN,
  mostCompactCombination,
  type FretPosition,
} from './fretPositioning';
import type { StringSet } from './stringSets';
import { stringNumber, type GuitarTuning } from './tuning';
import { ordinal, soundingPitchClass } from './voicing';

/**
 * A triad inversion placed on three adjacent strings. Unlike curated `ShapeDefinition`s these
 * are derived: each string is assigned the chord tone the inversion puts in that voice, and
 * the fret is the most compact occurrence on the neck (see `mostCompactCombination`).
 */
export interface TriadFretPosition extends FretPosition {
  readonly openNote: NoteSpelling;
  readonly tone: TriadTone;
}

export interface TriadVoicing {
  readonly inverted: InvertedTriad;
  readonly stringSet: StringSet;
  /** One position per string of the set, from the lowest-pitched string to the highest. */
  readonly positions: readonly [TriadFretPosition, TriadFretPosition, TriadFretPosition];
  /** Frets low to high, e.g. [2, 2, 0]. */
  readonly frets: readonly number[];
  readonly lowestFret: number;
  readonly highestFret: number;
  /** Distance between the lowest and highest fret, open strings counting as 0. */
  readonly span: number;
  /** False when even the most compact occurrence exceeds `GENERATED_MAX_FRET_SPAN`. */
  readonly playable: boolean;
}

/**
 * Place one inversion of a triad on a string set. Every pitch class occurs on every string
 * within 0..GENERATED_MAX_FRET, so a voicing always exists; `playable` says whether it is a
 * comfortable one.
 */
export function voiceTriadInversion(
  triad: Triad,
  inversion: TriadInversion,
  stringSet: StringSet,
  tuning: GuitarTuning,
  maxFret: number = GENERATED_MAX_FRET,
): TriadVoicing {
  const inverted = invertTriad(triad, inversion);
  const candidates = stringSet.stringIndexes.map((stringIndex, voice) =>
    fretsSounding(tuning.strings[stringIndex], inverted.tones[voice].pitchClass, maxFret),
  );
  const combination = mostCompactCombination(candidates);
  if (!combination) {
    throw new Error(`No frets within 0–${maxFret} for ${inverted.name} of ${triad.name}`);
  }
  const positions = stringSet.stringIndexes.map((stringIndex, voice): TriadFretPosition => {
    const openNote = tuning.strings[stringIndex];
    const fret = combination.frets[voice];
    const tone = inverted.tones[voice];
    if (soundingPitchClass(openNote, fret) !== tone.pitchClass) {
      throw new Error(`String ${stringIndex} fret ${fret} does not sound ${noteName(tone.note)}`);
    }
    return { stringIndex, fret, openNote, tone };
  }) as [TriadFretPosition, TriadFretPosition, TriadFretPosition];
  return {
    inverted,
    stringSet,
    positions,
    frets: combination.frets,
    lowestFret: Math.min(...combination.frets),
    highestFret: Math.max(...combination.frets),
    span: combination.span,
    playable: combination.span <= GENERATED_MAX_FRET_SPAN,
  };
}

/** Root position, first and second inversion of a triad on one string set. */
export function triadVoicings(
  triad: Triad,
  stringSet: StringSet,
  tuning: GuitarTuning,
): TriadVoicing[] {
  return TRIAD_INVERSIONS.map((inversion) =>
    voiceTriadInversion(triad, inversion, stringSet, tuning),
  );
}

/**
 * Plain-language description for screen readers:
 * "A major, first inversion on strings 3, 2, 1: string 3 6th fret C♯ (3), string 2 5th fret
 * E (5), string 1 5th fret A (1)."
 */
export function describeTriadVoicing(voicing: TriadVoicing): string {
  const strings = voicing.stringSet.stringIndexes.map(stringNumber).join(', ');
  const parts = voicing.positions.map((position) => {
    const where = position.fret === 0 ? 'open' : `${ordinal(position.fret)} fret`;
    return `string ${stringNumber(position.stringIndex)} ${where} ${noteName(position.tone.note)} (${intervalLabel(position.tone.interval)})`;
  });
  const stretch = voicing.playable ? '' : ' This shape is a wide stretch.';
  return `${voicing.inverted.triad.name}, ${voicing.inverted.name.toLowerCase()} on strings ${strings}: ${parts.join(', ')}.${stretch}`;
}
