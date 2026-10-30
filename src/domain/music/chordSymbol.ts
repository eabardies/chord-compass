import type { ChordTypeDefinition } from './chords';
import { isLetter, noteName, parseNote, type NoteSpelling } from './notes';

/**
 * Parsing of typed chord symbols such as "C/B", "F#m7" or "B♭maj7/D". The parser knows
 * nothing about the guitar; it turns text into a root, a chord type id and an optional bass,
 * or into a specific, user-facing reason why it could not.
 */
export interface ParsedChordSymbol {
  readonly root: NoteSpelling;
  readonly typeId: string;
  readonly bass: NoteSpelling | null;
}

export type ChordSymbolErrorKind = 'empty' | 'root' | 'quality' | 'bass';

export interface ChordSymbolError {
  readonly kind: ChordSymbolErrorKind;
  /** The offending part of the input, e.g. the unknown suffix. */
  readonly offending: string;
}

export type ChordSymbolParseResult =
  | { readonly ok: true; readonly value: ParsedChordSymbol }
  | { readonly ok: false; readonly error: ChordSymbolError };

const ASCII_TO_SYMBOL: Record<string, string> = { '#': '♯', b: '♭' };

/**
 * Canonical text form: trimmed, inner spaces removed, root and bass letters uppercase, ASCII
 * accidentals turned into ♯/♭. Suffix case is preserved because "M7" and "m7" differ.
 */
export function normalizeChordSymbol(text: string): string {
  const compact = text.replace(/\s+/g, '');
  if (compact === '') return '';
  return compact
    .split('/')
    .map((part) => normalizeNotePrefix(part))
    .join('/');
}

function normalizeNotePrefix(part: string): string {
  const match = /^([a-gA-G])([#b♯♭]?)(.*)$/.exec(part);
  if (!match) return part;
  const [, letter, accidental, rest] = match;
  return `${letter.toUpperCase()}${ASCII_TO_SYMBOL[accidental] ?? accidental}${rest}`;
}

/** "F♯m7/A": the app's own spelling of a parsed symbol. */
export function formatChordSymbol(
  parsed: ParsedChordSymbol,
  types: readonly ChordTypeDefinition[],
): string {
  const type = types.find((candidate) => candidate.id === parsed.typeId);
  const suffix = type?.symbolSuffix ?? '';
  const slash = parsed.bass ? `/${noteName(parsed.bass)}` : '';
  return `${noteName(parsed.root)}${suffix}${slash}`;
}

export function parseChordSymbol(
  text: string,
  types: readonly ChordTypeDefinition[],
): ChordSymbolParseResult {
  const normalized = normalizeChordSymbol(text);
  if (normalized === '') return failure('empty', '');

  const [head, ...slashParts] = normalized.split('/');
  const rootMatch = /^([A-G])([♯♭]?)(.*)$/.exec(head);
  if (!rootMatch) return failure('root', head);
  const [, letter, accidental, suffix] = rootMatch;
  if (!isLetter(letter)) return failure('root', head);
  const root = parseNote(`${letter}${accidental}`);

  const type = matchSuffix(suffix, types);
  if (!type) return failure('quality', suffix);

  if (slashParts.length > 1) return failure('bass', slashParts.join('/'));
  let bass: NoteSpelling | null = null;
  if (slashParts.length === 1) {
    const bassText = slashParts[0];
    if (!/^[A-G][♯♭]?$/.test(bassText)) return failure('bass', bassText);
    bass = parseNote(bassText);
  }

  return { ok: true, value: { root, typeId: type.id, bass } };
}

/** Exact suffix first ("M7" is a major seventh), then case-insensitive ("MAJ7", "Cm" as "CM"). */
function matchSuffix(
  suffix: string,
  types: readonly ChordTypeDefinition[],
): ChordTypeDefinition | undefined {
  const spellings = (type: ChordTypeDefinition) => [
    type.symbolSuffix,
    ...(type.symbolAliases ?? []),
  ];
  const exact = types.find((type) => spellings(type).includes(suffix));
  if (exact) return exact;
  const lower = suffix.toLowerCase();
  return types.find((type) => spellings(type).some((spelling) => spelling.toLowerCase() === lower));
}

function failure(kind: ChordSymbolErrorKind, offending: string): ChordSymbolParseResult {
  return { ok: false, error: { kind, offending } };
}
