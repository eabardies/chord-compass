import {
  buildChord,
  chordToneForPitchClass,
  intervalLabel,
  intervalsEqual,
  spellPitchClass,
  type ChordTypeDefinition,
} from '../music';
import {
  fretRange,
  hasOpenString,
  MAX_FRET,
  MAX_FRET_SPAN,
  type FretValue,
  type ShapeDefinition,
} from './shapes';
import { STRING_COUNT, type GuitarTuning } from './tuning';
import { lowestSoundingString, soundingPitchClass } from './voicing';

/**
 * Checks a curated shape definition for internal consistency and musical correctness.
 * Returns human-readable problems, each prefixed with the shape id so a failing entry is easy
 * to find. An empty array means the shape is valid.
 *
 * This does not judge playability; that is what `playability: 'verified'` records.
 */
export function validateShapeDefinition(
  shape: ShapeDefinition,
  chordType: ChordTypeDefinition,
  tuning: GuitarTuning,
): string[] {
  const problems: string[] = [];
  const problem = (text: string) => problems.push(`Shape "${shape.id}": ${text}`);

  if (shape.chordTypeId !== chordType.id) {
    problem(`validated against chord type "${chordType.id}" but declares "${shape.chordTypeId}"`);
  }
  if (shape.frets.length !== STRING_COUNT) problem(`frets must list ${STRING_COUNT} strings`);
  if (shape.fingers.length !== STRING_COUNT) problem(`fingers must list ${STRING_COUNT} strings`);
  if (problems.length > 0) return problems;

  shape.frets.forEach((fret, index) => {
    if (fret !== null && (!Number.isInteger(fret) || fret < 0 || fret > MAX_FRET)) {
      problem(`string ${index} has fret ${fret}; expected null, 0 or 1–${MAX_FRET}`);
    }
  });
  if (problems.length > 0) return problems;

  const range = fretRange(shape.frets);
  if (shape.frets.every((fret) => fret === null)) problem('every string is muted');
  if (range && range.max - range.min > MAX_FRET_SPAN) {
    problem(`spans frets ${range.min}–${range.max}, more than ${MAX_FRET_SPAN} frets`);
  }
  if (shape.kind === 'movable' && hasOpenString(shape.frets)) {
    problem('movable shapes cannot use open strings (open strings do not move with the shape)');
  }

  checkFingers(shape, problem);
  checkBarres(shape, problem);
  checkChordMembership(shape, chordType, tuning, problem);
  return problems;
}

function checkFingers(shape: ShapeDefinition, problem: (text: string) => void): void {
  shape.frets.forEach((fret, index) => {
    const finger = shape.fingers[index];
    const sounding = fret !== null && fret > 0;
    if (sounding && finger === null) problem(`string ${index} is fretted but has no finger`);
    if (!sounding && finger !== null)
      problem(`string ${index} is ${fret === null ? 'muted' : 'open'} but has finger ${finger}`);
  });
  // A finger can only press one fret (a barre presses one fret across several strings).
  const fretByFinger = new Map<number, number>();
  shape.frets.forEach((fret, index) => {
    const finger = shape.fingers[index];
    if (finger === null || fret === null || fret === 0) return;
    const existing = fretByFinger.get(finger);
    if (existing !== undefined && existing !== fret) {
      problem(`finger ${finger} is used at frets ${existing} and ${fret}`);
    }
    fretByFinger.set(finger, fret);
  });
}

function checkBarres(shape: ShapeDefinition, problem: (text: string) => void): void {
  for (const barre of shape.barres) {
    if (barre.fromString >= barre.toString) {
      problem(`barre at fret ${barre.fret} must cover at least two strings in ascending order`);
      continue;
    }
    if (barre.fromString < 0 || barre.toString >= STRING_COUNT) {
      problem(`barre at fret ${barre.fret} covers strings outside 0–${STRING_COUNT - 1}`);
      continue;
    }
    let pressedByBarre = 0;
    for (let index = barre.fromString; index <= barre.toString; index += 1) {
      const fret = shape.frets[index];
      const finger = shape.fingers[index];
      if (fret === null) continue; // a muted string under a barre is allowed (e.g. a thumb mute)
      if (fret < barre.fret)
        problem(`string ${index} is at fret ${fret}, below the barre at fret ${barre.fret}`);
      if (fret === barre.fret) {
        pressedByBarre += 1;
        if (finger !== barre.finger) {
          problem(
            `string ${index} sits on the barre at fret ${barre.fret} but uses finger ${finger}, not ${barre.finger}`,
          );
        }
      }
    }
    if (pressedByBarre < 2) problem(`barre at fret ${barre.fret} presses fewer than two strings`);
  }
  // Strings sharing a finger at one fret must be covered by a declared barre.
  const stringsByFingerFret = new Map<string, number[]>();
  shape.frets.forEach((fret, index) => {
    const finger = shape.fingers[index];
    if (finger === null || fret === null || fret === 0) return;
    const key = `${finger}@${fret}`;
    stringsByFingerFret.set(key, [...(stringsByFingerFret.get(key) ?? []), index]);
  });
  for (const [key, strings] of stringsByFingerFret) {
    if (strings.length < 2) continue;
    const [finger, fret] = key.split('@').map(Number);
    const covered = shape.barres.some(
      (barre) =>
        barre.finger === finger &&
        barre.fret === fret &&
        strings.every((index) => index >= barre.fromString && index <= barre.toString),
    );
    if (!covered)
      problem(
        `finger ${finger} presses strings ${strings.join(', ')} at fret ${fret} without a declared barre`,
      );
  }
}

function checkChordMembership(
  shape: ShapeDefinition,
  chordType: ChordTypeDefinition,
  tuning: GuitarTuning,
  problem: (text: string) => void,
): void {
  // Any spelling of the root works for membership: only pitch classes matter here.
  const root = spellPitchClass(shape.rootPitchClass, rootLetterFor(shape.rootPitchClass));
  const bass =
    shape.bassPitchClass === undefined
      ? null
      : spellPitchClass(shape.bassPitchClass, rootLetterFor(shape.bassPitchClass));
  const chord = buildChord(root, chordType, bass);
  const present = new Set<number>();
  shape.frets.forEach((fret, index) => {
    if (fret === null) return;
    const pitchClass = soundingPitchClass(tuning.strings[index], fret);
    const tone = chordToneForPitchClass(chord, pitchClass);
    if (!tone) {
      problem(
        `string ${index} at fret ${fret} sounds pitch class ${pitchClass}, which is not in ${chord.symbol}`,
      );
      return;
    }
    present.add(tone.pitchClass);
  });

  for (const omitted of shape.omittedDegrees) {
    const tone = chord.tones.find((candidate) => intervalsEqual(candidate.interval, omitted));
    if (!tone) {
      problem(
        `declares omitted degree ${intervalLabel(omitted)}, which ${chord.symbol} does not contain`,
      );
    } else if (present.has(tone.pitchClass)) {
      problem(`declares degree ${intervalLabel(omitted)} omitted, but the shape plays it`);
    }
  }
  for (const tone of chord.tones) {
    const declaredOmitted = shape.omittedDegrees.some((omitted) =>
      intervalsEqual(omitted, tone.interval),
    );
    if (!present.has(tone.pitchClass) && !declaredOmitted) {
      problem(
        `is missing degree ${intervalLabel(tone.interval)} (${chord.symbol}) and does not declare it omitted`,
      );
    }
  }
  // A slash chord is defined by its lowest note, so the bass must be the lowest sounding string.
  const lowest = lowestSoundingString(shape.frets);
  if (chord.bass && lowest !== null) {
    const sounding = soundingPitchClass(tuning.strings[lowest], shape.frets[lowest] as number);
    if (sounding !== chord.bass.pitchClass) {
      problem(
        `lowest sounding string ${lowest} plays pitch class ${sounding}, but ${chord.symbol} needs ${chord.bass.pitchClass} in the bass`,
      );
    }
  }
}

const NATURAL_LETTERS: Record<number, 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'> = {
  0: 'C',
  1: 'C',
  2: 'D',
  3: 'E',
  4: 'E',
  5: 'F',
  6: 'F',
  7: 'G',
  8: 'A',
  9: 'A',
  10: 'B',
  11: 'B',
};

function rootLetterFor(pitchClass: number): 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B' {
  return NATURAL_LETTERS[pitchClass];
}

/** Validate a whole library and throw one error listing every problem. */
export function assertValidShapeLibrary(
  library: readonly ShapeDefinition[],
  chordTypeById: (id: string) => ChordTypeDefinition,
  tuning: GuitarTuning,
): void {
  const problems: string[] = [];
  const seenIds = new Set<string>();
  for (const shape of library) {
    if (seenIds.has(shape.id)) problems.push(`Shape "${shape.id}": duplicate id`);
    seenIds.add(shape.id);
    let chordType: ChordTypeDefinition;
    try {
      chordType = chordTypeById(shape.chordTypeId);
    } catch {
      problems.push(`Shape "${shape.id}": unknown chord type "${shape.chordTypeId}"`);
      continue;
    }
    problems.push(...validateShapeDefinition(shape, chordType, tuning));
  }
  if (problems.length > 0) {
    throw new Error(`Invalid shape library:\n${problems.map((text) => `  - ${text}`).join('\n')}`);
  }
}

export function describeFrets(frets: readonly FretValue[]): string {
  return frets.map((fret) => (fret === null ? 'x' : String(fret))).join(' ');
}
