import type {
  Barre,
  Finger,
  FretValue,
  Playability,
  ShapeDefinition,
  ShapeKind,
} from '../domain/guitar';
import { parseInterval, type PitchClass } from '../domain/music';
import type { ChordTypeId } from './chordTypes';

/**
 * Curated guitar shapes. Frets and fingers are written low E → high E as six tokens:
 *   frets   "x 0 2 2 2 0"   x = muted, 0 = open, n = fret
 *   fingers "- - 1 2 3 -"   - = no finger (muted or open), 1–4 = index to little finger
 *
 * Every entry is checked by `assertValidShapeLibrary` (see data.test.ts): note membership,
 * required tones, declared omissions, barre and finger consistency. `playability` records
 * whether a person has confirmed the fingering is comfortable as written; the UI hides finger
 * numbers for unverified fingerings.
 */

const PC = {
  C: 0,
  Db: 1,
  D: 2,
  Eb: 3,
  E: 4,
  F: 5,
  Gb: 6,
  G: 7,
  Ab: 8,
  A: 9,
  Bb: 10,
  B: 11,
} as const;

interface ShapeInput {
  id: string;
  type: ChordTypeId;
  root: PitchClass;
  kind: ShapeKind;
  label: string;
  frets: string;
  fingers: string;
  /** "fret:from-to:finger", e.g. "1:0-5:1" for a full barre at fret 1 with the index finger. */
  barres?: string[];
  omits?: string[];
  playability?: Playability;
}

function parseFrets(text: string): FretValue[] {
  return text.split(/\s+/).map((token) => (token === 'x' ? null : Number(token)));
}

function parseFingers(text: string): (Finger | null)[] {
  return text.split(/\s+/).map((token) => (token === '-' ? null : (Number(token) as Finger)));
}

function parseBarre(text: string): Barre {
  const match = /^(\d+):(\d)-(\d):(\d)$/.exec(text);
  if (!match) throw new Error(`Cannot parse barre "${text}"`);
  const [, fret, from, to, finger] = match;
  return {
    fret: Number(fret),
    fromString: Number(from),
    toString: Number(to),
    finger: Number(finger) as Finger,
  };
}

function shape(input: ShapeInput): ShapeDefinition {
  return {
    id: input.id,
    chordTypeId: input.type,
    rootPitchClass: input.root,
    kind: input.kind,
    label: input.label,
    frets: parseFrets(input.frets),
    fingers: parseFingers(input.fingers),
    barres: (input.barres ?? []).map(parseBarre),
    omittedDegrees: (input.omits ?? []).map(parseInterval),
    playability: input.playability ?? 'verified',
  };
}

const OPEN = 'Open position';

const FIXED_SHAPES: ShapeDefinition[] = [
  // Major
  shape({
    id: 'C-major-open',
    type: 'major',
    root: PC.C,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 3 2 0 1 0',
    fingers: '- 3 2 - 1 -',
  }),
  shape({
    id: 'A-major-open',
    type: 'major',
    root: PC.A,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 0 2 2 2 0',
    fingers: '- - 1 2 3 -',
  }),
  shape({
    id: 'G-major-open',
    type: 'major',
    root: PC.G,
    kind: 'fixed',
    label: OPEN,
    frets: '3 2 0 0 0 3',
    fingers: '2 1 - - - 3',
  }),
  shape({
    id: 'E-major-open',
    type: 'major',
    root: PC.E,
    kind: 'fixed',
    label: OPEN,
    frets: '0 2 2 1 0 0',
    fingers: '- 2 3 1 - -',
  }),
  shape({
    id: 'D-major-open',
    type: 'major',
    root: PC.D,
    kind: 'fixed',
    label: OPEN,
    frets: 'x x 0 2 3 2',
    fingers: '- - - 1 3 2',
  }),
  shape({
    id: 'F-major-compact',
    type: 'major',
    root: PC.F,
    kind: 'fixed',
    label: 'Compact',
    frets: 'x x 3 2 1 1',
    fingers: '- - 3 2 1 1',
    barres: ['1:4-5:1'],
  }),

  // Minor
  shape({
    id: 'A-minor-open',
    type: 'minor',
    root: PC.A,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 0 2 2 1 0',
    fingers: '- - 2 3 1 -',
  }),
  shape({
    id: 'E-minor-open',
    type: 'minor',
    root: PC.E,
    kind: 'fixed',
    label: OPEN,
    frets: '0 2 2 0 0 0',
    fingers: '- 2 3 - - -',
  }),
  shape({
    id: 'D-minor-open',
    type: 'minor',
    root: PC.D,
    kind: 'fixed',
    label: OPEN,
    frets: 'x x 0 2 3 1',
    fingers: '- - - 2 3 1',
  }),

  // Dominant seventh
  shape({
    id: 'A-dominant7-open',
    type: 'dominant7',
    root: PC.A,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 0 2 0 2 0',
    fingers: '- - 2 - 3 -',
  }),
  shape({
    id: 'E-dominant7-open',
    type: 'dominant7',
    root: PC.E,
    kind: 'fixed',
    label: OPEN,
    frets: '0 2 0 1 0 0',
    fingers: '- 2 - 1 - -',
  }),
  shape({
    id: 'D-dominant7-open',
    type: 'dominant7',
    root: PC.D,
    kind: 'fixed',
    label: OPEN,
    frets: 'x x 0 2 1 2',
    fingers: '- - - 2 1 3',
  }),
  shape({
    id: 'G-dominant7-open',
    type: 'dominant7',
    root: PC.G,
    kind: 'fixed',
    label: OPEN,
    frets: '3 2 0 0 0 1',
    fingers: '3 2 - - - 1',
  }),
  // The open C7 drops the fifth (G) to reach the ♭7 on the G string.
  shape({
    id: 'C-dominant7-open',
    type: 'dominant7',
    root: PC.C,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 3 2 3 1 0',
    fingers: '- 3 2 4 1 -',
    omits: ['5'],
  }),
  shape({
    id: 'B-dominant7-open',
    type: 'dominant7',
    root: PC.B,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 2 1 2 0 2',
    fingers: '- 2 1 3 - 4',
  }),

  // Major seventh
  shape({
    id: 'C-major7-open',
    type: 'major7',
    root: PC.C,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 3 2 0 0 0',
    fingers: '- 3 2 - - -',
  }),
  shape({
    id: 'A-major7-open',
    type: 'major7',
    root: PC.A,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 0 2 1 2 0',
    fingers: '- - 2 1 3 -',
  }),
  shape({
    id: 'D-major7-open',
    type: 'major7',
    root: PC.D,
    kind: 'fixed',
    label: OPEN,
    frets: 'x x 0 2 2 2',
    fingers: '- - - 1 1 1',
    barres: ['2:3-5:1'],
  }),
  shape({
    id: 'E-major7-open',
    type: 'major7',
    root: PC.E,
    kind: 'fixed',
    label: OPEN,
    frets: '0 2 1 1 0 0',
    fingers: '- 3 1 2 - -',
  }),
  shape({
    id: 'G-major7-open',
    type: 'major7',
    root: PC.G,
    kind: 'fixed',
    label: OPEN,
    frets: '3 2 0 0 0 2',
    fingers: '3 2 - - - 1',
  }),
  shape({
    id: 'F-major7-open',
    type: 'major7',
    root: PC.F,
    kind: 'fixed',
    label: OPEN,
    frets: 'x x 3 2 1 0',
    fingers: '- - 3 2 1 -',
  }),

  // Minor seventh
  shape({
    id: 'A-minor7-open',
    type: 'minor7',
    root: PC.A,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 0 2 0 1 0',
    fingers: '- - 2 - 1 -',
  }),
  shape({
    id: 'E-minor7-open',
    type: 'minor7',
    root: PC.E,
    kind: 'fixed',
    label: OPEN,
    frets: '0 2 0 0 0 0',
    fingers: '- 2 - - - -',
  }),
  shape({
    id: 'D-minor7-open',
    type: 'minor7',
    root: PC.D,
    kind: 'fixed',
    label: OPEN,
    frets: 'x x 0 2 1 1',
    fingers: '- - - 2 1 1',
    barres: ['1:4-5:1'],
  }),

  // Suspended second
  shape({
    id: 'A-sus2-open',
    type: 'sus2',
    root: PC.A,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 0 2 2 0 0',
    fingers: '- - 1 2 - -',
  }),
  shape({
    id: 'D-sus2-open',
    type: 'sus2',
    root: PC.D,
    kind: 'fixed',
    label: OPEN,
    frets: 'x x 0 2 3 0',
    fingers: '- - - 1 3 -',
  }),
  shape({
    id: 'E-sus2-open',
    type: 'sus2',
    root: PC.E,
    kind: 'fixed',
    label: OPEN,
    frets: '0 2 4 4 0 0',
    fingers: '- 1 3 4 - -',
    playability: 'unverified',
  }),
  shape({
    id: 'C-sus2-open',
    type: 'sus2',
    root: PC.C,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 3 0 0 3 3',
    fingers: '- 1 - - 3 4',
    playability: 'unverified',
  }),
  shape({
    id: 'G-sus2-open',
    type: 'sus2',
    root: PC.G,
    kind: 'fixed',
    label: OPEN,
    frets: '3 0 0 0 3 3',
    fingers: '2 - - - 3 4',
    playability: 'unverified',
  }),

  // Suspended fourth
  shape({
    id: 'A-sus4-open',
    type: 'sus4',
    root: PC.A,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 0 2 2 3 0',
    fingers: '- - 1 2 4 -',
  }),
  shape({
    id: 'D-sus4-open',
    type: 'sus4',
    root: PC.D,
    kind: 'fixed',
    label: OPEN,
    frets: 'x x 0 2 3 3',
    fingers: '- - - 1 3 4',
  }),
  shape({
    id: 'E-sus4-open',
    type: 'sus4',
    root: PC.E,
    kind: 'fixed',
    label: OPEN,
    frets: '0 2 2 2 0 0',
    fingers: '- 2 3 4 - -',
  }),
  shape({
    id: 'G-sus4-open',
    type: 'sus4',
    root: PC.G,
    kind: 'fixed',
    label: OPEN,
    frets: '3 3 0 0 1 3',
    fingers: '2 3 - - 1 4',
    playability: 'unverified',
  }),
  shape({
    id: 'C-sus4-open',
    type: 'sus4',
    root: PC.C,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 3 3 0 1 1',
    fingers: '- 2 3 - 1 1',
    barres: ['1:4-5:1'],
    playability: 'unverified',
  }),

  // Augmented
  shape({
    id: 'C-augmented-open',
    type: 'augmented',
    root: PC.C,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 3 2 1 1 0',
    fingers: '- 4 3 1 1 -',
    barres: ['1:3-4:1'],
  }),
  shape({
    id: 'D-augmented-open',
    type: 'augmented',
    root: PC.D,
    kind: 'fixed',
    label: OPEN,
    frets: 'x x 0 3 3 2',
    fingers: '- - - 2 3 1',
  }),
  shape({
    id: 'E-augmented-open',
    type: 'augmented',
    root: PC.E,
    kind: 'fixed',
    label: OPEN,
    frets: '0 3 2 1 1 0',
    fingers: '- 4 3 1 1 -',
    barres: ['1:3-4:1'],
    playability: 'unverified',
  }),
  shape({
    id: 'A-augmented-open',
    type: 'augmented',
    root: PC.A,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 0 3 2 2 1',
    fingers: '- - 4 2 3 1',
    playability: 'unverified',
  }),
];

/**
 * Movable shapes are written at their lowest usable position; the root they are written for
 * is `root`. `shapesForChord` transposes them, never shifting open strings (there are none).
 */
const MOVABLE_SHAPES: ShapeDefinition[] = [
  // Barre chords from the E and A open shapes, written at fret 1 (F and B♭).
  shape({
    id: 'major-E-shape',
    type: 'major',
    root: PC.F,
    kind: 'movable',
    label: 'E-shape barre',
    frets: '1 3 3 2 1 1',
    fingers: '1 3 4 2 1 1',
    barres: ['1:0-5:1'],
  }),
  shape({
    id: 'major-A-shape',
    type: 'major',
    root: PC.Bb,
    kind: 'movable',
    label: 'A-shape barre',
    frets: 'x 1 3 3 3 1',
    fingers: '- 1 2 3 4 1',
    barres: ['1:1-5:1'],
  }),
  shape({
    id: 'minor-E-shape',
    type: 'minor',
    root: PC.F,
    kind: 'movable',
    label: 'E-shape barre',
    frets: '1 3 3 1 1 1',
    fingers: '1 3 4 1 1 1',
    barres: ['1:0-5:1'],
  }),
  shape({
    id: 'minor-A-shape',
    type: 'minor',
    root: PC.Bb,
    kind: 'movable',
    label: 'A-shape barre',
    frets: 'x 1 3 3 2 1',
    fingers: '- 1 3 4 2 1',
    barres: ['1:1-5:1'],
  }),
  shape({
    id: 'dominant7-E-shape',
    type: 'dominant7',
    root: PC.F,
    kind: 'movable',
    label: 'E-shape barre',
    frets: '1 3 1 2 1 1',
    fingers: '1 3 1 2 1 1',
    barres: ['1:0-5:1'],
  }),
  shape({
    id: 'dominant7-A-shape',
    type: 'dominant7',
    root: PC.Bb,
    kind: 'movable',
    label: 'A-shape barre',
    frets: 'x 1 3 1 3 1',
    fingers: '- 1 3 1 4 1',
    barres: ['1:1-5:1'],
  }),
  shape({
    id: 'major7-E-shape',
    type: 'major7',
    root: PC.F,
    kind: 'movable',
    label: 'E-shape barre',
    frets: '1 3 2 2 1 1',
    fingers: '1 4 2 3 1 1',
    barres: ['1:0-5:1'],
  }),
  shape({
    id: 'major7-A-shape',
    type: 'major7',
    root: PC.Bb,
    kind: 'movable',
    label: 'A-shape barre',
    frets: 'x 1 3 2 3 1',
    fingers: '- 1 3 2 4 1',
    barres: ['1:1-5:1'],
  }),
  shape({
    id: 'minor7-E-shape',
    type: 'minor7',
    root: PC.F,
    kind: 'movable',
    label: 'E-shape barre',
    frets: '1 3 1 1 1 1',
    fingers: '1 3 1 1 1 1',
    barres: ['1:0-5:1'],
  }),
  shape({
    id: 'minor7-A-shape',
    type: 'minor7',
    root: PC.Bb,
    kind: 'movable',
    label: 'A-shape barre',
    frets: 'x 1 3 1 2 1',
    fingers: '- 1 3 1 2 1',
    barres: ['1:1-5:1'],
  }),
  shape({
    id: 'sus2-A-shape',
    type: 'sus2',
    root: PC.Bb,
    kind: 'movable',
    label: 'A-shape barre',
    frets: 'x 1 3 3 1 1',
    fingers: '- 1 3 4 1 1',
    barres: ['1:1-5:1'],
  }),
  shape({
    id: 'sus4-E-shape',
    type: 'sus4',
    root: PC.F,
    kind: 'movable',
    label: 'E-shape barre',
    frets: '1 3 3 3 1 1',
    fingers: '1 3 3 3 1 1',
    barres: ['1:0-5:1', '3:1-3:3'],
  }),
  shape({
    id: 'sus4-A-shape',
    type: 'sus4',
    root: PC.Bb,
    kind: 'movable',
    label: 'A-shape barre',
    frets: 'x 1 3 3 4 1',
    fingers: '- 1 2 3 4 1',
    barres: ['1:1-5:1'],
  }),

  // Diminished and augmented triads have no common open shapes; these four-string
  // shapes are the usual way to play them. Written with the root on the A or D string.
  shape({
    id: 'diminished-A-string',
    type: 'diminished',
    root: PC.B,
    kind: 'movable',
    label: 'Root on A string',
    frets: 'x 2 3 4 3 x',
    fingers: '- 1 2 4 3 -',
  }),
  shape({
    id: 'diminished-D-string',
    type: 'diminished',
    root: PC.Eb,
    kind: 'movable',
    label: 'Root on D string',
    frets: 'x x 1 2 4 2',
    fingers: '- - 1 2 4 3',
  }),
  shape({
    id: 'augmented-A-string',
    type: 'augmented',
    root: PC.Db,
    kind: 'movable',
    label: 'Root on A string',
    frets: 'x 4 3 2 2 x',
    fingers: '- 4 3 1 1 -',
    barres: ['2:3-4:1'],
  }),
  shape({
    id: 'augmented-D-string',
    type: 'augmented',
    root: PC.Eb,
    kind: 'movable',
    label: 'Root on D string',
    frets: 'x x 1 4 4 3',
    fingers: '- - 1 3 4 2',
    playability: 'unverified',
  }),
];

export const SHAPE_LIBRARY: readonly ShapeDefinition[] = [...FIXED_SHAPES, ...MOVABLE_SHAPES];
