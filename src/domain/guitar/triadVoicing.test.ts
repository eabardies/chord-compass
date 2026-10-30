import { describe, expect, it } from 'vitest';
import {
  fretSpan,
  fretsSounding,
  GENERATED_MAX_FRET,
  GENERATED_MAX_FRET_SPAN,
  mostCompactCombination,
} from './fretPositioning';
import { describeStringSet, stringSetById, TRIAD_STRING_SETS } from './stringSets';
import { describeTriadVoicing, triadVoicings, voiceTriadInversion } from './triadVoicing';
import { STANDARD_TUNING } from './tuning';
import { soundingPitchClass } from './voicing';
import { CHORD_ROOTS, chordTypeForTriad, LEARNABLE_TRIAD_QUALITIES } from '../../data';
import {
  buildTriad,
  intervalLabel,
  noteName,
  parseNote,
  pitchClassOf,
  TRIAD_INVERSIONS,
  type TriadInversion,
} from '../music';

const set = (id: string) => {
  const found = stringSetById(id);
  if (!found) throw new Error(`missing string set ${id}`);
  return found;
};

const triad = (root: string, quality: 'major' | 'minor') =>
  buildTriad(parseNote(root), chordTypeForTriad(quality));

const voicing = (
  root: string,
  quality: 'major' | 'minor',
  inversion: TriadInversion,
  setId: string,
) => voiceTriadInversion(triad(root, quality), inversion, set(setId), STANDARD_TUNING);

describe('string sets', () => {
  it('lists the treble sets low to high in string index order', () => {
    expect(TRIAD_STRING_SETS.map((candidate) => candidate.id)).toEqual([
      'strings-1-2-3',
      'strings-2-3-4',
      'strings-3-4-5',
    ]);
    expect(set('strings-1-2-3').stringIndexes).toEqual([3, 4, 5]);
    expect(set('strings-2-3-4').stringIndexes).toEqual([2, 3, 4]);
    expect(set('strings-3-4-5').stringIndexes).toEqual([1, 2, 3]);
  });

  it('describes each set with string numbers and open notes, low to high', () => {
    expect(describeStringSet(set('strings-1-2-3'), STANDARD_TUNING)).toBe('3–2–1 · G–B–e');
    expect(describeStringSet(set('strings-2-3-4'), STANDARD_TUNING)).toBe('4–3–2 · D–G–B');
    expect(describeStringSet(set('strings-3-4-5'), STANDARD_TUNING)).toBe('5–4–3 · A–D–G');
  });
});

describe('fret positioning', () => {
  it('finds every fret where a string sounds a pitch class, including the octave', () => {
    const highE = STANDARD_TUNING.strings[5];
    expect(fretsSounding(highE, pitchClassOf(parseNote('E')))).toEqual([0, 12]);
    expect(fretsSounding(highE, pitchClassOf(parseNote('A')))).toEqual([5]);
    expect(fretsSounding(highE, pitchClassOf(parseNote('F')))).toEqual([1, 13]);
    expect(fretsSounding(highE, pitchClassOf(parseNote('E')), 11)).toEqual([0]);
  });

  it('measures span with open strings counted as fret 0', () => {
    expect(fretSpan([2, 2, 0])).toBe(2);
    expect(fretSpan([0, 11, 9])).toBe(11);
    expect(fretSpan([12, 11, 9])).toBe(3);
    expect(fretSpan([])).toBe(0);
  });

  it('prefers the open string when the shape stays compact, and fret 12 when it does not', () => {
    expect(
      mostCompactCombination([
        [0, 12],
        [1, 13],
        [0, 12],
      ])?.frets,
    ).toEqual([0, 1, 0]);
    expect(mostCompactCombination([[0, 12], [11], [9]])?.frets).toEqual([12, 11, 9]);
  });

  it('breaks span ties towards the lower position', () => {
    expect(
      mostCompactCombination([
        [2, 14],
        [2, 14],
        [0, 12],
      ])?.frets,
    ).toEqual([2, 2, 0]);
  });

  it('returns null when a string has no candidate', () => {
    expect(mostCompactCombination([[1], [], [3]])).toBeNull();
  });
});

describe('triad voicings', () => {
  it('matches the A major reference shapes on strings 1–2–3', () => {
    expect(voicing('A', 'major', 'root', 'strings-1-2-3').frets).toEqual([2, 2, 0]);
    expect(voicing('A', 'major', 'first', 'strings-1-2-3').frets).toEqual([6, 5, 5]);
    expect(voicing('A', 'major', 'second', 'strings-1-2-3').frets).toEqual([9, 10, 9]);
    expect(voicing('A', 'major', 'root', 'strings-1-2-3').inverted.noteOrder).toBe('A–C♯–E');
    expect(voicing('A', 'major', 'first', 'strings-1-2-3').inverted.noteOrder).toBe('C♯–E–A');
    expect(voicing('A', 'major', 'second', 'strings-1-2-3').inverted.noteOrder).toBe('E–A–C♯');
    expect(voicing('A', 'major', 'root', 'strings-1-2-3').inverted.degreeOrder).toBe('1–3–5');
    expect(voicing('A', 'major', 'first', 'strings-1-2-3').inverted.degreeOrder).toBe('3–5–1');
    expect(voicing('A', 'major', 'second', 'strings-1-2-3').inverted.degreeOrder).toBe('5–1–3');
  });

  it('matches the A minor reference shapes on strings 1–2–3', () => {
    expect(voicing('A', 'minor', 'root', 'strings-1-2-3').frets).toEqual([2, 1, 0]);
    expect(voicing('A', 'minor', 'first', 'strings-1-2-3').frets).toEqual([5, 5, 5]);
    expect(voicing('A', 'minor', 'second', 'strings-1-2-3').frets).toEqual([9, 10, 8]);
    expect(voicing('A', 'minor', 'root', 'strings-1-2-3').inverted.degreeOrder).toBe('1–♭3–5');
    expect(voicing('A', 'minor', 'first', 'strings-1-2-3').inverted.noteOrder).toBe('C–E–A');
    expect(voicing('A', 'minor', 'second', 'strings-1-2-3').inverted.degreeOrder).toBe('5–1–♭3');
  });

  it('matches the C major reference shapes on strings 1–2–3', () => {
    expect(voicing('C', 'major', 'root', 'strings-1-2-3').frets).toEqual([5, 5, 3]);
    expect(voicing('C', 'major', 'first', 'strings-1-2-3').frets).toEqual([9, 8, 8]);
    expect(voicing('C', 'major', 'second', 'strings-1-2-3').frets).toEqual([0, 1, 0]);
    expect(voicing('C', 'major', 'second', 'strings-1-2-3').inverted.noteOrder).toBe('G–C–E');
  });

  it('uses fret 12 instead of an open string when the open string would be a stretch', () => {
    const shape = voicing('A', 'major', 'root', 'strings-3-4-5');
    expect(shape.frets).toEqual([12, 11, 9]);
    expect(shape.span).toBe(3);
    expect(shape.playable).toBe(true);
  });

  it('reaches past fret 12 for shapes that straddle the octave', () => {
    const shape = voicing('C', 'minor', 'second', 'strings-1-2-3');
    expect(shape.frets).toEqual([12, 13, 11]);
    expect(shape.playable).toBe(true);
  });

  it('flags a voicing whose most compact occurrence still exceeds the span limit', () => {
    const limited = voiceTriadInversion(
      triad('C', 'minor'),
      'second',
      set('strings-1-2-3'),
      STANDARD_TUNING,
      12,
    );
    expect(limited.span).toBeGreaterThan(GENERATED_MAX_FRET_SPAN);
    expect(limited.playable).toBe(false);
    expect(describeTriadVoicing(limited)).toMatch(/wide stretch/);
  });

  it('describes a voicing for screen readers', () => {
    expect(describeTriadVoicing(voicing('A', 'major', 'first', 'strings-1-2-3'))).toBe(
      'A major, first inversion on strings 3, 2, 1: string 3 6th fret C♯ (3), string 2 5th fret E (5), string 1 5th fret A (1).',
    );
    expect(describeTriadVoicing(voicing('A', 'major', 'root', 'strings-1-2-3'))).toMatch(
      /string 1 open E \(5\)\.$/,
    );
  });

  it('gives every root, quality, string set and inversion a playable shape with the right tones', () => {
    for (const root of CHORD_ROOTS) {
      for (const quality of LEARNABLE_TRIAD_QUALITIES) {
        const chord = buildTriad(root.note, chordTypeForTriad(quality));
        for (const stringSet of TRIAD_STRING_SETS) {
          const voicings = triadVoicings(chord, stringSet, STANDARD_TUNING);
          expect(voicings.map((shape) => shape.inverted.inversion)).toEqual(TRIAD_INVERSIONS);
          for (const shape of voicings) {
            const label = `${chord.name} ${shape.inverted.inversion} ${stringSet.id}`;
            expect(shape.playable, `${label}: span ${shape.span}`).toBe(true);
            expect(shape.highestFret, label).toBeLessThanOrEqual(GENERATED_MAX_FRET);
            expect(shape.lowestFret, label).toBeGreaterThanOrEqual(0);
            shape.positions.forEach((position, voice) => {
              // Each string sounds the tone the inversion assigns to that voice.
              const expectedTone = shape.inverted.tones[voice];
              expect(position.tone, label).toBe(expectedTone);
              expect(soundingPitchClass(position.openNote, position.fret), label).toBe(
                expectedTone.pitchClass,
              );
              expect(position.stringIndex).toBe(stringSet.stringIndexes[voice]);
            });
            // The three voices cover root, third and fifth exactly once.
            expect(
              shape.positions.map((position) => intervalLabel(position.tone.interval)).sort(),
            ).toEqual(chord.tones.map((tone) => intervalLabel(tone.interval)).sort());
            expect(shape.positions.map((position) => noteName(position.tone.note))).toEqual(
              shape.inverted.noteOrder.split('–'),
            );
          }
        }
      }
    }
  });
});
