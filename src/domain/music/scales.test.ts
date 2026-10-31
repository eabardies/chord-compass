import { describe, expect, it } from 'vitest';
import { chordTypeForTriad, ROOT_NOTE_IDS } from '../../data';
import {
  harmonizeKey,
  harmonizeScale,
  scaleDegreeLabels,
  scaleHasDoubleAccidentals,
  scaleName,
  scaleNotes,
  scaleNotesOf,
  SCALE_TYPES,
  simplerEnharmonicTonic,
  type ScaleType,
} from './keys';
import { noteName, parseNote, spokenNoteName } from './notes';
import { buildTriad } from './triads';

const notes = (tonic: string, type: ScaleType) =>
  scaleNotesOf({ tonic: parseNote(tonic), type }).map(noteName);

const chords = (tonic: string, type: ScaleType) =>
  harmonizeScale({ tonic: parseNote(tonic), type }).map((triad) => ({
    numeral: triad.numeral,
    quality: triad.quality,
    symbol: buildTriad(triad.root, chordTypeForTriad(triad.quality)).symbol,
    notes: [triad.root, triad.third, triad.fifth].map(noteName).join(' '),
  }));

describe('scale construction', () => {
  it('spells the four scale types on C by degree', () => {
    expect(notes('C', 'major')).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    expect(notes('C', 'natural-minor')).toEqual(['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B♭']);
    expect(notes('C', 'harmonic-minor')).toEqual(['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B']);
    expect(notes('C', 'melodic-minor')).toEqual(['C', 'D', 'E♭', 'F', 'G', 'A', 'B']);
  });

  it('labels the degrees of each formula', () => {
    expect(scaleDegreeLabels('major')).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    expect(scaleDegreeLabels('natural-minor')).toEqual(['1', '2', '♭3', '4', '5', '♭6', '♭7']);
    expect(scaleDegreeLabels('harmonic-minor')).toEqual(['1', '2', '♭3', '4', '5', '♭6', '7']);
    expect(scaleDegreeLabels('melodic-minor')).toEqual(['1', '2', '♭3', '4', '5', '6', '7']);
  });

  it('keeps theoretical spellings instead of enharmonic shortcuts', () => {
    expect(notes('F#', 'major')).toEqual(['F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯']);
    expect(notes('Gb', 'major')).toEqual(['G♭', 'A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F']);
    expect(notes('D#', 'harmonic-minor')).toEqual(['D♯', 'E♯', 'F♯', 'G♯', 'A♯', 'B', 'C𝄪']);
    expect(notes('Eb', 'melodic-minor')).toEqual(['E♭', 'F', 'G♭', 'A♭', 'B♭', 'C', 'D']);
    expect(notes('G#', 'harmonic-minor')).toEqual(['G♯', 'A♯', 'B', 'C♯', 'D♯', 'E', 'F𝄪']);
  });

  it('uses every letter exactly once in every offered scale', () => {
    for (const tonic of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']) {
      for (const type of SCALE_TYPES) {
        const letters = scaleNotesOf({ tonic: parseNote(tonic), type }).map((n) => n.letter);
        expect(new Set(letters).size, `${tonic} ${type}`).toBe(7);
      }
    }
  });

  it('names scales and keeps the key helpers as aliases of the scale helpers', () => {
    expect(scaleName({ tonic: parseNote('C'), type: 'harmonic-minor' })).toBe('C harmonic minor');
    expect(scaleNotes({ tonic: parseNote('A'), mode: 'minor' }).map(noteName)).toEqual(
      notes('A', 'natural-minor'),
    );
    expect(harmonizeKey({ tonic: parseNote('C'), mode: 'major' })).toEqual(
      harmonizeScale({ tonic: parseNote('C'), type: 'major' }),
    );
  });
});

describe('diatonic chords', () => {
  it('harmonizes C major', () => {
    expect(chords('C', 'major')).toEqual([
      { numeral: 'I', quality: 'major', symbol: 'C', notes: 'C E G' },
      { numeral: 'ii', quality: 'minor', symbol: 'Dm', notes: 'D F A' },
      { numeral: 'iii', quality: 'minor', symbol: 'Em', notes: 'E G B' },
      { numeral: 'IV', quality: 'major', symbol: 'F', notes: 'F A C' },
      { numeral: 'V', quality: 'major', symbol: 'G', notes: 'G B D' },
      { numeral: 'vi', quality: 'minor', symbol: 'Am', notes: 'A C E' },
      { numeral: 'vii°', quality: 'diminished', symbol: 'Bdim', notes: 'B D F' },
    ]);
  });

  it('harmonizes C natural minor', () => {
    expect(chords('C', 'natural-minor').map((c) => c.symbol)).toEqual([
      'Cm',
      'Ddim',
      'E♭',
      'Fm',
      'Gm',
      'A♭',
      'B♭',
    ]);
    expect(chords('C', 'natural-minor').map((c) => c.numeral)).toEqual([
      'i',
      'ii°',
      'III',
      'iv',
      'v',
      'VI',
      'VII',
    ]);
    expect(chords('C', 'natural-minor')[2].notes).toBe('E♭ G B♭');
  });

  it('harmonizes C harmonic minor, with an augmented III and a major V', () => {
    const harmonic = chords('C', 'harmonic-minor');
    expect(harmonic.map((c) => c.symbol)).toEqual(['Cm', 'Ddim', 'E♭aug', 'Fm', 'G', 'A♭', 'Bdim']);
    expect(harmonic.map((c) => c.numeral)).toEqual(['i', 'ii°', 'III+', 'iv', 'V', 'VI', 'vii°']);
    expect(harmonic.map((c) => c.quality)).toEqual([
      'minor',
      'diminished',
      'augmented',
      'minor',
      'major',
      'major',
      'diminished',
    ]);
    expect(harmonic[2].notes).toBe('E♭ G B');
    expect(harmonic[4].notes).toBe('G B D');
  });

  it('harmonizes C melodic minor (ascending)', () => {
    const melodic = chords('C', 'melodic-minor');
    expect(melodic.map((c) => c.symbol)).toEqual(['Cm', 'Dm', 'E♭aug', 'F', 'G', 'Adim', 'Bdim']);
    expect(melodic.map((c) => c.numeral)).toEqual(['i', 'ii', 'III+', 'IV', 'V', 'vi°', 'vii°']);
    expect(melodic.map((c) => c.quality)).toEqual([
      'minor',
      'minor',
      'augmented',
      'major',
      'major',
      'diminished',
      'diminished',
    ]);
    expect(melodic[5].notes).toBe('A C E♭');
  });

  it('spells chord tones from the scale, so the built triad matches the harmonized one', () => {
    for (const tonic of ['F#', 'Gb', 'D#', 'G#', 'Eb']) {
      for (const type of SCALE_TYPES) {
        for (const triad of harmonizeScale({ tonic: parseNote(tonic), type })) {
          const built = buildTriad(triad.root, chordTypeForTriad(triad.quality));
          expect(
            built.tones.map((tone) => noteName(tone.note)),
            `${tonic} ${type}`,
          ).toEqual([triad.root, triad.third, triad.fifth].map(noteName));
        }
      }
    }
    expect(chords('F#', 'major')[6]).toMatchObject({ symbol: 'E♯dim', notes: 'E♯ G♯ B' });
    expect(chords('Gb', 'major')[3]).toMatchObject({ symbol: 'C♭', notes: 'C♭ E♭ G♭' });
  });
});

describe('sharp and flat keys keep their theoretical spelling', () => {
  const eachLetterOnce = (names: string[]) => new Set(names.map((n) => n[0])).size === 7;

  it('spells the C♯ scales with E♯ and B♯, never F and C', () => {
    expect(notes('C#', 'major')).toEqual(['C♯', 'D♯', 'E♯', 'F♯', 'G♯', 'A♯', 'B♯']);
    expect(notes('C#', 'natural-minor')).toEqual(['C♯', 'D♯', 'E', 'F♯', 'G♯', 'A', 'B']);
    expect(notes('C#', 'harmonic-minor')).toEqual(['C♯', 'D♯', 'E', 'F♯', 'G♯', 'A', 'B♯']);
    expect(notes('C#', 'melodic-minor')).toEqual(['C♯', 'D♯', 'E', 'F♯', 'G♯', 'A♯', 'B♯']);
    expect(notes('G#', 'natural-minor')).toEqual(['G♯', 'A♯', 'B', 'C♯', 'D♯', 'E', 'F♯']);
  });

  it('uses double sharps for D♯ major and A♯ major instead of respelling', () => {
    expect(notes('D#', 'major')).toEqual(['D♯', 'E♯', 'F𝄪', 'G♯', 'A♯', 'B♯', 'C𝄪']);
    expect(notes('A#', 'major')).toEqual(['A♯', 'B♯', 'C𝄪', 'D♯', 'E♯', 'F𝄪', 'G𝄪']);
    expect(scaleNotesOf({ tonic: parseNote('D#'), type: 'major' })[2]).toEqual({
      letter: 'F',
      accidental: 2,
    });
  });

  it('uses double flats where a flat key demands them', () => {
    expect(notes('Gb', 'harmonic-minor')).toEqual(['G♭', 'A♭', 'B𝄫', 'C♭', 'D♭', 'E𝄫', 'F']);
    expect(notes('Db', 'natural-minor')).toEqual(['D♭', 'E♭', 'F♭', 'G♭', 'A♭', 'B𝄫', 'C♭']);
  });

  it('gives every offered root, in every scale type, seven notes with each letter once', () => {
    for (const tonic of ROOT_NOTE_IDS) {
      for (const type of SCALE_TYPES) {
        const names = notes(tonic, type);
        expect(names, `${tonic} ${type}`).toHaveLength(7);
        expect(eachLetterOnce(names), `${tonic} ${type}: ${names.join(' ')}`).toBe(true);
        expect(() => chords(tonic, type), `${tonic} ${type}`).not.toThrow();
      }
    }
  });

  it('harmonizes the sharp keys with correctly spelled roots and tones', () => {
    expect(chords('C#', 'major').map((c) => `${c.numeral} ${c.symbol} [${c.notes}]`)).toEqual([
      'I C♯ [C♯ E♯ G♯]',
      'ii D♯m [D♯ F♯ A♯]',
      'iii E♯m [E♯ G♯ B♯]',
      'IV F♯ [F♯ A♯ C♯]',
      'V G♯ [G♯ B♯ D♯]',
      'vi A♯m [A♯ C♯ E♯]',
      'vii° B♯dim [B♯ D♯ F♯]',
    ]);
    expect(chords('C#', 'natural-minor').map((c) => c.symbol)).toEqual([
      'C♯m',
      'D♯dim',
      'E',
      'F♯m',
      'G♯m',
      'A',
      'B',
    ]);
    expect(chords('C#', 'natural-minor').map((c) => c.numeral)).toEqual([
      'i',
      'ii°',
      'III',
      'iv',
      'v',
      'VI',
      'VII',
    ]);
    const harmonic = chords('C#', 'harmonic-minor');
    expect(harmonic.map((c) => c.symbol)).toEqual([
      'C♯m',
      'D♯dim',
      'Eaug',
      'F♯m',
      'G♯',
      'A',
      'B♯dim',
    ]);
    expect(harmonic.map((c) => c.numeral)).toEqual(['i', 'ii°', 'III+', 'iv', 'V', 'VI', 'vii°']);
    expect(harmonic[6].notes).toBe('B♯ D♯ F♯');
    expect(chords('C#', 'melodic-minor').map((c) => c.symbol)).toEqual([
      'C♯m',
      'D♯m',
      'Eaug',
      'F♯',
      'G♯',
      'A♯dim',
      'B♯dim',
    ]);
    expect(chords('G#', 'natural-minor').map((c) => c.symbol)).toEqual([
      'G♯m',
      'A♯dim',
      'B',
      'C♯m',
      'D♯m',
      'E',
      'F♯',
    ]);
    const dSharp = chords('D#', 'major');
    expect(dSharp.map((c) => c.symbol)).toEqual(['D♯', 'E♯m', 'F𝄪m', 'G♯', 'A♯', 'B♯m', 'C𝄪dim']);
    expect(dSharp.map((c) => c.quality)).toEqual([
      'major',
      'minor',
      'minor',
      'major',
      'major',
      'minor',
      'diminished',
    ]);
    expect(dSharp[2].notes).toBe('F𝄪 A♯ C𝄪');
    expect(dSharp[6].notes).toBe('C𝄪 E♯ G♯');
    expect(chords('A#', 'major')[6]).toMatchObject({ symbol: 'G𝄪dim', notes: 'G𝄪 B♯ D♯' });
  });

  it('says accidentals out loud for assistive technology', () => {
    expect(spokenNoteName(parseNote('C#'))).toBe('C sharp');
    expect(spokenNoteName(parseNote('Bb'))).toBe('B flat');
    expect(spokenNoteName({ letter: 'F', accidental: 2 })).toBe('F double sharp');
    expect(spokenNoteName({ letter: 'B', accidental: -2 })).toBe('B double flat');
    expect(spokenNoteName(parseNote('A'))).toBe('A');
  });

  it('points uncommon spellings at their common enharmonic key without changing them', () => {
    const roots = ROOT_NOTE_IDS.map((id) => parseNote(id));
    const dSharpMajor = { tonic: parseNote('D#'), type: 'major' as const };
    expect(scaleHasDoubleAccidentals(dSharpMajor)).toBe(true);
    expect(noteName(simplerEnharmonicTonic(dSharpMajor, roots)!)).toBe('E♭');
    const dFlatMinor = { tonic: parseNote('Db'), type: 'natural-minor' as const };
    expect(noteName(simplerEnharmonicTonic(dFlatMinor, roots)!)).toBe('C♯');
    const cMajor = { tonic: parseNote('C'), type: 'major' as const };
    expect(scaleHasDoubleAccidentals(cMajor)).toBe(false);
    expect(simplerEnharmonicTonic(cMajor, roots)).toBeNull();
    // F♯ and G♭ major are equally simple, so neither is "more common" than the other.
    expect(simplerEnharmonicTonic({ tonic: parseNote('F#'), type: 'major' }, roots)).toBeNull();
  });
});
