import { describe, expect, it } from 'vitest';
import { describeShape, shapeNoteNames } from './describe';
import { MAX_FRET, type ShapeDefinition } from './shapes';
import { movableShapeOffset, transposeFrets } from './transpose';
import { STANDARD_TUNING } from './tuning';
import { validateShapeDefinition } from './validate';
import { shapesForChord, voiceShape } from './voicing';
import { chordTypeById, SHAPE_LIBRARY } from '../../data';
import { buildChord, parseInterval, parseNote } from '../music';

const definition = (id: string): ShapeDefinition => {
  const found = SHAPE_LIBRARY.find((shape) => shape.id === id);
  if (!found) throw new Error(`missing shape ${id}`);
  return found;
};

const chord = (root: string, typeId: string) => buildChord(parseNote(root), chordTypeById(typeId));

describe('voicing fixed shapes', () => {
  it('reads the open A major shape as muted, A, E, A, C♯, E', () => {
    const voiced = voiceShape(definition('A-major-open'), chord('A', 'major'), STANDARD_TUNING, 0);
    expect(shapeNoteNames(voiced)).toEqual(['x', 'A', 'E', 'A', 'C♯', 'E']);
    expect(voiced.positionLabel).toBe('Open position');
    expect(voiced.strings[4].tone?.interval).toEqual(parseInterval('3'));
  });

  it('spells shape notes the way the chord spells them', () => {
    const voiced = voiceShape(definition('A-minor-open'), chord('A', 'minor'), STANDARD_TUNING, 0);
    expect(shapeNoteNames(voiced)).toEqual(['x', 'A', 'E', 'A', 'C', 'E']);
  });

  it('refuses a shape whose notes are not in the chord', () => {
    expect(() =>
      voiceShape(definition('A-major-open'), chord('A', 'minor'), STANDARD_TUNING, 0),
    ).toThrow(/not in Am/);
  });

  it('describes a shape in words', () => {
    const voiced = voiceShape(definition('A-major-open'), chord('A', 'major'), STANDARD_TUNING, 0);
    expect(describeShape(voiced)).toBe(
      'A major, open position: string 6 muted, string 5 open (A), string 4 2nd fret, finger 1 (E), string 3 2nd fret, finger 2 (A), string 2 2nd fret, finger 3 (C♯), string 1 open (E).',
    );
  });
});

describe('transposing movable shapes', () => {
  it('shifts fretted strings and barres together', () => {
    const { frets, barres } = transposeFrets(
      [1, 3, 3, 2, 1, 1],
      [{ fret: 1, fromString: 0, toString: 5, finger: 1 }],
      4,
    );
    expect(frets).toEqual([5, 7, 7, 6, 5, 5]);
    expect(barres[0].fret).toBe(5);
  });

  it('never shifts open or muted strings', () => {
    const { frets } = transposeFrets([null, 0, 2, 2, 2, 0], [], 3);
    expect(frets).toEqual([null, 0, 5, 5, 5, 0]);
  });

  it('rejects positions below the nut or beyond the last usable fret', () => {
    expect(() => transposeFrets([1, 3, 3, 2, 1, 1], [], -1)).toThrow();
    expect(() => transposeFrets([1, 3, 3, 2, 1, 1], [], MAX_FRET)).toThrow();
  });

  it('chooses the lowest position that fits', () => {
    const eShape = definition('major-E-shape'); // written at F, fret 1
    expect(movableShapeOffset(eShape, 9)).toBe(4); // A major at fret 5
    expect(movableShapeOffset(eShape, 4)).toBe(11); // E major: fret 12, since fret 0 is not allowed
    expect(movableShapeOffset(eShape, 5)).toBe(0);
  });

  it('places the E-shape barre for A major at the 5th fret with the right notes', () => {
    const [, barre] = shapesForChord(chord('A', 'major'), SHAPE_LIBRARY, STANDARD_TUNING).filter(
      (shape) => shape.definition.id === 'A-major-open' || shape.definition.id === 'major-E-shape',
    );
    expect(barre.positionLabel).toBe('5th fret barre');
    expect(shapeNoteNames(barre)).toEqual(['A', 'E', 'A', 'C♯', 'E', 'A']);
    expect(barre.barres[0]).toEqual({ fret: 5, fromString: 0, toString: 5, finger: 1 });
  });

  it('spells transposed shapes with the chord spelling, including E♯', () => {
    const [shape] = shapesForChord(chord('A', 'augmented'), SHAPE_LIBRARY, STANDARD_TUNING);
    expect(shapeNoteNames(shape).filter((name) => name !== 'x')).toContain('E♯');
  });

  it('lists open shapes before barre shapes, lowest position first', () => {
    const shapes = shapesForChord(chord('A', 'major'), SHAPE_LIBRARY, STANDARD_TUNING);
    expect(shapes.map((shape) => shape.positionLabel)).toEqual([
      'Open position',
      '5th fret barre',
      '12th fret barre',
    ]);
  });

  it('finds at least one shape for every chord type on every root', () => {
    const roots = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    for (const typeId of [
      'major',
      'minor',
      'dominant7',
      'major7',
      'minor7',
      'sus2',
      'sus4',
      'diminished',
      'augmented',
    ]) {
      for (const root of roots) {
        expect(
          shapesForChord(chord(root, typeId), SHAPE_LIBRARY, STANDARD_TUNING).length,
          `${root} ${typeId}`,
        ).toBeGreaterThan(0);
      }
    }
  });
});

describe('shape validation', () => {
  const base: ShapeDefinition = {
    id: 'test-shape',
    chordTypeId: 'major',
    rootPitchClass: 9, // A
    kind: 'fixed',
    label: 'Test',
    frets: [null, 0, 2, 2, 2, 0],
    fingers: [null, null, 1, 2, 3, null],
    barres: [],
    omittedDegrees: [],
    playability: 'verified',
  };
  const validate = (overrides: Partial<ShapeDefinition>) =>
    validateShapeDefinition({ ...base, ...overrides }, chordTypeById('major'), STANDARD_TUNING);

  it('accepts a correct shape', () => {
    expect(validate({})).toEqual([]);
  });

  it('rejects notes outside the chord', () => {
    expect(validate({ frets: [null, 0, 2, 2, 1, 0] })).toContainEqual(
      expect.stringMatching(/string 4 at fret 1 .* not in A/),
    );
  });

  it('rejects invalid fret values', () => {
    expect(validate({ frets: [null, 0, 2, 2, -1, 0] })[0]).toMatch(/fret -1/);
    expect(validate({ frets: [null, 0, 2, 2, 2.5, 0] })[0]).toMatch(/fret 2.5/);
    expect(validate({ frets: [null, 0, 2, 2, 2] })[0]).toMatch(/6 strings/);
  });

  it('rejects missing tones unless declared omitted, and false omissions', () => {
    const withoutThird = {
      frets: [null, 0, 2, 2, null, 0],
      fingers: [null, null, 1, 2, null, null],
    } as const;
    expect(validate(withoutThird)).toEqual([expect.stringMatching(/missing degree 3/)]);
    expect(validate({ ...withoutThird, omittedDegrees: [parseInterval('3')] })).toEqual([]);
    expect(validate({ omittedDegrees: [parseInterval('3')] })).toEqual([
      expect.stringMatching(/declares degree 3 omitted, but the shape plays it/),
    ]);
    expect(validate({ omittedDegrees: [parseInterval('b7')] })).toEqual([
      expect.stringMatching(/does not contain/),
    ]);
  });

  it('rejects inconsistent fingers', () => {
    expect(validate({ fingers: [null, null, 1, 2, null, null] })).toEqual([
      expect.stringMatching(/string 4 is fretted but has no finger/),
    ]);
    expect(validate({ fingers: [null, 1, 1, 2, 3, null] })).toEqual([
      expect.stringMatching(/string 1 is open but has finger 1/),
    ]);
    expect(validate({ frets: [null, 0, 2, 2, 2, 5], fingers: [null, null, 1, 2, 3, 1] })).toEqual([
      expect.stringMatching(/finger 1 is used at frets 2 and 5/),
    ]);
  });

  it('rejects inconsistent barres', () => {
    const barred = { fingers: [null, null, 1, 1, 1, null] as const };
    expect(validate(barred)).toEqual([expect.stringMatching(/without a declared barre/)]);
    expect(
      validate({ ...barred, barres: [{ fret: 2, fromString: 2, toString: 4, finger: 1 }] }),
    ).toEqual([]);
    expect(
      validate({ ...barred, barres: [{ fret: 3, fromString: 2, toString: 4, finger: 1 }] }),
    ).toContainEqual(expect.stringMatching(/below the barre/));
    expect(
      validate({ ...barred, barres: [{ fret: 2, fromString: 2, toString: 4, finger: 3 }] }),
    ).toContainEqual(expect.stringMatching(/uses finger 1, not 3/));
  });

  it('rejects open strings in movable shapes', () => {
    expect(validate({ kind: 'movable' })).toEqual([expect.stringMatching(/open strings/)]);
  });

  it('rejects uncomfortable spans', () => {
    expect(
      validate({ frets: [null, 0, 2, 2, 7, 0], fingers: [null, null, 1, 2, 3, null] }),
    ).toContainEqual(expect.stringMatching(/spans frets 2–7/));
  });
});
