import {
  noteName,
  parseNote,
  pitchClassOf,
  type Mode,
  type NoteSpelling,
  type PitchClass,
} from '../domain/music';

export interface RootOption {
  /** Stable id, ASCII only: "Csharp", "Db". */
  readonly id: string;
  readonly note: NoteSpelling;
  readonly label: string;
  readonly pitchClass: PitchClass;
}

function option(text: string): RootOption {
  const spelled = parseNote(text);
  return {
    id: text.replace('#', 'sharp').replace('b', 'flat'),
    note: spelled,
    label: noteName(spelled),
    pitchClass: pitchClassOf(spelled),
  };
}

/**
 * Chord roots: all 12 pitch classes, offering both conventional spellings for the five
 * black keys (C♯ and D♭ are both common chord names) and omitting spellings nobody
 * uses as a chord root (E♯, F♭, B♯, C♭).
 */
export const CHORD_ROOTS: readonly RootOption[] = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
].map(option);

/**
 * Key tonics are limited to keys with at most seven sharps or flats, so every scale note
 * stays a single sharp or flat. F♯/G♭ major and D♯/E♭ minor are offered both ways.
 */
export const KEY_TONICS: Record<Mode, readonly RootOption[]> = {
  major: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'].map(option),
  minor: ['C', 'C#', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'].map(option),
};

export function rootOptionById(options: readonly RootOption[], id: string): RootOption | undefined {
  return options.find((candidate) => candidate.id === id);
}

/** The option in `options` sounding the same as `pitchClass`, preferring an identical spelling. */
export function closestRootOption(options: readonly RootOption[], note: NoteSpelling): RootOption {
  const exact = options.find((candidate) => noteName(candidate.note) === noteName(note));
  const enharmonic = options.find((candidate) => candidate.pitchClass === pitchClassOf(note));
  const match = exact ?? enharmonic;
  if (!match) throw new Error(`No root option for ${noteName(note)}`);
  return match;
}
