import { interval, intervalLabel, transposeNote, type Interval } from './intervals';
import {
  noteName,
  normalizePitchClass,
  notesEqual,
  pitchClassOf,
  type NoteSpelling,
} from './notes';

/**
 * Scales are written as formulas relative to the major scale of the tonic, so every scale
 * note is spelled by degree (one letter each) and never from a chromatic table: C melodic
 * minor is C D E♭ F G A B, G♭ major has a C♭, D♯ harmonic minor has a C𝄪.
 */
export type ScaleType = 'major' | 'natural-minor' | 'harmonic-minor' | 'melodic-minor';

export const SCALE_TYPES: readonly ScaleType[] = [
  'major',
  'natural-minor',
  'harmonic-minor',
  'melodic-minor',
];

export const SCALE_TYPE_LABELS: Record<ScaleType, string> = {
  major: 'Major',
  'natural-minor': 'Natural minor',
  'harmonic-minor': 'Harmonic minor',
  'melodic-minor': 'Melodic minor',
};

function formula(text: string): readonly Interval[] {
  return text.split(' ').map((token) => {
    const alteration = token.startsWith('♭') ? -1 : token.startsWith('♯') ? 1 : 0;
    return interval(Number(token.replace(/[♭♯]/, '')), alteration);
  });
}

export const SCALE_FORMULAS: Record<ScaleType, readonly Interval[]> = {
  major: formula('1 2 3 4 5 6 7'),
  'natural-minor': formula('1 2 ♭3 4 5 ♭6 ♭7'),
  'harmonic-minor': formula('1 2 ♭3 4 5 ♭6 7'),
  // Ascending form; the descending form is the natural minor.
  'melodic-minor': formula('1 2 ♭3 4 5 6 7'),
};

export interface Scale {
  readonly tonic: NoteSpelling;
  readonly type: ScaleType;
}

/** "C harmonic minor" */
export function scaleName(scale: Scale): string {
  return `${noteName(scale.tonic)} ${SCALE_TYPE_LABELS[scale.type].toLowerCase()}`;
}

/** ["1", "2", "♭3", ...] */
export function scaleDegreeLabels(type: ScaleType): string[] {
  return SCALE_FORMULAS[type].map(intervalLabel);
}

/** The seven scale notes, each letter used exactly once. */
export function scaleNotesOf(scale: Scale): NoteSpelling[] {
  return SCALE_FORMULAS[scale.type].map((value) => transposeNote(scale.tonic, value));
}

/** Whether a scale type is one of the minors; decides which tonic spellings are offered. */
export function isMinorScale(type: ScaleType): boolean {
  return type !== 'major';
}

export type Mode = 'major' | 'minor';

/** A key as progressions use it: "minor" means natural minor throughout the app. */
export interface Key {
  readonly tonic: NoteSpelling;
  readonly mode: Mode;
}

export const MODE_LABELS: Record<Mode, string> = { major: 'Major', minor: 'Natural minor' };

export function modeScaleType(mode: Mode): ScaleType {
  return mode === 'major' ? 'major' : 'natural-minor';
}

export function keyName(key: Key): string {
  return `${noteName(key.tonic)} ${key.mode}`;
}

export function scaleNotes(key: Key): NoteSpelling[] {
  return scaleNotesOf({ tonic: key.tonic, type: modeScaleType(key.mode) });
}

export type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented';

export interface DiatonicTriad {
  /** Scale degree 1..7. */
  readonly degree: number;
  /** Roman numeral: uppercase for major, lowercase for minor, ° for diminished, + for augmented. */
  readonly numeral: string;
  readonly quality: TriadQuality;
  readonly root: NoteSpelling;
  readonly third: NoteSpelling;
  readonly fifth: NoteSpelling;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

/**
 * Stack thirds on every scale degree and classify the resulting triad. The quality is read
 * from the sounding intervals (3 or 4 semitones to the third, 6/7/8 to the fifth), so the
 * same code harmonizes any scale type without a lookup table of qualities.
 */
export function harmonizeScale(scale: Scale): DiatonicTriad[] {
  const notes = scaleNotesOf(scale);
  return notes.map((root, index) => {
    const third = notes[(index + 2) % notes.length];
    const fifth = notes[(index + 4) % notes.length];
    const quality = classifyTriad(root, third, fifth);
    return {
      degree: index + 1,
      numeral: romanNumeral(index + 1, quality),
      quality,
      root,
      third,
      fifth,
    };
  });
}

export function harmonizeKey(key: Key): DiatonicTriad[] {
  return harmonizeScale({ tonic: key.tonic, type: modeScaleType(key.mode) });
}

/**
 * Classify three spelled notes as a triad by their sounding intervals above the root. Shared
 * by harmonization and by `buildTriad`, so a formula and a harmonized degree agree.
 */
export function classifyTriad(
  root: NoteSpelling,
  third: NoteSpelling,
  fifth: NoteSpelling,
): TriadQuality {
  const rootPc = pitchClassOf(root);
  const thirdSemitones = normalizePitchClass(pitchClassOf(third) - rootPc);
  const fifthSemitones = normalizePitchClass(pitchClassOf(fifth) - rootPc);
  if (thirdSemitones === 4 && fifthSemitones === 7) return 'major';
  if (thirdSemitones === 3 && fifthSemitones === 7) return 'minor';
  if (thirdSemitones === 3 && fifthSemitones === 6) return 'diminished';
  if (thirdSemitones === 4 && fifthSemitones === 8) return 'augmented';
  throw new Error(
    `Unsupported triad ${noteName(root)} ${noteName(third)} ${noteName(fifth)} in ${keyName({
      tonic: root,
      mode: 'major',
    })}`,
  );
}

export function romanNumeral(degree: number, quality: TriadQuality): string {
  const base = ROMAN[degree - 1];
  switch (quality) {
    case 'major':
      return base;
    case 'augmented':
      return `${base}+`;
    case 'minor':
      return base.toLowerCase();
    case 'diminished':
      return `${base.toLowerCase()}°`;
  }
}

/** Total sharps and flats in the scale, double accidentals counting twice. */
export function scaleAccidentalCount(scale: Scale): number {
  return scaleNotesOf(scale).reduce((sum, note) => sum + Math.abs(note.accidental), 0);
}

export function scaleHasDoubleAccidentals(scale: Scale): boolean {
  return scaleNotesOf(scale).some((note) => Math.abs(note.accidental) === 2);
}

/**
 * Among `candidates`, the tonic that sounds the same as the scale's tonic but spells the
 * scale with fewer accidentals, or null when the chosen spelling is already the simplest.
 * Used only to mention the common alternative (D♯ major → E♭ major); the user's choice is
 * never changed.
 */
export function simplerEnharmonicTonic(
  scale: Scale,
  candidates: readonly NoteSpelling[],
): NoteSpelling | null {
  const own = scaleAccidentalCount(scale);
  const alternatives = candidates
    .filter(
      (note) => pitchClassOf(note) === pitchClassOf(scale.tonic) && !notesEqual(note, scale.tonic),
    )
    .map((tonic) => ({ tonic, count: scaleAccidentalCount({ tonic, type: scale.type }) }))
    .filter((candidate) => candidate.count < own)
    .sort((a, b) => a.count - b.count);
  return alternatives[0]?.tonic ?? null;
}
