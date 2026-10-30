import { CHORD_TYPES, chordTypeById, shapeLibrary } from '../../data';
import {
  findVerifiedShapes,
  shapesForChord,
  STANDARD_TUNING,
  type VoicedShape,
} from '../../domain/guitar';
import {
  buildChord,
  parseChordSymbol,
  type Chord,
  type ChordSymbolError,
} from '../../domain/music';

/**
 * One search, resolved: either a specific reason the text is not a chord, a chord the app
 * knows but cannot yet show a verified shape for, or a chord with its verified shapes ranked
 * best first. Pure: the finder derives this from the submitted text on every render.
 */
export type ChordLookup =
  | { readonly status: 'invalid'; readonly message: string; readonly suggestion: string }
  | {
      readonly status: 'no-shape';
      readonly chord: Chord;
      readonly message: string;
      readonly suggestion: string;
    }
  | { readonly status: 'found'; readonly chord: Chord; readonly shapes: readonly VoicedShape[] };

export const EXAMPLE_SYMBOLS = ['C/B', 'C/E', 'F♯m7', 'B♭maj7/D', 'Asus2'] as const;

export function lookupChord(text: string): ChordLookup {
  const parsed = parseChordSymbol(text, CHORD_TYPES);
  if (!parsed.ok) return { status: 'invalid', ...describeError(parsed.error) };
  const { root, typeId, bass } = parsed.value;
  const chord = buildChord(root, chordTypeById(typeId), bass);
  const shapes = findVerifiedShapes(chord, shapeLibrary(), STANDARD_TUNING);
  if (shapes.length === 0) {
    const plain = chord.bass ? buildChord(root, chordTypeById(typeId)).symbol : null;
    const unverified = shapesForChord(chord, shapeLibrary(), STANDARD_TUNING).length;
    return {
      status: 'no-shape',
      chord,
      message:
        unverified > 0
          ? `${chord.symbol} is in the library, but its fingering has not been verified by a player yet.`
          : `${chord.symbol} is a valid chord, but there is no verified shape for it yet.`,
      suggestion:
        unverified > 0
          ? 'The Explore chords tab shows it without finger numbers.'
          : plain
            ? `Try ${plain} without the bass note, or one of the examples.`
            : 'Try one of the examples, or the same chord type on a nearby root.',
    };
  }
  return { status: 'found', chord, shapes };
}

const SUPPORTED_TYPES = CHORD_TYPES.map((type) => `C${type.symbolSuffix}`).join(', ');

function describeError(error: ChordSymbolError): { message: string; suggestion: string } {
  switch (error.kind) {
    case 'empty':
      return {
        message: 'Type a chord symbol to search.',
        suggestion: 'For example C/B, F♯m7 or Asus2.',
      };
    case 'root':
      return {
        message: `“${error.offending}” does not start with a note name.`,
        suggestion: 'Start with a letter from A to G, with # or b if needed: C/B, F#m7, Bbmaj7/D.',
      };
    case 'quality':
      return {
        message: `“${error.offending}” is not a chord type this app knows.`,
        suggestion: `Supported types, written on C: ${SUPPORTED_TYPES}.`,
      };
    case 'bass':
      return {
        message: `“${error.offending}” after the slash is not a bass note.`,
        suggestion: 'Write the bass as a single note after the slash, for example C/E or B♭maj7/D.',
      };
  }
}
