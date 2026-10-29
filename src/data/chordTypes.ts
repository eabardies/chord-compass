import { parseInterval, type ChordTypeDefinition, type TriadQuality } from '../domain/music';

export const CHORD_TYPE_IDS = [
  'major',
  'minor',
  'dominant7',
  'major7',
  'minor7',
  'sus2',
  'sus4',
  'diminished',
  'augmented',
] as const;

export type ChordTypeId = (typeof CHORD_TYPE_IDS)[number];

function define(
  id: ChordTypeId,
  name: string,
  symbolSuffix: string,
  formula: string,
): ChordTypeDefinition {
  return { id, name, symbolSuffix, formula: formula.split(' ').map(parseInterval) };
}

/** The chord types offered in the explorer, in display order. Formulas are relative to the root's major scale. */
export const CHORD_TYPES: readonly ChordTypeDefinition[] = [
  define('major', 'Major', '', '1 3 5'),
  define('minor', 'Minor', 'm', '1 ♭3 5'),
  define('dominant7', 'Dominant seventh', '7', '1 3 5 ♭7'),
  define('major7', 'Major seventh', 'maj7', '1 3 5 7'),
  define('minor7', 'Minor seventh', 'm7', '1 ♭3 5 ♭7'),
  define('sus2', 'Suspended second', 'sus2', '1 2 5'),
  define('sus4', 'Suspended fourth', 'sus4', '1 4 5'),
  define('diminished', 'Diminished', 'dim', '1 ♭3 ♭5'),
  define('augmented', 'Augmented', 'aug', '1 3 ♯5'),
];

const BY_ID = new Map(CHORD_TYPES.map((type) => [type.id, type]));

export function chordTypeById(id: string): ChordTypeDefinition {
  const type = BY_ID.get(id);
  if (!type) throw new Error(`Unknown chord type "${id}"`);
  return type;
}

/** Which chord type a diatonic triad maps to when a progression is harmonized. */
export const TRIAD_CHORD_TYPES: Record<TriadQuality, ChordTypeId> = {
  major: 'major',
  minor: 'minor',
  diminished: 'diminished',
  augmented: 'augmented',
};

export function chordTypeForTriad(quality: TriadQuality): ChordTypeDefinition {
  return chordTypeById(TRIAD_CHORD_TYPES[quality]);
}
