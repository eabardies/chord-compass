/** Pill marker sizing shared by the triad diagrams, in SVG units. */
export const MARKER_HEIGHT = 22;
const MARKER_PADDING = 12;
const CHAR_WIDTH = 6.5;

/** Width of a pill wide enough for `label` at the marker font size. */
export function markerWidth(label: string): number {
  return Math.max(MARKER_HEIGHT, Math.round(label.length * CHAR_WIDTH + MARKER_PADDING));
}
