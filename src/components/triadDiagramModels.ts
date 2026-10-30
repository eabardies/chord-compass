/**
 * Contracts for the triad diagram components. They hold formatted text and fret numbers
 * only; the feature that builds them (`features/triad-learning/viewModels.ts`) does the
 * music theory, so the SVGs never compute anything musical.
 */

export interface MarkerModel {
  readonly id: string;
  /** 0 = lowest-pitched string of the set, 2 = highest. */
  readonly voice: number;
  readonly fret: number;
  /** Text printed inside the marker, e.g. "♭3 / C". */
  readonly label: string;
  readonly isRoot: boolean;
  /** "string 2, 5th fret, E (5)" */
  readonly accessibleName: string;
}

export interface DiagramStringModel {
  readonly voice: number;
  /** Guitar string number, 1 = high E. */
  readonly number: number;
  /** Open-string note, high E in lowercase as the chord diagrams do. */
  readonly name: string;
}

export interface TriadDiagramModel {
  /** Short accessible name, e.g. "A major, first inversion on strings 3, 2, 1". */
  readonly title: string;
  /** Full accessible description, string by string. */
  readonly description: string;
  /** First fret drawn; 1 shows the nut. */
  readonly startFret: number;
  readonly fretsShown: number;
  /** "Open position" or "5th fret". */
  readonly positionLabel: string;
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
  readonly strings: readonly DiagramStringModel[];
  readonly groups: readonly FretboardGroupModel[];
}
