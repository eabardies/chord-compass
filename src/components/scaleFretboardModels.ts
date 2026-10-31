/**
 * Contract for the scale fretboard SVG and the section around it. Built by a feature from
 * domain values; the components only place and style what they receive.
 */
export type ScaleMarkerTone = 'root' | 'chord' | 'scale' | 'altered';

/** What the markers print: the degree, the note name, or "degree/note". */
export type FretboardLabelMode = 'degrees' | 'notes' | 'both';

export const FRETBOARD_LABEL_MODES: readonly { id: FretboardLabelMode; label: string }[] = [
  { id: 'degrees', label: 'Degrees' },
  { id: 'notes', label: 'Notes' },
  { id: 'both', label: 'Both' },
];

/** The presentation choices a fretboard section offers; the label mode is shared app-wide. */
export interface ScaleFretboardPreferences {
  readonly labelMode: FretboardLabelMode;
  readonly highlightChord: boolean;
}

export interface ScaleMarkerModel {
  readonly id: string;
  /** 0 = low E. */
  readonly stringIndex: number;
  readonly fret: number;
  /** Formatted text inside the marker, e.g. "♭3/C". */
  readonly label: string;
  readonly tone: ScaleMarkerTone;
  /**
   * The root of the key being displayed, when that differs from the chord root. Drawn with a
   * heavy outline on top of whatever tone the marker has, so the key root stays recognisable
   * while another chord is highlighted.
   */
  readonly isKeyRoot?: boolean;
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

/** One row of the legend under a fretboard: a sample marker and what it stands for. */
export interface FretboardLegendEntry {
  readonly key: string;
  readonly label: string;
  readonly tone: ScaleMarkerTone;
  /** Text inside the sample marker, e.g. "1" or "♭3". */
  readonly sample: string;
  readonly isKeyRoot?: boolean;
}
