import {
  chordToneLabel,
  INVERSION_TONE_ORDER,
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
 * comfortable one. The result is checked against the chord before it is returned.
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
    return { stringIndex, fret: combination.frets[voice], openNote, tone: inverted.tones[voice] };
  }) as [TriadFretPosition, TriadFretPosition, TriadFretPosition];
  const voicing: TriadVoicing = {
    inverted,
    stringSet,
    positions,
    frets: combination.frets,
    lowestFret: Math.min(...combination.frets),
    highestFret: Math.max(...combination.frets),
    span: combination.span,
    playable: combination.span <= GENERATED_MAX_FRET_SPAN,
  };
  assertVoicingMatchesTriad(voicing);
  return voicing;
}

/**
 * Check a voicing against its chord before anything draws it: every string must sound the
 * tone the inversion assigns to that voice (so the inversion was not swapped for a lower
 * one), the three tones must be the chord's root, third and fifth exactly once each, and
 * the positions must run from the lowest-pitched string of the set to the highest.
 */
export function assertVoicingMatchesTriad(voicing: TriadVoicing): void {
  const { inverted, positions, stringSet } = voicing;
  const expectedRoles = INVERSION_TONE_ORDER[inverted.inversion];
  const label = `${inverted.triad.name} ${inverted.name.toLowerCase()}`;
  positions.forEach((position, voice) => {
    const expectedString = stringSet.stringIndexes[voice];
    if (position.stringIndex !== expectedString) {
      throw new Error(
        `${label}: voice ${voice} is on string ${stringNumber(position.stringIndex)}, expected string ${stringNumber(expectedString)}`,
      );
    }
    if (position.tone.role !== expectedRoles[voice]) {
      throw new Error(
        `${label}: voice ${voice} holds the ${position.tone.role}, expected the ${expectedRoles[voice]}`,
      );
    }
    if (soundingPitchClass(position.openNote, position.fret) !== position.tone.pitchClass) {
      throw new Error(
        `${label}: string ${stringNumber(position.stringIndex)} fret ${position.fret} does not sound ${noteName(position.tone.note)}`,
      );
    }
  });
  const sounding = new Set(positions.map((position) => position.tone.pitchClass));
  const chordTones = inverted.triad.tones.map((tone) => tone.pitchClass);
  if (sounding.size !== chordTones.length || chordTones.some((pc) => !sounding.has(pc))) {
    throw new Error(`${label} does not contain each chord tone exactly once`);
  }
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
 * E (5), string 1 5th fret A (R)."
 */
export function describeTriadVoicing(voicing: TriadVoicing): string {
  const strings = voicing.stringSet.stringIndexes.map(stringNumber).join(', ');
  const parts = voicing.positions.map((position) => {
    const where = position.fret === 0 ? 'open' : `${ordinal(position.fret)} fret`;
    return `string ${stringNumber(position.stringIndex)} ${where} ${noteName(position.tone.note)} (${chordToneLabel(position.tone)})`;
  });
  const stretch = voicing.playable ? '' : ' This shape is a wide stretch.';
  return `${voicing.inverted.triad.name}, ${voicing.inverted.name.toLowerCase()} on strings ${strings}: ${parts.join(', ')}.${stretch}`;
}
