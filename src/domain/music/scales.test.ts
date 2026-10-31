import { describe, expect, it } from 'vitest';
import { chordTypeForTriad } from '../../data';
import {
  harmonizeKey,
  harmonizeScale,
  scaleDegreeLabels,
  scaleName,
  scaleNotes,
  scaleNotesOf,
  SCALE_TYPES,
  type ScaleType,
} from './keys';
import { noteName, parseNote } from './notes';
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
