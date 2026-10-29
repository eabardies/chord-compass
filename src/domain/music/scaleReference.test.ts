import { describe, expect, it } from 'vitest';
import { buildChord } from './chords';
import { noteName, parseNote } from './notes';
import { majorScaleReference } from './scaleReference';
import { chordTypeById } from '../../data/chordTypes';

const reference = (root: string, typeId: string) =>
  majorScaleReference(buildChord(parseNote(root), chordTypeById(typeId)));

const cells = (root: string, typeId: string) =>
  reference(root, typeId).degrees.map((entry) => ({
    degree: entry.degree,
    note: noteName(entry.scaleNote),
    role: entry.role,
    altered: entry.alteration ? noteName(entry.alteration.note) : null,
  }));

describe('major scale reference', () => {
  it('lists the seven major-scale notes of the root with correct spelling', () => {
    expect(reference('A', 'major').degrees.map((entry) => noteName(entry.scaleNote))).toEqual([
      'A',
      'B',
      'C♯',
      'D',
      'E',
      'F♯',
      'G♯',
    ]);
    expect(reference('Eb', 'major').degrees.map((entry) => noteName(entry.scaleNote))).toEqual([
      'E♭',
      'F',
      'G',
      'A♭',
      'B♭',
      'C',
      'D',
    ]);
    expect(reference('A', 'major').degrees.map((entry) => entry.degree)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  it('marks unchanged chord tones for A major and keeps the scale notes', () => {
    expect(cells('A', 'major').map((cell) => cell.role)).toEqual([
      'chord-tone',
      'unused',
      'chord-tone',
      'unused',
      'chord-tone',
      'unused',
      'unused',
    ]);
    expect(reference('A', 'major').summary).toBe('Build A: take degrees 1, 3, 5.');
  });

  it('shows the lowered third of A minor next to the retained C♯', () => {
    const third = cells('A', 'minor')[2];
    expect(third).toEqual({ degree: 3, note: 'C♯', role: 'altered', altered: 'C' });
    expect(reference('A', 'minor').summary).toBe(
      'Build Am: lower C♯ to C (♭3). Keep degrees 1 and 5.',
    );
  });

  it('shows the flat seventh of A7', () => {
    const seventh = cells('A', 'dominant7')[6];
    expect(seventh).toEqual({ degree: 7, note: 'G♯', role: 'altered', altered: 'G' });
    expect(reference('A', 'dominant7').summary).toBe(
      'Build A7: lower G♯ to G (♭7). Keep degrees 1, 3, and 5.',
    );
  });

  it('shows both alterations of Am7', () => {
    const altered = cells('A', 'minor7').filter((cell) => cell.role === 'altered');
    expect(altered).toEqual([
      { degree: 3, note: 'C♯', role: 'altered', altered: 'C' },
      { degree: 7, note: 'G♯', role: 'altered', altered: 'G' },
    ]);
    expect(reference('A', 'minor7').summary).toBe(
      'Build Am7: lower C♯ to C (♭3) and lower G♯ to G (♭7). Keep degrees 1 and 5.',
    );
  });

  it('raises the fifth of an augmented chord to E♯, not F', () => {
    const fifth = reference('A', 'augmented').degrees[4];
    expect(fifth.alteration).toMatchObject({ direction: 'raised' });
    expect(noteName(fifth.alteration?.note as never)).toBe('E♯');
    expect(reference('A', 'augmented').summary).toBe(
      'Build Aaug: raise E to E♯ (♯5). Keep degrees 1 and 3.',
    );
  });

  it('spells C minor as lowering E to E♭', () => {
    expect(reference('C', 'minor').summary).toBe(
      'Build Cm: lower E to E♭ (♭3). Keep degrees 1 and 5.',
    );
  });

  it('handles suspended and diminished formulas', () => {
    expect(cells('G', 'sus4').map((cell) => cell.role)).toEqual([
      'chord-tone',
      'unused',
      'unused',
      'chord-tone',
      'chord-tone',
      'unused',
      'unused',
    ]);
    expect(reference('B', 'diminished').summary).toBe(
      'Build Bdim: lower D♯ to D (♭3) and lower F♯ to F (♭5). Keep degree 1.',
    );
  });
});
