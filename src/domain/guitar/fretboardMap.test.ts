import { describe, expect, it } from 'vitest';
import { buildFretboardMap, FRETBOARD_MAX_FRET, frettedPitchClass } from './fretboardMap';
import { STANDARD_TUNING } from './tuning';
import { CHORD_ROOTS, chordTypeById } from '../../data';
import { buildChord, intervalLabel, noteName, parseNote } from '../music';

const chord = (root: string, typeId: string) => buildChord(parseNote(root), chordTypeById(typeId));
const map = (root: string, typeId: string) =>
  buildFretboardMap(chord(root, typeId), STANDARD_TUNING);

describe('fretted pitch', () => {
  it('computes every standard-tuning string from its open note', () => {
    const opens = STANDARD_TUNING.strings.map((note) => frettedPitchClass(note, 0));
    expect(opens).toEqual([4, 9, 2, 7, 11, 4]); // E A D G B E
    expect(frettedPitchClass(STANDARD_TUNING.strings[0], 5)).toBe(9); // low E, fret 5 = A
    expect(frettedPitchClass(STANDARD_TUNING.strings[4], 1)).toBe(0); // B string, fret 1 = C
    expect(frettedPitchClass(STANDARD_TUNING.strings[3], 2)).toBe(9); // G string, fret 2 = A
  });

  it('returns the open pitch class again at fret 12', () => {
    for (const note of STANDARD_TUNING.strings) {
      expect(frettedPitchClass(note, 12)).toBe(frettedPitchClass(note, 0));
    }
    expect(() => frettedPitchClass(STANDARD_TUNING.strings[0], -1)).toThrow();
  });
});

describe('fretboard map', () => {
  it('covers six strings from fret 0 to 12', () => {
    const positions = map('A', 'major');
    expect(positions).toHaveLength(6 * (FRETBOARD_MAX_FRET + 1));
    expect(Math.min(...positions.map((p) => p.fret))).toBe(0);
    expect(Math.max(...positions.map((p) => p.fret))).toBe(12);
    expect(positions[0]).toMatchObject({ stringIndex: 0, stringNumber: 6, fret: 0 });
  });

  it('marks exactly the major-scale notes as scale tones, spelled by degree', () => {
    const scaleTones = map('A', 'major').filter((p) => p.isScaleTone);
    const names = new Set(scaleTones.map((p) => noteName(p.note!)));
    expect([...names].sort()).toEqual(['A', 'B', 'C♯', 'D', 'E', 'F♯', 'G♯'].sort());
    expect(new Set(scaleTones.map((p) => p.scaleDegree))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7]));
    // The B string at fret 2 sounds C♯, the third of A.
    const bString2 = scaleTones.find((p) => p.stringIndex === 4 && p.fret === 2);
    expect(bString2).toMatchObject({ scaleDegree: 3, isChordTone: true, isRoot: false });
    expect(noteName(bString2!.note!)).toBe('C♯');
  });

  it('finds the root on every string within the first twelve frets', () => {
    const roots = map('A', 'major').filter((p) => p.isRoot);
    expect(roots.map((p) => `${p.stringNumber}:${p.fret}`)).toEqual([
      '6:5',
      '5:0',
      '5:12',
      '4:7',
      '3:2',
      '2:10',
      '1:5',
    ]);
    expect(roots.every((p) => p.scaleDegree === 1 && p.isChordTone)).toBe(true);
  });

  it('labels chord tones of A major with no altered tones', () => {
    const positions = map('A', 'major');
    const chordNotes = new Set(
      positions.filter((p) => p.isChordTone).map((p) => noteName(p.note!)),
    );
    expect([...chordNotes].sort()).toEqual(['A', 'C♯', 'E']);
    expect(positions.some((p) => p.isAlteredChordTone)).toBe(false);
  });

  it('shows the minor third of Am as an altered ♭3 while C♯ stays scale degree 3', () => {
    const positions = map('A', 'minor');
    const altered = positions.filter((p) => p.isAlteredChordTone);
    expect(new Set(altered.map((p) => noteName(p.note!)))).toEqual(new Set(['C']));
    expect(new Set(altered.map((p) => intervalLabel(p.chordDegree!)))).toEqual(new Set(['♭3']));
    expect(altered.every((p) => !p.isScaleTone && p.scaleDegree === null)).toBe(true);
    const cSharp = positions.find((p) => p.stringIndex === 4 && p.fret === 2)!;
    expect(cSharp).toMatchObject({ scaleDegree: 3, isScaleTone: true, isChordTone: false });
  });

  it('shows A7 with G as ♭7 next to the scale G♯, and Am7 with both alterations', () => {
    const a7 = map('A', 'dominant7');
    expect(new Set(a7.filter((p) => p.isAlteredChordTone).map((p) => noteName(p.note!)))).toEqual(
      new Set(['G']),
    );
    expect(a7.filter((p) => p.isAlteredChordTone)[0].chordDegree).toEqual(
      expect.objectContaining({ degree: 7, alteration: -1 }),
    );
    expect(a7.some((p) => p.isScaleTone && noteName(p.note!) === 'G♯')).toBe(true);

    const am7 = map('A', 'minor7');
    const altered = am7.filter((p) => p.isAlteredChordTone);
    expect(
      new Set(altered.map((p) => `${intervalLabel(p.chordDegree!)}/${noteName(p.note!)}`)),
    ).toEqual(new Set(['♭3/C', '♭7/G']));
  });

  it('spells the augmented fifth as E♯, not F', () => {
    const altered = map('A', 'augmented').filter((p) => p.isAlteredChordTone);
    expect(new Set(altered.map((p) => noteName(p.note!)))).toEqual(new Set(['E♯']));
    expect(altered[0].chordDegree).toEqual(expect.objectContaining({ degree: 5, alteration: 1 }));
  });

  it('spells scales by the chosen root: B♭ gives E♭, C♯ gives E♯ and B♯', () => {
    const bFlat = new Set(
      map('Bb', 'major')
        .filter((p) => p.isScaleTone)
        .map((p) => noteName(p.note!)),
    );
    expect(bFlat).toEqual(new Set(['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A']));
    const cSharp = new Set(
      map('C#', 'major')
        .filter((p) => p.isScaleTone)
        .map((p) => noteName(p.note!)),
    );
    expect(cSharp).toEqual(new Set(['C♯', 'D♯', 'E♯', 'F♯', 'G♯', 'A♯', 'B♯']));
    const dFlat = new Set(
      map('Db', 'major')
        .filter((p) => p.isScaleTone)
        .map((p) => noteName(p.note!)),
    );
    expect(dFlat).toEqual(new Set(['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C']));
  });

  it('gives fret 12 the same degree and spelling as the open string', () => {
    for (const root of CHORD_ROOTS) {
      const positions = buildFretboardMap(
        buildChord(root.note, chordTypeById('minor7')),
        STANDARD_TUNING,
      );
      for (let string = 0; string < 6; string += 1) {
        const open = positions.find((p) => p.stringIndex === string && p.fret === 0)!;
        const twelfth = positions.find((p) => p.stringIndex === string && p.fret === 12)!;
        expect(twelfth.pitchClass, root.label).toBe(open.pitchClass);
        expect(twelfth.scaleDegree, root.label).toBe(open.scaleDegree);
        expect(twelfth.note ? noteName(twelfth.note) : null, root.label).toBe(
          open.note ? noteName(open.note) : null,
        );
      }
    }
  });

  it('gives every supported root seven scale pitch classes using each letter once', () => {
    for (const root of CHORD_ROOTS) {
      const positions = buildFretboardMap(
        buildChord(root.note, chordTypeById('major')),
        STANDARD_TUNING,
      );
      const scale = positions.filter((p) => p.isScaleTone);
      expect(new Set(scale.map((p) => p.pitchClass)).size, root.label).toBe(7);
      expect(new Set(scale.map((p) => p.note!.letter)).size, root.label).toBe(7);
      expect(scale.filter((p) => p.isRoot).length, root.label).toBeGreaterThanOrEqual(6);
      expect(
        positions.every((p) => p.fret >= 0 && p.fret <= 12),
        root.label,
      ).toBe(true);
    }
  });
});
