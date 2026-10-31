import {
  noteName,
  parseNote,
  pitchClassOf,
  spokenNoteName,
  type Mode,
  type NoteSpelling,
  type PitchClass,
} from '../domain/music';

export interface RootOption {
  /** Stable id, ASCII only: "Csharp", "Db". */
  readonly id: string;
  readonly note: NoteSpelling;
  /** "C♯" */
  readonly label: string;
  /** "C sharp", for accessible names. */
  readonly spokenName: string;
  readonly pitchClass: PitchClass;
}

function option(text: string): RootOption {
  const spelled = parseNote(text);
  return {
    id: text.replace('#', 'sharp').replace('b', 'flat'),
    note: spelled,
    label: noteName(spelled),
    spokenName: spokenNoteName(spelled),
    pitchClass: pitchClassOf(spelled),
  };
}

/**
 * The one list of root notes every root selector offers, in display order: all 12 pitch
 * classes, with both conventional spellings for the five black keys (C♯ and D♭ are both
 * common chord names) and without spellings nobody uses as a root (E♯, F♭, B♯, C♭).
 */
export const ROOT_NOTE_IDS = [
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
] as const;

export type RootNoteId = (typeof ROOT_NOTE_IDS)[number];

export const CHORD_ROOTS: readonly RootOption[] = ROOT_NOTE_IDS.map(option);

function subset(ids: readonly RootNoteId[]): readonly RootOption[] {
  const wanted = new Set<string>(ids.map((id) => option(id).id));
  return CHORD_ROOTS.filter((root) => wanted.has(root.id));
}

/**
 * Key tonics for progressions: the subset of `CHORD_ROOTS` whose keys have at most seven
 * sharps or flats, so every scale note stays a single sharp or flat. F♯/G♭ major and
 * D♯/E♭ minor are offered both ways. "Chords in a key" offers every root instead and spells
 * the uncommon keys (D♯ major) with double sharps.
 */
export const KEY_TONICS: Record<Mode, readonly RootOption[]> = {
  major: subset(['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']),
  minor: subset(['C', 'C#', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']),
};

export function rootOptionById(options: readonly RootOption[], id: string): RootOption | undefined {
  return options.find((candidate) => candidate.id === id);
}

/** The option in `options` sounding the same as `note`, preferring an identical spelling. */
export function closestRootOption(options: readonly RootOption[], note: NoteSpelling): RootOption {
  const exact = options.find((candidate) => noteName(candidate.note) === noteName(note));
  const enharmonic = options.find((candidate) => candidate.pitchClass === pitchClassOf(note));
  const match = exact ?? enharmonic;
  if (!match) throw new Error(`No root option for ${noteName(note)}`);
  return match;
}
