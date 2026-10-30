import { intervalBetween, intervalsEqual, transposeNote, type Interval } from './intervals';
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
  /** Other suffix spellings accepted when parsing a typed symbol, e.g. "min7", "-7". */
  readonly symbolAliases?: readonly string[];
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
  /** Short symbol, e.g. "F♯m7" or "C/B". */
  readonly symbol: string;
  /** Spoken name, e.g. "F♯ minor seventh" or "C major over B". */
  readonly name: string;
  /** The formula tones; a slash bass is not among them unless it is also a chord tone. */
  readonly tones: readonly ChordTone[];
  /**
   * The requested lowest note of a slash chord (C/B), or null. It may double a chord tone
   * (C/E) or add a note outside the formula (C/B); either way it must sound lowest.
   */
  readonly bass: ChordTone | null;
}

export function buildChord(
  root: NoteSpelling,
  type: ChordTypeDefinition,
  bass: NoteSpelling | null = null,
): Chord {
  const tones = type.formula.map((value) => {
    const note = transposeNote(root, value);
    return { interval: value, note, pitchClass: pitchClassOf(note) };
  });
  const bassTone: ChordTone | null = bass
    ? { interval: intervalBetween(root, bass), note: bass, pitchClass: pitchClassOf(bass) }
    : null;
  const slash = bassTone ? `/${noteName(bassTone.note)}` : '';
  const over = bassTone ? ` over ${noteName(bassTone.note)}` : '';
  return {
    root,
    type,
    symbol: `${noteName(root)}${type.symbolSuffix}${slash}`,
    name: `${noteName(root)} ${type.name.toLowerCase()}${over}`,
    tones,
    bass: bassTone,
  };
}

export function isSlashChord(chord: Chord): boolean {
  return chord.bass !== null;
}

export function chordPitchClasses(chord: Chord): PitchClass[] {
  return chord.tones.map((tone) => tone.pitchClass);
}

/** The chord tone (or slash bass) sounding as `pitchClass`, if the chord contains it. */
export function chordToneForPitchClass(
  chord: Chord,
  pitchClass: PitchClass,
): ChordTone | undefined {
  const tone = chord.tones.find((candidate) => candidate.pitchClass === pitchClass);
  if (tone) return tone;
  return chord.bass?.pitchClass === pitchClass ? chord.bass : undefined;
}

export function chordToneForInterval(chord: Chord, value: Interval): ChordTone | undefined {
  return chord.tones.find((tone) => intervalsEqual(tone.interval, value));
}
