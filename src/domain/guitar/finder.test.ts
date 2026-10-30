import { describe, expect, it } from 'vitest';
import { shapeNoteNames } from './describe';
import {
  compareForRecommendation,
  findVerifiedShapes,
  playInstructions,
  selectRecommendedShape,
  shapeCode,
  shapeFamily,
} from './finder';
import type { ShapeDefinition } from './shapes';
import { STANDARD_TUNING } from './tuning';
import { validateShapeDefinition } from './validate';
import { lowestSoundingString, shapesForChord, soundingPitchClass, voiceShape } from './voicing';
import { CHORD_ROOTS, chordTypeById, SHAPE_LIBRARY } from '../../data';
import { buildChord, parseNote } from '../music';

const chord = (root: string, typeId: string, bass?: string) =>
  buildChord(parseNote(root), chordTypeById(typeId), bass ? parseNote(bass) : null);

const codes = (root: string, typeId: string, bass?: string) =>
  findVerifiedShapes(chord(root, typeId, bass), SHAPE_LIBRARY, STANDARD_TUNING).map((shape) =>
    shapeCode(shape.frets),
  );

describe('shape codes and families', () => {
  it('writes frets low to high with x for muted strings', () => {
    expect(shapeCode([null, 2, null, 0, 1, 0])).toBe('x2x010');
    expect(shapeCode([0, 3, 2, 0, 1, 0])).toBe('032010');
  });

  it('switches to dashes once a fret reaches 10', () => {
    expect(shapeCode([8, 10, 10, 9, 8, 8])).toBe('8-10-10-9-8-8');
    expect(shapeCode([null, 12, 14, 14, 12, 12])).toBe('x-12-14-14-12-12');
  });

  it('classifies shapes as open, barre or movable', () => {
    const [cOverB, lowE] = findVerifiedShapes(
      chord('C', 'major', 'B'),
      SHAPE_LIBRARY,
      STANDARD_TUNING,
    );
    expect(shapeFamily(cOverB)).toBe('open');
    expect(shapeFamily(lowE)).toBe('barre');
    const [dim] = findVerifiedShapes(chord('C', 'diminished'), SHAPE_LIBRARY, STANDARD_TUNING);
    expect(shapeFamily(dim)).toBe('movable');
  });
});

describe('shape lookup', () => {
  it('finds the reference shapes from the brief, recommended first', () => {
    expect(codes('C', 'major', 'B')).toEqual(['x2x010', '7x555x']);
    expect(codes('C', 'major', 'E')).toEqual(['032010']);
    expect(codes('C', 'major', 'G')).toEqual(['332010']);
    expect(codes('F♯', 'minor7')[0]).toBe('242222');
    expect(codes('B♭', 'major7', 'D')).toEqual(['x53335']);
    expect(codes('A', 'sus2')[0]).toBe('x02200');
  });

  it('sounds the declared notes on every string of the C/B shapes', () => {
    const [open, lowE] = findVerifiedShapes(
      chord('C', 'major', 'B'),
      SHAPE_LIBRARY,
      STANDARD_TUNING,
    );
    expect(shapeNoteNames(open)).toEqual(['x', 'B', 'x', 'G', 'C', 'E']);
    expect(shapeNoteNames(lowE)).toEqual(['B', 'x', 'G', 'C', 'E', 'x']);
    expect(lowE.barres).toEqual([{ fret: 5, fromString: 2, toString: 4, finger: 1 }]);
    expect(open.fingers).toEqual([null, 2, null, null, 1, null]);
  });

  it('never answers a slash chord with a plain shape, or a plain chord with a slash shape', () => {
    expect(codes('C', 'major')).not.toContain('032010');
    expect(codes('C', 'major')).not.toContain('x2x010');
    expect(codes('C', 'major', 'B')).not.toContain('x32010');
    expect(codes('C', 'major', 'F')).toEqual([]);
  });

  it('has the common diatonic slash chords in the library, pending verification', () => {
    const allCodes = (root: string, typeId: string, bass: string) =>
      shapesForChord(chord(root, typeId, bass), SHAPE_LIBRARY, STANDARD_TUNING).map((shape) =>
        shapeCode(shape.frets),
      );
    expect(allCodes('D', 'major', 'F♯')).toEqual(['2x0232']);
    expect(allCodes('G', 'major', 'B')).toEqual(['x20033']);
    expect(allCodes('G', 'major', 'D')).toEqual(['xx0433']);
    expect(allCodes('A', 'minor', 'G')).toEqual(['302210']);
    expect(allCodes('A', 'minor', 'C')).toEqual(['x32210']);
    expect(allCodes('F', 'major', 'A')).toEqual(['x03211']);
    expect(allCodes('E', 'major', 'G♯')).toEqual(['4x2100']);
    expect(allCodes('E', 'minor', 'B')).toEqual(['x22000']);
    expect(allCodes('A', 'major', 'C♯')).toEqual(['x42220']);
    expect(allCodes('D', 'major', 'A')).toEqual(['x00232']);
    expect(allCodes('D', 'major', 'C')).toEqual(['x30232']);
    // Not yet played, so the finder does not offer them.
    expect(codes('D', 'major', 'F♯')).toEqual([]);
  });

  it('transposes the CAGED forms to every root within the fretboard', () => {
    const caged = SHAPE_LIBRARY.filter((shape) => /-(C|D|G)-shape$/.test(shape.id));
    expect(caged.map((shape) => shape.id).sort()).toEqual([
      'dominant7-C-shape',
      'dominant7-D-shape',
      'major-C-shape',
      'major-D-shape',
      'major-G-shape',
      'major7-C-shape',
      'major7-D-shape',
      'minor-D-shape',
      'minor7-D-shape',
      'sus2-D-shape',
      'sus4-D-shape',
    ]);
    for (const definition of caged) {
      for (const root of CHORD_ROOTS) {
        const target = buildChord(root.note, chordTypeById(definition.chordTypeId));
        const placed = shapesForChord(target, [definition], STANDARD_TUNING);
        expect(placed.length, `${definition.id} on ${root.label}`).toBe(1);
      }
    }
    // Written positions from the brief: the C form of D major and the D form of E major.
    expect(
      shapesForChord(chord('D', 'major'), caged, STANDARD_TUNING).map((shape) =>
        shapeCode(shape.frets),
      ),
    ).toContain('x54232');
    expect(
      shapesForChord(chord('E', 'major'), caged, STANDARD_TUNING).map((shape) =>
        shapeCode(shape.frets),
      ),
    ).toContain('xx2454');
  });

  it('leaves out unverified fingerings', () => {
    expect(
      shapesForChord(chord('E', 'sus2'), SHAPE_LIBRARY, STANDARD_TUNING).map(
        (shape) => shape.definition.id,
      ),
    ).toContain('E-sus2-open');
    expect(
      findVerifiedShapes(chord('E', 'sus2'), SHAPE_LIBRARY, STANDARD_TUNING).map(
        (shape) => shape.definition.id,
      ),
    ).not.toContain('E-sus2-open');
  });

  it('puts the requested bass on the lowest sounding string for every root', () => {
    // The movable slash shapes: X over its major seventh (C/B) and Xmaj7 over its third.
    let checked = 0;
    for (const root of CHORD_ROOTS) {
      const seventh = buildChord(root.note, chordTypeById('major7')).tones[3].note;
      const third = buildChord(root.note, chordTypeById('major7')).tones[1].note;
      const targets = [
        buildChord(root.note, chordTypeById('major'), seventh),
        buildChord(root.note, chordTypeById('major7'), third),
      ];
      for (const target of targets) {
        const shapes = findVerifiedShapes(target, SHAPE_LIBRARY, STANDARD_TUNING);
        expect(shapes.length, target.symbol).toBeGreaterThan(0);
        for (const shape of shapes) {
          const lowest = lowestSoundingString(shape.frets) as number;
          const sounding = soundingPitchClass(
            STANDARD_TUNING.strings[lowest],
            shape.frets[lowest] as number,
          );
          expect(sounding, `${target.symbol} ${shape.definition.id}`).toBe(target.bass?.pitchClass);
          checked += 1;
        }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(CHORD_ROOTS.length * 2);
  });
});

describe('slash-chord validation', () => {
  const cOverB = SHAPE_LIBRARY.find((shape) => shape.id === 'C-over-B-open') as ShapeDefinition;

  it('accepts a shape whose lowest string is the bass', () => {
    expect(validateShapeDefinition(cOverB, chordTypeById('major'), STANDARD_TUNING)).toEqual([]);
  });

  it('rejects a slash shape whose bass is not the lowest sounding note', () => {
    // Open low E under the C/B shape: E sounds lowest, not B.
    const wrongBass = { ...cOverB, frets: [0, 2, null, 0, 1, 0] };
    expect(validateShapeDefinition(wrongBass, chordTypeById('major'), STANDARD_TUNING)).toEqual([
      expect.stringMatching(/needs 11 in the bass/),
    ]);
  });

  it('rejects a slash shape with an undeclared extra tone', () => {
    const extraTone = {
      ...cOverB,
      frets: [null, 2, null, 0, 1, 1],
      fingers: [null, 2, null, null, 1, 1] as const,
    };
    expect(
      validateShapeDefinition(extraTone, chordTypeById('major'), STANDARD_TUNING),
    ).toContainEqual(expect.stringMatching(/string 5 at fret 1 .* not in C\/B/));
  });

  it('still requires every chord tone of a slash chord', () => {
    const missingFifth = {
      ...cOverB,
      frets: [null, 2, null, null, 1, 0],
      fingers: [null, 2, null, null, 1, null] as const,
    };
    expect(
      validateShapeDefinition(missingFifth, chordTypeById('major'), STANDARD_TUNING),
    ).toContainEqual(expect.stringMatching(/missing degree 5/));
  });
});

describe('recommendation', () => {
  const definition = (id: string): ShapeDefinition => {
    const found = SHAPE_LIBRARY.find((shape) => shape.id === id);
    if (!found) throw new Error(`missing shape ${id}`);
    return found;
  };

  it('prefers open shapes, then lower positions', () => {
    const a = chord('A', 'major');
    const open = voiceShape(definition('A-major-open'), a, STANDARD_TUNING, 0);
    const barre5 = voiceShape(definition('major-E-shape'), a, STANDARD_TUNING, 4);
    const barre12 = voiceShape(definition('major-A-shape'), a, STANDARD_TUNING, 11);
    expect(selectRecommendedShape([barre12, barre5, open])).toBe(open);
    expect([barre12, barre5].sort(compareForRecommendation)[0]).toBe(barre5);
  });

  it('lets an explicit priority override the automatic ranking', () => {
    const a = chord('A', 'major');
    const open = voiceShape(definition('A-major-open'), a, STANDARD_TUNING, 0);
    const preferredBarre = voiceShape(
      { ...definition('major-E-shape'), priority: 1 },
      a,
      STANDARD_TUNING,
      4,
    );
    expect(selectRecommendedShape([open, preferredBarre])).toBe(preferredBarre);
  });

  it('ranks verified fingerings above unverified ones', () => {
    const e = chord('E', 'sus2');
    const unverifiedOpen = voiceShape(definition('E-sus2-open'), e, STANDARD_TUNING, 0);
    const barre = voiceShape(definition('sus2-A-shape'), e, STANDARD_TUNING, 6);
    expect(selectRecommendedShape([unverifiedOpen, barre])).toBe(barre);
  });

  it('returns null for an empty list', () => {
    expect(selectRecommendedShape([])).toBeNull();
  });
});

describe('play instructions', () => {
  const instructionsFor = (root: string, typeId: string, bass?: string, index = 0) =>
    playInstructions(
      findVerifiedShapes(chord(root, typeId, bass), SHAPE_LIBRARY, STANDARD_TUNING)[index],
    );

  it('describes the open C/B shape', () => {
    const result = instructionsFor('C', 'major', 'B');
    expect(result.startString).toBe(5);
    expect(result.stopString).toBeNull();
    expect(result.mutedStrings).toEqual([6, 4]);
    expect(result.openStrings).toEqual([3, 1]);
    expect(result.steps).toEqual([
      'Start on string 5.',
      'Strum toward the high e string.',
      'Mute strings 6 and 4.',
      'Let strings 3 and 1 ring open.',
      'Finger 2 on string 5 fret 2, finger 1 on string 2 fret 1.',
    ]);
  });

  it('stops the strum short and names the barre for the C/B shape on the low E', () => {
    const result = instructionsFor('C', 'major', 'B', 1);
    expect(result.startString).toBe(6);
    expect(result.stopString).toBe(2);
    expect(result.steps).toEqual([
      'Start on string 6.',
      'Strum down to string 2; do not hit string 1.',
      'Mute strings 5 and 1.',
      'Barre strings 4 to 2 at fret 5 with finger 1.',
      'Finger 3 on string 6 fret 7.',
    ]);
  });

  it('says to strum all six strings for C/E', () => {
    expect(instructionsFor('C', 'major', 'E').steps.slice(0, 2)).toEqual([
      'Start on string 6.',
      'Strum all six strings.',
    ]);
  });

  it('describes the F♯m7 barre with the added A-string note', () => {
    const result = instructionsFor('F♯', 'minor7');
    expect(result.steps).toEqual([
      'Start on string 6.',
      'Strum all six strings.',
      'Barre strings 6 to 1 at fret 2 with finger 1.',
      'Finger 3 on string 5 fret 4.',
    ]);
  });

  it('describes B♭maj7/D and Asus2', () => {
    expect(instructionsFor('B♭', 'major7', 'D').steps).toEqual([
      'Start on string 5.',
      'Strum toward the high e string.',
      'Mute string 6.',
      'Barre strings 4 to 2 at fret 3 with finger 1.',
      'Finger 3 on string 5 fret 5, finger 4 on string 1 fret 5.',
    ]);
    expect(instructionsFor('A', 'sus2').steps).toEqual([
      'Start on string 5.',
      'Strum toward the high e string.',
      'Mute string 6.',
      'Let strings 5, 2 and 1 ring open.',
      'Finger 1 on string 4 fret 2, finger 2 on string 3 fret 2.',
    ]);
  });
});
