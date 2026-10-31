import { noteName } from '../music';
import { STRING_COUNT, stringNumber, type GuitarTuning } from './tuning';

/**
 * A group of three adjacent strings used to play a triad. Indexes follow the app convention
 * (0 = low E, ascending in pitch); the id and name use guitar string numbers (1 = high E).
 */
export type StringSetId = `strings-${number}-${number}-${number}`;

export interface StringSet {
  readonly id: StringSetId;
  /** "Strings 1–2–3" */
  readonly name: string;
  /** Guitar string numbers as guitarists say them, high string first: "1–2–3". */
  readonly numbers: string;
  /** "Treble" for the top set, "Bass" for the bottom one, undefined in between. */
  readonly descriptor?: string | undefined;
  /** String indexes from the lowest-pitched string to the highest, e.g. [3, 4, 5] for G B e. */
  readonly stringIndexes: readonly [number, number, number];
}

function adjacentStrings(highest: number, descriptor?: string): StringSet {
  const indexes = [highest + 2, highest + 1, highest].map((number) => STRING_COUNT - number);
  const [low, middle, high] = indexes;
  const numbers = `${highest}–${highest + 1}–${highest + 2}`;
  return {
    id: `strings-${highest}-${highest + 1}-${highest + 2}`,
    name: `Strings ${numbers}`,
    numbers,
    descriptor,
    stringIndexes: [low, middle, high],
  };
}

/** The four adjacent string groups a triad fits on, from the treble strings down. */
export const TRIAD_STRING_SETS: readonly StringSet[] = [
  adjacentStrings(1, 'Treble'),
  adjacentStrings(2),
  adjacentStrings(3),
  adjacentStrings(4, 'Bass'),
];

export function stringSetById(id: string): StringSet | undefined {
  return TRIAD_STRING_SETS.find((candidate) => candidate.id === id);
}

/** Whether a string (0 = low E) belongs to the set. */
export function stringInSet(set: StringSet, stringIndex: number): boolean {
  return set.stringIndexes.includes(stringIndex);
}

/** Open-string name for a diagram label: the high E in lowercase, as the chord diagrams do. */
export function openStringName(stringIndex: number, tuning: GuitarTuning): string {
  const name = noteName(tuning.strings[stringIndex]);
  return stringIndex === STRING_COUNT - 1 ? name.toLowerCase() : name;
}

/**
 * The set written low to high with the open-string notes, as the voicings list them:
 * "3–2–1 · G–B–e". The high E is lowercase, matching the chord diagrams.
 */
export function describeStringSet(set: StringSet, tuning: GuitarTuning): string {
  const numbers = set.stringIndexes.map(stringNumber).join('–');
  const notes = set.stringIndexes.map((index) => openStringName(index, tuning)).join('–');
  return `${numbers} · ${notes}`;
}
