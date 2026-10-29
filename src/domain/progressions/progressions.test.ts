import { describe, expect, it } from 'vitest';
import { instantiateProgression, templateName } from './index';
import { CHORD_TYPE_CATALOG, PROGRESSION_TEMPLATES, TWELVE_BAR_BLUES } from '../../data';
import { parseNote } from '../music';

const template = (id: string) => {
  const found = PROGRESSION_TEMPLATES.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`missing template ${id}`);
  return found;
};

const chordSymbols = (templateId: string, tonic: string, mode: 'major' | 'minor') =>
  instantiateProgression(
    template(templateId),
    { tonic: parseNote(tonic), mode },
    CHORD_TYPE_CATALOG,
  ).chords.map((entry) => entry.chord.symbol);

describe('progression templates', () => {
  it('names templates from their numerals', () => {
    expect(templateName(template('major-1-4-5'))).toBe('I–IV–V');
    expect(templateName(template('major-1-5-6-4'))).toBe('I–V–vi–IV');
    expect(templateName(template('major-6-4-1-5'))).toBe('vi–IV–I–V');
    expect(templateName(template('major-2-5-1'))).toBe('ii–V–I');
    expect(templateName(template('minor-1-6-3-7'))).toBe('i–VI–III–VII');
    expect(templateName(template('minor-1-4-5'))).toBe('i–iv–v');
    expect(templateName(TWELVE_BAR_BLUES)).toBe('I7–I7–I7–I7–IV7–IV7–I7–I7–V7–IV7–I7–V7');
  });
});

describe('progression transposition', () => {
  it('matches the examples in A major', () => {
    expect(chordSymbols('major-1-4-5', 'A', 'major')).toEqual(['A', 'D', 'E']);
    expect(chordSymbols('major-1-5-6-4', 'A', 'major')).toEqual(['A', 'E', 'F♯m', 'D']);
    expect(chordSymbols('major-2-5-1', 'A', 'major')).toEqual(['Bm', 'E', 'A']);
  });

  it('transposes to other keys with correct spelling', () => {
    expect(chordSymbols('major-1-5-6-4', 'Eb', 'major')).toEqual(['E♭', 'B♭', 'Cm', 'A♭']);
    expect(chordSymbols('major-6-4-1-5', 'G', 'major')).toEqual(['Em', 'C', 'G', 'D']);
    expect(chordSymbols('major-2-5-1', 'F#', 'major')).toEqual(['G♯m', 'C♯', 'F♯']);
  });

  it('builds natural minor progressions', () => {
    expect(chordSymbols('minor-1-6-3-7', 'A', 'minor')).toEqual(['Am', 'F', 'C', 'G']);
    expect(chordSymbols('minor-1-4-5', 'E', 'minor')).toEqual(['Em', 'Am', 'Bm']);
    expect(chordSymbols('minor-1-6-3-7', 'C', 'minor')).toEqual(['Cm', 'A♭', 'E♭', 'B♭']);
  });

  it('uses dominant sevenths on every bar of the blues', () => {
    const blues = instantiateProgression(
      TWELVE_BAR_BLUES,
      { tonic: parseNote('A'), mode: 'major' },
      CHORD_TYPE_CATALOG,
    );
    expect(blues.chords).toHaveLength(12);
    expect(blues.chords.map((entry) => entry.chord.symbol)).toEqual([
      'A7',
      'A7',
      'A7',
      'A7',
      'D7',
      'D7',
      'A7',
      'A7',
      'E7',
      'D7',
      'A7',
      'E7',
    ]);
    expect(blues.chords.map((entry) => entry.numeral).slice(0, 5)).toEqual([
      'I7',
      'I7',
      'I7',
      'I7',
      'IV7',
    ]);
  });
});
