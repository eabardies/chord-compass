import { describe, expect, it } from 'vitest';
import {
  CHORD_ROOTS,
  CHORD_TYPES,
  KEY_TONICS,
  PROGRESSION_TEMPLATES,
  SHAPE_LIBRARY,
  chordTypeById,
  shapeLibrary,
} from './index';
import { assertValidShapeLibrary, STANDARD_TUNING, shapesForChord } from '../domain/guitar';
import { buildChord, harmonizeKey, scaleNotes } from '../domain/music';

describe('curated data integrity', () => {
  it('every shape passes validation', () => {
    expect(() =>
      assertValidShapeLibrary(SHAPE_LIBRARY, chordTypeById, STANDARD_TUNING),
    ).not.toThrow();
    expect(shapeLibrary()).toBe(SHAPE_LIBRARY);
  });

  it('every shape plays all tones of its chord (plus any slash bass) unless an omission is declared', () => {
    for (const shape of SHAPE_LIBRARY) {
      if (shape.omittedDegrees.length > 0) continue;
      const root = CHORD_ROOTS.find((option) => option.pitchClass === shape.rootPitchClass);
      if (!root) throw new Error(`no root option for pitch class ${shape.rootPitchClass}`);
      const bass =
        shape.bassPitchClass === undefined
          ? null
          : (CHORD_ROOTS.find((option) => option.pitchClass === shape.bassPitchClass)?.note ??
            null);
      const chord = buildChord(root.note, chordTypeById(shape.chordTypeId), bass);
      const matches = shapesForChord(chord, [shape], STANDARD_TUNING);
      expect(matches, shape.id).toHaveLength(1);
      const sounding = new Set(
        matches[0].strings.flatMap((s) => (s.tone ? [s.tone.pitchClass] : [])),
      );
      const expected = new Set(chord.tones.map((tone) => tone.pitchClass));
      if (chord.bass) expected.add(chord.bass.pitchClass);
      expect(sounding, shape.id).toEqual(expected);
    }
  });

  it('chord roots cover all twelve pitch classes', () => {
    expect(new Set(CHORD_ROOTS.map((root) => root.pitchClass)).size).toBe(12);
    expect(new Set(CHORD_ROOTS.map((root) => root.id)).size).toBe(CHORD_ROOTS.length);
  });

  it('key tonics cover all twelve pitch classes and keep scales to single accidentals', () => {
    for (const mode of ['major', 'minor'] as const) {
      expect(new Set(KEY_TONICS[mode].map((root) => root.pitchClass)).size).toBe(12);
      for (const tonic of KEY_TONICS[mode]) {
        for (const note of scaleNotes({ tonic: tonic.note, mode })) {
          expect(Math.abs(note.accidental), `${tonic.label} ${mode}`).toBeLessThanOrEqual(1);
        }
        expect(() => harmonizeKey({ tonic: tonic.note, mode })).not.toThrow();
      }
    }
  });

  it('progression templates use valid degrees for their mode', () => {
    for (const template of PROGRESSION_TEMPLATES) {
      for (const step of template.steps) {
        expect(step.degree).toBeGreaterThanOrEqual(1);
        expect(step.degree).toBeLessThanOrEqual(7);
        if (step.chordTypeId) expect(() => chordTypeById(step.chordTypeId as string)).not.toThrow();
      }
    }
    expect(CHORD_TYPES.map((type) => type.id)).toContain('dominant7');
  });
});
