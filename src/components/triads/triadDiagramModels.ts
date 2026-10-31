/**
 * Contracts for the triad diagram components. They hold formatted text and fret numbers
 * only; `triadViewModels.ts` does the music theory, so the SVGs never compute anything
 * musical. String indexes follow the app convention: 0 = low E (string 6), 5 = high e
 * (string 1). The diagrams draw string 1 at the top, as tablature does.
 */

export interface MarkerModel {
  readonly id: string;
  /** 0 = low E. */
  readonly stringIndex: number;
  readonly fret: number;
  /** Text printed inside the marker, e.g. "♭3" or "C". */
  readonly label: string;
  /** Second, smaller line inside the marker, e.g. the note name under the degree. */
  readonly sublabel?: string;
  /** Chord-tone role as written: "R", "3", "♭3", "5", "♭5", "♯5". */
  readonly degree: string;
  /** Note name: "C", "E♭". */
  readonly note: string;
  readonly isRoot: boolean;
  /** "string 2, 5th fret, E (5)" */
  readonly accessibleName: string;
}

export interface DiagramStringModel {
  /** 0 = low E. */
  readonly index: number;
  /** Guitar string number, 1 = high e. */
  readonly number: number;
  /** Open-string note, high E in lowercase as the chord diagrams do. */
  readonly name: string;
  /** Whether the string belongs to the set being played. */
  readonly active: boolean;
}

export interface TriadDiagramModel {
  /** Short accessible name, e.g. "A major, first inversion on strings 3, 2, 1". */
  readonly title: string;
  /** Full accessible description: orientation, then string by string. */
  readonly description: string;
  /** First fret drawn. */
  readonly startFret: number;
  readonly fretsShown: number;
  /** True when the window starts at fret 1: the nut is drawn and an open column precedes it. */
  readonly showNut: boolean;
  /** "Open position" or "5th fret". */
  readonly positionLabel: string;
  /** All six strings, low E first. */
  readonly strings: readonly DiagramStringModel[];
  readonly markers: readonly MarkerModel[];
}

export interface FretboardGroupModel {
  readonly id: string;
  readonly label: string;
  readonly lowestFret: number;
  readonly highestFret: number;
  readonly playable: boolean;
  readonly markers: readonly MarkerModel[];
}

export interface TriadFretboardModel {
  readonly title: string;
  readonly description: string;
  /** Highest fret drawn: 12, or more when a shape straddles the octave. */
  readonly maxFret: number;
  /** All six strings, low E first. */
  readonly strings: readonly DiagramStringModel[];
  readonly groups: readonly FretboardGroupModel[];
}
