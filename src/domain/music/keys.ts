import { interval, transposeNote, type Interval } from './intervals';
import { noteName, normalizePitchClass, pitchClassOf, type NoteSpelling } from './notes';

export type Mode = 'major' | 'minor';

export interface Key {
  readonly tonic: NoteSpelling;
  /** "minor" means natural minor throughout the app. */
  readonly mode: Mode;
}

/** Scale degrees of each mode, written relative to the major scale of the tonic. */
const MODE_FORMULAS: Record<Mode, readonly Interval[]> = {
  major: [1, 2, 3, 4, 5, 6, 7].map((degree) => interval(degree)),
  minor: [
    interval(1),
    interval(2),
    interval(3, -1),
    interval(4),
    interval(5),
    interval(6, -1),
    interval(7, -1),
  ],
};

export const MODE_LABELS: Record<Mode, string> = { major: 'Major', minor: 'Natural minor' };

export function keyName(key: Key): string {
  return `${noteName(key.tonic)} ${key.mode}`;
}

/** The seven scale notes, each letter used exactly once. */
export function scaleNotes(key: Key): NoteSpelling[] {
  return MODE_FORMULAS[key.mode].map((value) => transposeNote(key.tonic, value));
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
 * same code harmonizes any mode without a lookup table of qualities.
 */
export function harmonizeKey(key: Key): DiatonicTriad[] {
  const scale = scaleNotes(key);
  return scale.map((root, index) => {
    const third = scale[(index + 2) % scale.length];
    const fifth = scale[(index + 4) % scale.length];
    const quality = triadQuality(root, third, fifth);
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

function triadQuality(root: NoteSpelling, third: NoteSpelling, fifth: NoteSpelling): TriadQuality {
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
