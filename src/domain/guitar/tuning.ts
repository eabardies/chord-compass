import { parseNote, type NoteSpelling } from '../music';

export const STRING_COUNT = 6;

export interface GuitarTuning {
  readonly id: string;
  readonly name: string;
  /** Open-string notes from low (string 6) to high (string 1). Index 0 is the low E. */
  readonly strings: readonly NoteSpelling[];
}

export const STANDARD_TUNING: GuitarTuning = {
  id: 'standard',
  name: 'Standard tuning',
  strings: ['E', 'A', 'D', 'G', 'B', 'E'].map(parseNote),
};

/** Conventional string number (6 = low E, 1 = high E) for a low-to-high index. */
export function stringNumber(index: number): number {
  return STRING_COUNT - index;
}
