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
  /** Pitch class that must sound lowest: only for slash-chord shapes such as C/B. */
  bass?: PitchClass;
  /** Explicit recommendation rank for the chord finder, lower first. */
  priority?: number;
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
    ...(input.bass === undefined ? {} : { bassPitchClass: input.bass }),
    ...(input.priority === undefined ? {} : { priority: input.priority }),
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
 * Slash-chord shapes. The bass is the lowest sounding string (validated); shapes without a
 * `bass` never match a slash chord, and these never match a plain chord.
 */
const SLASH_SHAPES: ShapeDefinition[] = [
  // C/B: the open C with the B on the A string and the D string muted.
  shape({
    id: 'C-over-B-open',
    type: 'major',
    root: PC.C,
    bass: PC.B,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 2 x 0 1 0',
    fingers: '- 2 - - 1 -',
  }),
  // Major over its major seventh, bass on the low E: C/B at the 5th fret, movable.
  shape({
    id: 'major-over-7-low-E',
    type: 'major',
    root: PC.C,
    bass: PC.B,
    kind: 'movable',
    label: 'Bass on low E',
    frets: '7 x 5 5 5 x',
    fingers: '3 - 1 1 1 -',
    barres: ['5:2-4:1'],
  }),
  // C/E and C/G: the open C with the low E string added, open or at the 3rd fret.
  shape({
    id: 'C-over-E-open',
    type: 'major',
    root: PC.C,
    bass: PC.E,
    kind: 'fixed',
    label: OPEN,
    frets: '0 3 2 0 1 0',
    fingers: '- 3 2 - 1 -',
  }),
  shape({
    id: 'C-over-G-open',
    type: 'major',
    root: PC.C,
    bass: PC.G,
    kind: 'fixed',
    label: OPEN,
    frets: '3 3 2 0 1 0',
    fingers: '3 4 2 - 1 -',
  }),
  // Major seventh over its third, bass on the A string: B♭maj7/D at the 3rd fret, movable.
  shape({
    id: 'major7-over-3-A-string',
    type: 'major7',
    root: PC.Bb,
    bass: PC.D,
    kind: 'movable',
    label: 'Bass on A string',
    frets: 'x 5 3 3 3 5',
    fingers: '- 3 1 1 1 4',
    barres: ['3:2-4:1'],
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

/**
 * The remaining CAGED forms that players actually use, written at their lowest position.
 * The C and G forms of minor, sevenths and sus chords are rare in practice and are left out.
 */
const CAGED_SHAPES: ShapeDefinition[] = [
  // Major
  shape({
    id: 'major-C-shape',
    type: 'major',
    root: PC.D,
    kind: 'movable',
    label: 'C-shape',
    frets: 'x 5 4 2 3 2',
    fingers: '- 4 3 1 2 1',
    barres: ['2:3-5:1'],
  }),
  shape({
    id: 'major-D-shape',
    type: 'major',
    root: PC.E,
    kind: 'movable',
    label: 'D-shape',
    frets: 'x x 2 4 5 4',
    fingers: '- - 1 2 4 3',
  }),
  // The G form drops the high E: reaching it as well is the stretch nobody keeps.
  shape({
    id: 'major-G-shape',
    type: 'major',
    root: PC.A,
    kind: 'movable',
    label: 'G-shape',
    frets: '5 4 2 2 2 x',
    fingers: '3 2 1 1 1 -',
    barres: ['2:2-4:1'],
  }),
  // Minor
  shape({
    id: 'minor-D-shape',
    type: 'minor',
    root: PC.E,
    kind: 'movable',
    label: 'D-shape',
    frets: 'x x 2 4 5 3',
    fingers: '- - 1 3 4 2',
  }),
  // Dominant seventh. The C form drops the fifth, as the open C7 does.
  shape({
    id: 'dominant7-C-shape',
    type: 'dominant7',
    root: PC.D,
    kind: 'movable',
    label: 'C-shape',
    frets: 'x 5 4 5 3 x',
    fingers: '- 3 2 4 1 -',
    omits: ['5'],
  }),
  shape({
    id: 'dominant7-D-shape',
    type: 'dominant7',
    root: PC.E,
    kind: 'movable',
    label: 'D-shape',
    frets: 'x x 2 4 3 4',
    fingers: '- - 1 3 2 4',
  }),
  // Major seventh
  shape({
    id: 'major7-C-shape',
    type: 'major7',
    root: PC.D,
    kind: 'movable',
    label: 'C-shape',
    frets: 'x 5 4 2 2 2',
    fingers: '- 4 3 1 1 1',
    barres: ['2:3-5:1'],
  }),
  shape({
    id: 'major7-D-shape',
    type: 'major7',
    root: PC.E,
    kind: 'movable',
    label: 'D-shape',
    frets: 'x x 2 4 4 4',
    fingers: '- - 1 3 3 3',
    barres: ['4:3-5:3'],
  }),
  // Minor seventh
  shape({
    id: 'minor7-D-shape',
    type: 'minor7',
    root: PC.E,
    kind: 'movable',
    label: 'D-shape',
    frets: 'x x 2 4 3 3',
    fingers: '- - 1 3 2 2',
    barres: ['3:4-5:2'],
  }),
  // Suspended
  shape({
    id: 'sus2-D-shape',
    type: 'sus2',
    root: PC.E,
    kind: 'movable',
    label: 'D-shape',
    frets: 'x x 2 4 5 2',
    fingers: '- - 1 3 4 1',
    barres: ['2:2-5:1'],
  }),
  shape({
    id: 'sus4-D-shape',
    type: 'sus4',
    root: PC.E,
    kind: 'movable',
    label: 'D-shape',
    frets: 'x x 2 4 5 5',
    fingers: '- - 1 3 4 4',
    barres: ['5:4-5:4'],
  }),
  // The four-finger open G that rock and folk players favour over 320003.
  shape({
    id: 'G-major-open-rock',
    type: 'major',
    root: PC.G,
    kind: 'fixed',
    label: 'Open (rock)',
    frets: '3 2 0 0 3 3',
    fingers: '2 1 - - 3 4',
  }),
];

/** The slash chords that turn up in songs: a diatonic bass under an open chord. All fixed. */
const COMMON_SLASH_SHAPES: ShapeDefinition[] = [
  shape({
    id: 'D-over-Fsharp-open',
    type: 'major',
    root: PC.D,
    bass: PC.Gb,
    kind: 'fixed',
    label: OPEN,
    frets: '2 x 0 2 3 2',
    fingers: '2 - - 1 3 1',
    barres: ['2:3-5:1'],
  }),
  shape({
    id: 'G-over-B-open',
    type: 'major',
    root: PC.G,
    bass: PC.B,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 2 0 0 3 3',
    fingers: '- 1 - - 3 4',
  }),
  shape({
    id: 'G-over-D-open',
    type: 'major',
    root: PC.G,
    bass: PC.D,
    kind: 'fixed',
    label: OPEN,
    frets: 'x x 0 4 3 3',
    fingers: '- - - 2 1 1',
    barres: ['3:4-5:1'],
  }),
  shape({
    id: 'A-minor-over-G-open',
    type: 'minor',
    root: PC.A,
    bass: PC.G,
    kind: 'fixed',
    label: OPEN,
    frets: '3 0 2 2 1 0',
    fingers: '4 - 2 3 1 -',
  }),
  shape({
    id: 'A-minor-over-C-open',
    type: 'minor',
    root: PC.A,
    bass: PC.C,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 3 2 2 1 0',
    fingers: '- 4 2 3 1 -',
  }),
  shape({
    id: 'F-over-A-open',
    type: 'major',
    root: PC.F,
    bass: PC.A,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 0 3 2 1 1',
    fingers: '- - 3 2 1 1',
    barres: ['1:4-5:1'],
  }),
  shape({
    id: 'E-over-Gsharp-open',
    type: 'major',
    root: PC.E,
    bass: PC.Ab,
    kind: 'fixed',
    label: OPEN,
    frets: '4 x 2 1 0 0',
    fingers: '3 - 2 1 - -',
  }),
  shape({
    id: 'E-minor-over-B-open',
    type: 'minor',
    root: PC.E,
    bass: PC.B,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 2 2 0 0 0',
    fingers: '- 1 2 - - -',
  }),
  shape({
    id: 'A-over-Csharp-open',
    type: 'major',
    root: PC.A,
    bass: PC.Db,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 4 2 2 2 0',
    fingers: '- 4 1 1 1 -',
    barres: ['2:2-4:1'],
  }),
  shape({
    id: 'D-over-A-open',
    type: 'major',
    root: PC.D,
    bass: PC.A,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 0 0 2 3 2',
    fingers: '- - - 1 3 2',
  }),
  shape({
    id: 'D-over-C-open',
    type: 'major',
    root: PC.D,
    bass: PC.C,
    kind: 'fixed',
    label: OPEN,
    frets: 'x 3 0 2 3 2',
    fingers: '- 3 - 1 4 2',
  }),
];

export const SHAPE_LIBRARY: readonly ShapeDefinition[] = [
  ...FIXED_SHAPES,
  ...MOVABLE_SHAPES,
  ...SLASH_SHAPES,
  ...CAGED_SHAPES,
  ...COMMON_SLASH_SHAPES,
];
