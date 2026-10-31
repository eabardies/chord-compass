/** Pill marker sizing shared by the fretboard diagrams, in SVG units. */
export const MARKER_HEIGHT = 22;
/** A marker carrying a second line of text (degree over note name). */
export const STACKED_MARKER_HEIGHT = 34;
const MARKER_PADDING = 12;
const CHAR_WIDTH = 6.5;

/** Width of a pill wide enough for `label` (and `sublabel`, if any) at the marker font sizes. */
export function markerWidth(label: string, sublabel?: string): number {
  const longest = Math.max(label.length, sublabel?.length ?? 0);
  return Math.max(MARKER_HEIGHT, Math.round(longest * CHAR_WIDTH + MARKER_PADDING));
}

export function markerHeight(sublabel?: string): number {
  return sublabel ? STACKED_MARKER_HEIGHT : MARKER_HEIGHT;
}
