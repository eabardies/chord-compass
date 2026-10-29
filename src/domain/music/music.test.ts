import { describe, expect, it } from 'vitest';
import { buildChord, chordPitchClasses } from './chords';
import { intervalSemitones, parseInterval, transposeNote } from './intervals';
import { harmonizeKey, scaleNotes } from './keys';
import { noteName, parseNote, pitchClassOf, spellPitchClass } from './notes';
import { CHORD_TYPES, chordTypeById } from '../../data/chordTypes';

const names = (notes: { letter: string; accidental: number }[]) =>
  notes.map((note) => noteName(note as Parameters<typeof noteName>[0]));

describe('note spelling', () => {
  it('separates pitch class from spelling', () => {
    expect(pitchClassOf(parseNote('C#'))).toBe(1);
    expect(pitchClassOf(parseNote('Db'))).toBe(1);
    expect(noteName(parseNote('C#'))).toBe('C♯');
    expect(noteName(parseNote('Db'))).toBe('D♭');
    expect(pitchClassOf(parseNote('E#'))).toBe(5);
    expect(pitchClassOf(parseNote('Cb'))).toBe(11);
  });

  it('spells a pitch class with a required letter', () => {
    expect(noteName(spellPitchClass(5, 'E'))).toBe('E♯');
    expect(noteName(spellPitchClass(3, 'E'))).toBe('E♭');
    expect(noteName(spellPitchClass(0, 'B'))).toBe('B♯');
    expect(noteName(spellPitchClass(7, 'F'))).toBe('F𝄪');
    expect(() => spellPitchClass(6, 'C')).toThrow();
  });

  it('parses accidentals in ASCII and unicode', () => {
    expect(parseNote('E♭')).toEqual({ letter: 'E', accidental: -1 });
    expect(parseNote('F##')).toEqual({ letter: 'F', accidental: 2 });
    expect(() => parseNote('H')).toThrow();
  });
});

describe('intervals', () => {
  it('measures intervals against the major scale', () => {
    expect(intervalSemitones(parseInterval('1'))).toBe(0);
    expect(intervalSemitones(parseInterval('3'))).toBe(4);
    expect(intervalSemitones(parseInterval('♭3'))).toBe(3);
    expect(intervalSemitones(parseInterval('b7'))).toBe(10);
    expect(intervalSemitones(parseInterval('#5'))).toBe(8);
    expect(intervalSemitones(parseInterval('9'))).toBe(14);
  });

  it('keeps the letter of the degree when transposing', () => {
    expect(noteName(transposeNote(parseNote('A'), parseInterval('#5')))).toBe('E♯');
    expect(noteName(transposeNote(parseNote('C'), parseInterval('b3')))).toBe('E♭');
    expect(noteName(transposeNote(parseNote('B'), parseInterval('3')))).toBe('D♯');
    expect(noteName(transposeNote(parseNote('Gb'), parseInterval('b5')))).toBe('D𝄫');
  });
});

describe('chord construction', () => {
  const chordNotes = (root: string, typeId: string) =>
    names([...buildChord(parseNote(root), chordTypeById(typeId)).tones.map((tone) => tone.note)]);

  it('spells the examples from the brief', () => {
    expect(chordNotes('A', 'major')).toEqual(['A', 'C♯', 'E']);
    expect(chordNotes('A', 'minor')).toEqual(['A', 'C', 'E']);
    expect(chordNotes('A', 'dominant7')).toEqual(['A', 'C♯', 'E', 'G']);
    expect(chordNotes('A', 'augmented')).toEqual(['A', 'C♯', 'E♯']);
    expect(chordNotes('C', 'minor')).toEqual(['C', 'E♭', 'G']);
  });

  it('spells altered degrees with the right letter rather than the nearest sharp', () => {
    expect(chordNotes('B', 'diminished')).toEqual(['B', 'D', 'F']);
    expect(chordNotes('Eb', 'minor7')).toEqual(['E♭', 'G♭', 'B♭', 'D♭']);
    expect(chordNotes('F#', 'major7')).toEqual(['F♯', 'A♯', 'C♯', 'E♯']);
    expect(chordNotes('Db', 'sus2')).toEqual(['D♭', 'E♭', 'A♭']);
    expect(chordNotes('G', 'sus4')).toEqual(['G', 'C', 'D']);
    expect(chordNotes('Ab', 'augmented')).toEqual(['A♭', 'C', 'E']);
  });

  it('produces symbol, name and pitch classes', () => {
    const chord = buildChord(parseNote('F#'), chordTypeById('minor7'));
    expect(chord.symbol).toBe('F♯m7');
    expect(chord.name).toBe('F♯ minor seventh');
    expect(chordPitchClasses(chord)).toEqual([6, 9, 1, 4]);
  });

  it('defines every chord type with the root as its first degree', () => {
    for (const type of CHORD_TYPES) {
      expect(type.formula[0]).toEqual({ degree: 1, alteration: 0 });
      expect(new Set(type.formula.map((i) => i.degree)).size).toBe(type.formula.length);
    }
  });
});

describe('keys and harmonization', () => {
  it('builds major and natural minor scales with each letter once', () => {
    expect(names(scaleNotes({ tonic: parseNote('A'), mode: 'major' }))).toEqual([
      'A',
      'B',
      'C♯',
      'D',
      'E',
      'F♯',
      'G♯',
    ]);
    expect(names(scaleNotes({ tonic: parseNote('A'), mode: 'minor' }))).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
    ]);
    expect(names(scaleNotes({ tonic: parseNote('Eb'), mode: 'major' }))).toEqual([
      'E♭',
      'F',
      'G',
      'A♭',
      'B♭',
      'C',
      'D',
    ]);
    expect(names(scaleNotes({ tonic: parseNote('F#'), mode: 'major' }))).toEqual([
      'F♯',
      'G♯',
      'A♯',
      'B',
      'C♯',
      'D♯',
      'E♯',
    ]);
  });

  it('harmonizes a major key as I ii iii IV V vi vii°', () => {
    const triads = harmonizeKey({ tonic: parseNote('A'), mode: 'major' });
    expect(triads.map((t) => t.numeral)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
    expect(triads.map((t) => noteName(t.root))).toEqual(['A', 'B', 'C♯', 'D', 'E', 'F♯', 'G♯']);
    expect(triads.map((t) => t.quality)).toEqual([
      'major',
      'minor',
      'minor',
      'major',
      'major',
      'minor',
      'diminished',
    ]);
  });

  it('harmonizes a natural minor key as i ii° III iv v VI VII', () => {
    const triads = harmonizeKey({ tonic: parseNote('A'), mode: 'minor' });
    expect(triads.map((t) => t.numeral)).toEqual(['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']);
    expect(triads.map((t) => noteName(t.root))).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  });
});
