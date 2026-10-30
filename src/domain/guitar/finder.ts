import type { Chord } from '../music';
import { fretRange, hasOpenString, type FretValue, type ShapeDefinition } from './shapes';
import { stringNumber, type GuitarTuning } from './tuning';
import {
  highestSoundingString,
  lowestSoundingString,
  shapesForChord,
  type VoicedShape,
} from './voicing';

/**
 * Chord-finder services on top of the curated library: which verified shapes play a chord,
 * which one to recommend, and how to describe a shape to someone holding a guitar.
 */

/** "x2x010"; frets of 10 and above switch to a dashed form, "8-10-10-9-8-8". */
export function shapeCode(frets: readonly FretValue[]): string {
  const tokens = frets.map((fret) => (fret === null ? 'x' : String(fret)));
  const wide = frets.some((fret) => fret !== null && fret >= 10);
  return tokens.join(wide ? '-' : '');
}

export type ShapeFamily = 'open' | 'barre' | 'movable';

export const SHAPE_FAMILY_LABELS: Record<ShapeFamily, string> = {
  open: 'Open',
  barre: 'Barre',
  movable: 'Movable',
};

/** Open if any string rings open, barre if a barre is declared, otherwise movable. */
export function shapeFamily(shape: VoicedShape): ShapeFamily {
  if (hasOpenString(shape.frets)) return 'open';
  if (shape.barres.length > 0) return 'barre';
  return 'movable';
}

/** Distance between the lowest and highest fretted note; 0 for all-open shapes. */
export function fretStretch(frets: readonly FretValue[]): number {
  const range = fretRange(frets);
  return range ? range.max - range.min : 0;
}

/**
 * Recommendation order. An explicit `priority` on the definition wins; otherwise verified
 * fingerings come first, then open shapes, then the lower position, the smaller stretch and
 * the fewer barres. Fret count alone never decides.
 */
export function compareForRecommendation(a: VoicedShape, b: VoicedShape): number {
  const priority = (shape: VoicedShape) => shape.definition.priority ?? Number.POSITIVE_INFINITY;
  if (priority(a) !== priority(b)) return priority(a) - priority(b);
  const verified = (shape: VoicedShape) => (shape.definition.playability === 'verified' ? 0 : 1);
  if (verified(a) !== verified(b)) return verified(a) - verified(b);
  const open = (shape: VoicedShape) => (hasOpenString(shape.frets) ? 0 : 1);
  if (open(a) !== open(b)) return open(a) - open(b);
  if (a.lowestFret !== b.lowestFret) return a.lowestFret - b.lowestFret;
  const stretch = fretStretch(a.frets) - fretStretch(b.frets);
  if (stretch !== 0) return stretch;
  return a.barres.length - b.barres.length;
}

/** Verified shapes for a chord, best recommendation first. Empty when none is verified. */
export function findVerifiedShapes(
  chord: Chord,
  library: readonly ShapeDefinition[],
  tuning: GuitarTuning,
): VoicedShape[] {
  return shapesForChord(chord, library, tuning)
    .filter((shape) => shape.definition.playability === 'verified')
    .sort(compareForRecommendation);
}

export function selectRecommendedShape(shapes: readonly VoicedShape[]): VoicedShape | null {
  return [...shapes].sort(compareForRecommendation)[0] ?? null;
}

export interface PlayInstructions {
  /** Guitar string number to start strumming from (6 = low E). */
  readonly startString: number;
  /** Last string to strike when the strum stops short of the high E; null means play through. */
  readonly stopString: number | null;
  readonly mutedStrings: readonly number[];
  readonly openStrings: readonly number[];
  /** Short imperative sentences, in playing order. */
  readonly steps: readonly string[];
}

/** Plain-language playing instructions for a voiced shape, e.g. "Start on string 5." */
export function playInstructions(shape: VoicedShape): PlayInstructions {
  const lowest = lowestSoundingString(shape.frets);
  const highest = highestSoundingString(shape.frets);
  if (lowest === null || highest === null) {
    throw new Error(`Shape ${shape.definition.id} has no sounding strings`);
  }
  const startString = stringNumber(lowest);
  const stopString = highest === shape.frets.length - 1 ? null : stringNumber(highest);
  const mutedStrings = shape.frets.flatMap((fret, index) =>
    fret === null ? [stringNumber(index)] : [],
  );
  const openStrings = shape.frets.flatMap((fret, index) =>
    fret === 0 ? [stringNumber(index)] : [],
  );

  const steps: string[] = [`Start on string ${startString}.`];
  if (stopString === null) {
    steps.push(
      startString === 6 && mutedStrings.length === 0
        ? 'Strum all six strings.'
        : 'Strum toward the high e string.',
    );
  } else {
    steps.push(`Strum down to string ${stopString}; do not hit string ${stopString - 1}.`);
  }
  if (mutedStrings.length > 0) steps.push(`Mute ${listStrings(mutedStrings)}.`);
  if (openStrings.length > 0) steps.push(`Let ${listStrings(openStrings)} ring open.`);
  for (const barre of shape.barres) {
    steps.push(
      `Barre strings ${stringNumber(barre.fromString)} to ${stringNumber(barre.toString)} at fret ${barre.fret} with finger ${barre.finger}.`,
    );
  }
  const fingered = shape.strings.flatMap((string) => {
    if (string.fret === null || string.fret === 0 || string.finger === null) return [];
    const underBarre = shape.barres.some(
      (barre) =>
        barre.fret === string.fret &&
        barre.finger === string.finger &&
        string.index >= barre.fromString &&
        string.index <= barre.toString,
    );
    return underBarre
      ? []
      : [`finger ${string.finger} on string ${stringNumber(string.index)} fret ${string.fret}`];
  });
  if (fingered.length > 0) steps.push(capitalize(`${fingered.join(', ')}.`));

  return { startString, stopString, mutedStrings, openStrings, steps };
}

function listStrings(numbers: readonly number[]): string {
  if (numbers.length === 1) return `string ${numbers[0]}`;
  if (numbers.length === 2) return `strings ${numbers[0]} and ${numbers[1]}`;
  return `strings ${numbers.slice(0, -1).join(', ')} and ${numbers[numbers.length - 1]}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
