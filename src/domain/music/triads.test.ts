import { describe, expect, it } from 'vitest';
import { invertTriad, INVERSION_TONE_ORDER, triadInversions } from './inversions';
import { noteName, parseNote } from './notes';
import { buildTriad, isTriadType, triadNoteNames } from './triads';
import { CHORD_ROOTS, chordTypeById, chordTypeForTriad } from '../../data';

const triad = (root: string, quality: 'major' | 'minor') =>
  buildTriad(parseNote(root), chordTypeForTriad(quality));

describe('triad formulas', () => {
  it('builds major and minor triads from their formulas', () => {
    const major = triad('A', 'major');
    expect(major.formula).toBe('1–3–5');
    expect(major.quality).toBe('major');
    expect(major.name).toBe('A major');
    expect(major.symbol).toBe('A');
    expect(triadNoteNames(major.tones)).toEqual(['A', 'C♯', 'E']);
    expect(major.tones.map((tone) => tone.role)).toEqual(['root', 'third', 'fifth']);

    const minor = triad('A', 'minor');
    expect(minor.formula).toBe('1–♭3–5');
    expect(minor.quality).toBe('minor');
    expect(minor.name).toBe('A minor');
    expect(triadNoteNames(minor.tones)).toEqual(['A', 'C', 'E']);
  });

  it('accepts only chord types with degrees 1, 3 and 5', () => {
    expect(isTriadType(chordTypeById('diminished'))).toBe(true);
    expect(isTriadType(chordTypeById('augmented'))).toBe(true);
    expect(isTriadType(chordTypeById('sus4'))).toBe(false);
    expect(isTriadType(chordTypeById('major7'))).toBe(false);
    expect(() => buildTriad(parseNote('A'), chordTypeById('dominant7'))).toThrow(/not a triad/);
  });

  it('spells the third and fifth by degree for every offered root', () => {
    const expectations: Record<string, [string[], string[]]> = {
      C: [
        ['C', 'E', 'G'],
        ['C', 'E♭', 'G'],
      ],
      'C♯': [
        ['C♯', 'E♯', 'G♯'],
        ['C♯', 'E', 'G♯'],
      ],
      'D♭': [
        ['D♭', 'F', 'A♭'],
        ['D♭', 'F♭', 'A♭'],
      ],
      D: [
        ['D', 'F♯', 'A'],
        ['D', 'F', 'A'],
      ],
      'D♯': [
        ['D♯', 'F𝄪', 'A♯'],
        ['D♯', 'F♯', 'A♯'],
      ],
      'E♭': [
        ['E♭', 'G', 'B♭'],
        ['E♭', 'G♭', 'B♭'],
      ],
      E: [
        ['E', 'G♯', 'B'],
        ['E', 'G', 'B'],
      ],
      F: [
        ['F', 'A', 'C'],
        ['F', 'A♭', 'C'],
      ],
      'F♯': [
        ['F♯', 'A♯', 'C♯'],
        ['F♯', 'A', 'C♯'],
      ],
      'G♭': [
        ['G♭', 'B♭', 'D♭'],
        ['G♭', 'B𝄫', 'D♭'],
      ],
      G: [
        ['G', 'B', 'D'],
        ['G', 'B♭', 'D'],
      ],
      'G♯': [
        ['G♯', 'B♯', 'D♯'],
        ['G♯', 'B', 'D♯'],
      ],
      'A♭': [
        ['A♭', 'C', 'E♭'],
        ['A♭', 'C♭', 'E♭'],
      ],
      A: [
        ['A', 'C♯', 'E'],
        ['A', 'C', 'E'],
      ],
      'A♯': [
        ['A♯', 'C𝄪', 'E♯'],
        ['A♯', 'C♯', 'E♯'],
      ],
      'B♭': [
        ['B♭', 'D', 'F'],
        ['B♭', 'D♭', 'F'],
      ],
      B: [
        ['B', 'D♯', 'F♯'],
        ['B', 'D', 'F♯'],
      ],
    };
    expect(CHORD_ROOTS.map((root) => root.label).sort()).toEqual(Object.keys(expectations).sort());
    for (const root of CHORD_ROOTS) {
      const [major, minor] = expectations[root.label];
      expect(triadNoteNames(buildTriad(root.note, chordTypeForTriad('major')).tones)).toEqual(
        major,
      );
      expect(triadNoteNames(buildTriad(root.note, chordTypeForTriad('minor')).tones)).toEqual(
        minor,
      );
    }
  });

  it('keeps the spelling of the chosen root rather than its enharmonic', () => {
    expect(noteName(triad('Db', 'major').root)).toBe('D♭');
    expect(noteName(triad('C#', 'major').root)).toBe('C♯');
  });
});

describe('triad inversions', () => {
  it('rotates the tones: root, third, fifth → third, fifth, root → fifth, root, third', () => {
    expect(INVERSION_TONE_ORDER).toEqual({
      root: ['root', 'third', 'fifth'],
      first: ['third', 'fifth', 'root'],
      second: ['fifth', 'root', 'third'],
    });
    const major = triad('A', 'major');
    expect(invertTriad(major, 'root').degreeOrder).toBe('R–3–5');
    expect(invertTriad(major, 'root').noteOrder).toBe('A–C♯–E');
    expect(invertTriad(major, 'first').degreeOrder).toBe('3–5–R');
    expect(invertTriad(major, 'first').noteOrder).toBe('C♯–E–A');
    expect(invertTriad(major, 'second').degreeOrder).toBe('5–R–3');
    expect(invertTriad(major, 'second').noteOrder).toBe('E–A–C♯');
  });

  it('uses the flat third in minor inversions', () => {
    const minor = triad('A', 'minor');
    expect(triadInversions(minor).map((inversion) => inversion.degreeOrder)).toEqual([
      'R–♭3–5',
      '♭3–5–R',
      '5–R–♭3',
    ]);
    expect(triadInversions(minor).map((inversion) => inversion.noteOrder)).toEqual([
      'A–C–E',
      'C–E–A',
      'E–A–C',
    ]);
  });

  it('names the inversions in order', () => {
    expect(triadInversions(triad('C', 'major')).map((inversion) => inversion.name)).toEqual([
      'Root position',
      'First inversion',
      'Second inversion',
    ]);
  });
});
