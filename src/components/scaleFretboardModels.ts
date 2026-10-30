/**
 * Contract for the scale fretboard SVG. Built by the chord explorer from domain positions;
 * the component only places and styles what it receives.
 */
export type ScaleMarkerTone = 'root' | 'chord' | 'scale' | 'altered';

export interface ScaleMarkerModel {
  readonly id: string;
  /** 0 = low E. */
  readonly stringIndex: number;
  readonly fret: number;
  /** Formatted text inside the marker, e.g. "♭3/C". */
  readonly label: string;
  readonly tone: ScaleMarkerTone;
}

export interface ScaleFretboardStringModel {
  /** 0 = low E. */
  readonly index: number;
  /** Guitar numbering, 6 = low E. */
  readonly number: number;
  /** "high e", "B", ..., "low E". */
  readonly name: string;
}

export interface ScaleFretboardModel {
  /** Accessible name, e.g. "A major scale on the fretboard, A major highlighted". */
  readonly title: string;
  /** Accessible description listing roots, chord tones, scale notes and altered tones. */
  readonly description: string;
  readonly maxFret: number;
  /** Low E first; the component draws the highest string on top. */
  readonly strings: readonly ScaleFretboardStringModel[];
  readonly markers: readonly ScaleMarkerModel[];
}
