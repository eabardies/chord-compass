import { describe, expect, it } from 'vitest';
import { formatChordSymbol, normalizeChordSymbol, parseChordSymbol } from './chordSymbol';
import { noteName } from './notes';
import { CHORD_TYPES } from '../../data/chordTypes';

const parse = (text: string) => parseChordSymbol(text, CHORD_TYPES);

const parsed = (text: string) => {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" failed: ${result.error.kind}`);
  return {
    root: noteName(result.value.root),
    typeId: result.value.typeId,
    bass: result.value.bass ? noteName(result.value.bass) : null,
  };
};

const failure = (text: string) => {
  const result = parse(text);
  if (result.ok) throw new Error(`"${text}" unexpectedly parsed`);
  return result.error;
};

describe('chord symbol normalization', () => {
  it('trims, removes inner spaces, uppercases note letters and uses musical accidentals', () => {
    expect(normalizeChordSymbol('  c# m7 ')).toBe('C♯m7');
    expect(normalizeChordSymbol('bbmaj7/d')).toBe('B♭maj7/D');
    expect(normalizeChordSymbol('F#m7')).toBe('F♯m7');
    expect(normalizeChordSymbol('C / E')).toBe('C/E');
    expect(normalizeChordSymbol('')).toBe('');
  });

  it('keeps the suffix case because M7 and m7 differ', () => {
    expect(normalizeChordSymbol('CM7')).toBe('CM7');
    expect(normalizeChordSymbol('cm7')).toBe('Cm7');
  });
});

describe('chord symbol parsing', () => {
  it('recognises every supported chord type by its written suffix', () => {
    expect(parsed('C').typeId).toBe('major');
    expect(parsed('Cm').typeId).toBe('minor');
    expect(parsed('C7').typeId).toBe('dominant7');
    expect(parsed('Cmaj7').typeId).toBe('major7');
    expect(parsed('Cm7').typeId).toBe('minor7');
    expect(parsed('Csus2').typeId).toBe('sus2');
    expect(parsed('Csus4').typeId).toBe('sus4');
    expect(parsed('Cdim').typeId).toBe('diminished');
    expect(parsed('Caug').typeId).toBe('augmented');
  });

  it('accepts common alternative suffixes and case differences', () => {
    expect(parsed('Cmin').typeId).toBe('minor');
    expect(parsed('C-7').typeId).toBe('minor7');
    expect(parsed('CM7').typeId).toBe('major7');
    expect(parsed('cMAJ7').typeId).toBe('major7');
    expect(parsed('Csus').typeId).toBe('sus4');
    expect(parsed('C°').typeId).toBe('diminished');
    expect(parsed('C+').typeId).toBe('augmented');
    expect(parsed('CMAJ').typeId).toBe('major');
  });

  it('reads sharps and flats in ASCII and musical notation', () => {
    expect(parsed('F#m7')).toEqual({ root: 'F♯', typeId: 'minor7', bass: null });
    expect(parsed('F♯m7')).toEqual({ root: 'F♯', typeId: 'minor7', bass: null });
    expect(parsed('Bbmaj7/D')).toEqual({ root: 'B♭', typeId: 'major7', bass: 'D' });
    expect(parsed('B♭maj7/D')).toEqual({ root: 'B♭', typeId: 'major7', bass: 'D' });
    expect(parsed('db')).toEqual({ root: 'D♭', typeId: 'major', bass: null });
  });

  it('parses slash basses', () => {
    expect(parsed('C/E')).toEqual({ root: 'C', typeId: 'major', bass: 'E' });
    expect(parsed('C/G').bass).toBe('G');
    expect(parsed('C/B').bass).toBe('B');
    expect(parsed('c/bb').bass).toBe('B♭');
    expect(parsed('Am7/G')).toEqual({ root: 'A', typeId: 'minor7', bass: 'G' });
  });

  it('rejects invalid notation with a specific reason', () => {
    expect(failure('')).toEqual({ kind: 'empty', offending: '' });
    expect(failure('   ')).toEqual({ kind: 'empty', offending: '' });
    expect(failure('H')).toEqual({ kind: 'root', offending: 'H' });
    expect(failure('7')).toEqual({ kind: 'root', offending: '7' });
    expect(failure('Cxyz')).toEqual({ kind: 'quality', offending: 'xyz' });
    expect(failure('Cmaj9')).toEqual({ kind: 'quality', offending: 'maj9' });
    expect(failure('C/X')).toEqual({ kind: 'bass', offending: 'X' });
    expect(failure('C/')).toEqual({ kind: 'bass', offending: '' });
    expect(failure('C/E/G')).toEqual({ kind: 'bass', offending: 'E/G' });
  });

  it('formats a parsed symbol the way the app writes it', () => {
    const result = parse('bbmaj7/d');
    if (!result.ok) throw new Error('expected success');
    expect(formatChordSymbol(result.value, CHORD_TYPES)).toBe('B♭maj7/D');
    const plain = parse('cMIN');
    if (!plain.ok) throw new Error('expected success');
    expect(formatChordSymbol(plain.value, CHORD_TYPES)).toBe('Cm');
  });
});
