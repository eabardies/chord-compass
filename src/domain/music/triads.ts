import { buildChord, type Chord, type ChordTone, type ChordTypeDefinition } from './chords';
import { intervalLabel } from './intervals';
import { classifyTriad, type TriadQuality } from './keys';
import { noteName, spokenNoteName, type NoteSpelling } from './notes';

/**
 * A triad is a three-note chord built from a root, a third and a fifth. The quality (major,
 * minor, diminished, augmented) is a chord type whose formula has exactly those degrees, so
 * the same spelling rules as the chord explorer apply: tones are spelled by degree, never by
 * a chromatic sharp table. A♭ minor's third is C♭, not B.
 */
export type TriadToneRole = 'root' | 'third' | 'fifth';

export const TRIAD_TONE_ROLES: readonly TriadToneRole[] = ['root', 'third', 'fifth'];

export interface TriadTone extends ChordTone {
  readonly role: TriadToneRole;
}

export interface Triad {
  readonly root: NoteSpelling;
  readonly quality: TriadQuality;
  /** The chord type the triad was built from, e.g. the "minor" chord type. */
  readonly chord: Chord;
  /** "A minor" */
  readonly name: string;
  /** "Am" */
  readonly symbol: string;
  /** "1–♭3–5" */
  readonly formula: string;
  /** Root, third, fifth. */
  readonly tones: readonly [TriadTone, TriadTone, TriadTone];
}

const TRIAD_DEGREES = [1, 3, 5] as const;

/** Whether a chord type is a triad: three tones on degrees 1, 3 and 5 (with any alteration). */
export function isTriadType(type: ChordTypeDefinition): boolean {
  return (
    type.formula.length === TRIAD_DEGREES.length &&
    type.formula.every((value, index) => value.degree === TRIAD_DEGREES[index])
  );
}

/** Spell a triad on `root` from a triad chord type. Throws for non-triad types (sevenths, sus). */
export function buildTriad(root: NoteSpelling, type: ChordTypeDefinition): Triad {
  if (!isTriadType(type)) {
    throw new Error(`Chord type "${type.id}" is not a triad (expected degrees 1, 3, 5)`);
  }
  const chord = buildChord(root, type);
  const [first, third, fifth] = chord.tones;
  const tones: [TriadTone, TriadTone, TriadTone] = [
    { ...first, role: 'root' },
    { ...third, role: 'third' },
    { ...fifth, role: 'fifth' },
  ];
  return {
    root,
    quality: classifyTriad(first.note, third.note, fifth.note),
    chord,
    name: chord.name,
    symbol: chord.symbol,
    formula: triadDegreeLabels(tones).join('–'),
    tones,
  };
}

export function triadTone(triad: Triad, role: TriadToneRole): TriadTone {
  const tone = triad.tones.find((candidate) => candidate.role === role);
  if (!tone) throw new Error(`Triad ${triad.name} has no ${role}`);
  return tone;
}

/** ["1", "♭3", "5"] for the given tones, in the order given. */
export function triadDegreeLabels(tones: readonly TriadTone[]): string[] {
  return tones.map((tone) => intervalLabel(tone.interval));
}

/** ["A", "C", "E"] for the given tones, in the order given. */
export function triadNoteNames(tones: readonly TriadTone[]): string[] {
  return tones.map((tone) => noteName(tone.note));
}

/**
 * The label guitarists put on a chord tone: "R" for the root, otherwise the degree ("3",
 * "♭3", "5", "♭5", "♯5"). Formulas keep "1" because they count scale degrees; markers and
 * tone orders use "R" so the root reads at a glance.
 */
export function chordToneLabel(tone: TriadTone): string {
  return tone.role === 'root' ? 'R' : intervalLabel(tone.interval);
}

/** ["R", "♭3", "5"] for the given tones, in the order given. */
export function chordToneLabels(tones: readonly TriadTone[]): string[] {
  return tones.map(chordToneLabel);
}

/** "C sharp major": the triad name with its accidental said rather than drawn. */
export function spokenTriadName(triad: Triad): string {
  return triad.name.replace(noteName(triad.root), spokenNoteName(triad.root));
}
