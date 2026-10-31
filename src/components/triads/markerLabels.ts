import { chordToneLabel, noteName, type TriadTone } from '../../domain/music';

/** What the note markers print: the chord degree, the note name, or the degree over the note. */
export type MarkerLabelMode = 'degrees' | 'notes' | 'both';

export const MARKER_LABEL_MODES: readonly { id: MarkerLabelMode; label: string }[] = [
  { id: 'both', label: 'Degree + note' },
  { id: 'degrees', label: 'Degrees' },
  { id: 'notes', label: 'Notes' },
];

export interface MarkerText {
  readonly label: string;
  readonly sublabel?: string;
}

/** "3" / "C♯", "C♯", or "3" over "C♯". The root is always written "R". */
export function markerText(tone: TriadTone, mode: MarkerLabelMode): MarkerText {
  switch (mode) {
    case 'degrees':
      return { label: chordToneLabel(tone) };
    case 'notes':
      return { label: noteName(tone.note) };
    case 'both':
      return { label: chordToneLabel(tone), sublabel: noteName(tone.note) };
  }
}
