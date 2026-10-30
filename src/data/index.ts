import { assertValidShapeLibrary, STANDARD_TUNING } from '../domain/guitar';
import type { ChordTypeCatalog } from '../domain/progressions';
import { chordTypeById, chordTypeForTriad } from './chordTypes';
import { SHAPE_LIBRARY } from './shapes';

export { CHORD_TYPES, CHORD_TYPE_IDS, chordTypeById, chordTypeForTriad } from './chordTypes';
export type { ChordTypeId } from './chordTypes';
export { CHORD_ROOTS, KEY_TONICS, closestRootOption, rootOptionById } from './roots';
export type { RootOption } from './roots';
export { PROGRESSION_TEMPLATES, TWELVE_BAR_BLUES, progressionsForMode } from './progressions';
export { SHAPE_LIBRARY } from './shapes';
export { LEARNABLE_TRIAD_QUALITIES, TRIAD_QUALITY_LABELS } from './triads';

export const CHORD_TYPE_CATALOG: ChordTypeCatalog = {
  byId: chordTypeById,
  forTriad: chordTypeForTriad,
};

/**
 * The curated shapes are validated once, on first use, so a typo in the data fails loudly
 * with the offending entry named instead of rendering a wrong diagram.
 */
let validated = false;
export function shapeLibrary() {
  if (!validated) {
    assertValidShapeLibrary(SHAPE_LIBRARY, chordTypeById, STANDARD_TUNING);
    validated = true;
  }
  return SHAPE_LIBRARY;
}
