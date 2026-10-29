/**
 * Notes are modelled in two separate ways:
 *
 * - A `PitchClass` is a number 0..11 (C = 0) describing what you hear. C♯ and D♭ share
 *   pitch class 1.
 * - A `NoteSpelling` is how a note is written: a letter plus an accidental. C♯ and D♭
 *   are different spellings. Chord spelling rules depend on letters, so chord construction
 *   works with spellings and only falls back to pitch classes for comparisons.
 */

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Letter = (typeof LETTERS)[number];

/** Integer 0..11, where 0 = C. */
export type PitchClass = number;

export const SEMITONES_PER_OCTAVE = 12;

/** Accidental as a signed semitone offset: -2 = 𝄫, -1 = ♭, 0 = natural, 1 = ♯, 2 = 𝄪. */
export type Accidental = -2 | -1 | 0 | 1 | 2;

export interface NoteSpelling {
  readonly letter: Letter;
  readonly accidental: Accidental;
}

/** Semitone distance of each natural letter above C. */
const LETTER_SEMITONES: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const ACCIDENTAL_SYMBOLS: Record<Accidental, string> = {
  [-2]: '𝄫',
  [-1]: '♭',
  [0]: '',
  [1]: '♯',
  [2]: '𝄪',
};

export function normalizePitchClass(value: number): PitchClass {
  return ((value % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE;
}

export function pitchClassOf(note: NoteSpelling): PitchClass {
  return normalizePitchClass(LETTER_SEMITONES[note.letter] + note.accidental);
}

export function letterIndex(letter: Letter): number {
  return LETTERS.indexOf(letter);
}

/** Letter `steps` letters above `letter`, wrapping around (B + 1 = C). */
export function stepLetter(letter: Letter, steps: number): Letter {
  const index =
    (((letterIndex(letter) + steps) % LETTERS.length) + LETTERS.length) % LETTERS.length;
  return LETTERS[index];
}

/**
 * Spell a pitch class using a required letter. Picks the smallest accidental that makes the
 * letter sound as the pitch class, e.g. pitch class 5 with letter E is E♯.
 * Throws if that needs more than a double sharp or double flat.
 */
export function spellPitchClass(pitchClass: PitchClass, letter: Letter): NoteSpelling {
  let offset = normalizePitchClass(pitchClass) - LETTER_SEMITONES[letter];
  if (offset > SEMITONES_PER_OCTAVE / 2) offset -= SEMITONES_PER_OCTAVE;
  if (offset < -SEMITONES_PER_OCTAVE / 2) offset += SEMITONES_PER_OCTAVE;
  if (!isAccidental(offset)) {
    throw new Error(`Cannot spell pitch class ${pitchClass} with letter ${letter}`);
  }
  return { letter, accidental: offset };
}

function isAccidental(value: number): value is Accidental {
  return Number.isInteger(value) && value >= -2 && value <= 2;
}

export function note(letter: Letter, accidental: Accidental = 0): NoteSpelling {
  return { letter, accidental };
}

export function noteName(spelling: NoteSpelling): string {
  return `${spelling.letter}${ACCIDENTAL_SYMBOLS[spelling.accidental]}`;
}

export function notesEqual(a: NoteSpelling, b: NoteSpelling): boolean {
  return a.letter === b.letter && a.accidental === b.accidental;
}

const ACCIDENTAL_TOKENS: Record<string, Accidental> = {
  '': 0,
  '#': 1,
  '♯': 1,
  '##': 2,
  x: 2,
  '𝄪': 2,
  b: -1,
  '♭': -1,
  bb: -2,
  '𝄫': -2,
};

/** Parse "C#", "Db", "E♭", "F##" or "Bbb" into a spelling. */
export function parseNote(text: string): NoteSpelling {
  const trimmed = text.trim();
  const letter = trimmed.charAt(0).toUpperCase();
  const accidentalToken = trimmed.slice(1);
  if (!isLetter(letter) || !(accidentalToken in ACCIDENTAL_TOKENS)) {
    throw new Error(`Cannot parse note "${text}"`);
  }
  return { letter, accidental: ACCIDENTAL_TOKENS[accidentalToken] };
}

export function isLetter(value: string): value is Letter {
  return (LETTERS as readonly string[]).includes(value);
}
