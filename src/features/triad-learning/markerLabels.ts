import { intervalLabel, noteName, type TriadTone } from '../../domain/music';

/** What the note markers print: the chord degree, the note name, or both. */
export type MarkerLabelMode = 'degrees' | 'notes' | 'both';

export const MARKER_LABEL_MODES: readonly { id: MarkerLabelMode; label: string }[] = [
  { id: 'degrees', label: 'Degrees' },
  { id: 'notes', label: 'Notes' },
  { id: 'both', label: 'Both' },
];

/** "3", "C♯" or "3 / C♯". */
export function markerLabel(tone: TriadTone, mode: MarkerLabelMode): string {
  switch (mode) {
    case 'degrees':
      return intervalLabel(tone.interval);
    case 'notes':
      return noteName(tone.note);
    case 'both':
      return `${intervalLabel(tone.interval)} / ${noteName(tone.note)}`;
  }
}
