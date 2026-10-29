import { intervalsEqual, transposeNote, type Interval } from './intervals';
import { noteName, pitchClassOf, type NoteSpelling, type PitchClass } from './notes';

/**
 * A chord *type* (major, minor seventh, ...) is a formula: intervals relative to the root.
 * A `Chord` is that formula applied to a specific root, with every tone spelled out.
 * Shapes and voicings are a guitar concern and live in `domain/guitar`.
 */
export interface ChordTypeDefinition {
  /** Stable identifier used by shape data and progression templates, never shown to users. */
  readonly id: string;
  /** Full name, e.g. "Dominant seventh". */
  readonly name: string;
  /** Suffix appended to the root to form the symbol, e.g. "m7". */
  readonly symbolSuffix: string;
  /** Intervals from the root, ascending, starting with the root itself. */
  readonly formula: readonly Interval[];
}

export interface ChordTone {
  readonly interval: Interval;
  readonly note: NoteSpelling;
  readonly pitchClass: PitchClass;
}

export interface Chord {
  readonly root: NoteSpelling;
  readonly type: ChordTypeDefinition;
  /** Short symbol, e.g. "F♯m7". */
  readonly symbol: string;
  /** Spoken name, e.g. "F♯ minor seventh". */
  readonly name: string;
  readonly tones: readonly ChordTone[];
}

export function buildChord(root: NoteSpelling, type: ChordTypeDefinition): Chord {
  const tones = type.formula.map((value) => {
    const note = transposeNote(root, value);
    return { interval: value, note, pitchClass: pitchClassOf(note) };
  });
  return {
    root,
    type,
    symbol: `${noteName(root)}${type.symbolSuffix}`,
    name: `${noteName(root)} ${type.name.toLowerCase()}`,
    tones,
  };
}

export function chordPitchClasses(chord: Chord): PitchClass[] {
  return chord.tones.map((tone) => tone.pitchClass);
}

/** The chord tone sounding as `pitchClass`, if the chord contains it. */
export function chordToneForPitchClass(
  chord: Chord,
  pitchClass: PitchClass,
): ChordTone | undefined {
  return chord.tones.find((tone) => tone.pitchClass === pitchClass);
}

export function chordToneForInterval(chord: Chord, value: Interval): ChordTone | undefined {
  return chord.tones.find((tone) => intervalsEqual(tone.interval, value));
}
