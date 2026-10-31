import { describe, expect, it } from 'vitest';
import { CHORD_ROOTS, KEY_TONICS, ROOT_NOTE_IDS, rootOptionById } from './roots';
import { noteName, parseNote } from '../domain/music';

describe('shared root-note options', () => {
  it('lists all seventeen roots in display order, with stable ids and spoken names', () => {
    expect(CHORD_ROOTS.map((root) => root.label)).toEqual([
      'C',
      'C♯',
      'D♭',
      'D',
      'D♯',
      'E♭',
      'E',
      'F',
      'F♯',
      'G♭',
      'G',
      'G♯',
      'A♭',
      'A',
      'A♯',
      'B♭',
      'B',
    ]);
    expect(ROOT_NOTE_IDS).toHaveLength(17);
    expect(rootOptionById(CHORD_ROOTS, 'Csharp')?.spokenName).toBe('C sharp');
    expect(rootOptionById(CHORD_ROOTS, 'Dflat')?.spokenName).toBe('D flat');
    expect(rootOptionById(CHORD_ROOTS, 'A')?.spokenName).toBe('A');
    expect(CHORD_ROOTS.map((root) => noteName(root.note))).toEqual(
      ROOT_NOTE_IDS.map((id) => noteName(parseNote(id))),
    );
  });

  it('keeps each spelling distinct: C♯ and D♭ are separate options with one pitch class', () => {
    const cSharp = rootOptionById(CHORD_ROOTS, 'Csharp');
    const dFlat = rootOptionById(CHORD_ROOTS, 'Dflat');
    expect(cSharp?.pitchClass).toBe(dFlat?.pitchClass);
    expect(cSharp?.note).toEqual({ letter: 'C', accidental: 1 });
    expect(dFlat?.note).toEqual({ letter: 'D', accidental: -1 });
  });

  it('derives the progression tonics from the shared list rather than a separate array', () => {
    for (const mode of ['major', 'minor'] as const) {
      for (const tonic of KEY_TONICS[mode]) {
        expect(CHORD_ROOTS).toContain(tonic);
      }
      expect(KEY_TONICS[mode]).toHaveLength(13);
    }
    expect(KEY_TONICS.major.map((root) => root.label)).toEqual([
      'C',
      'D♭',
      'D',
      'E♭',
      'E',
      'F',
      'F♯',
      'G♭',
      'G',
      'A♭',
      'A',
      'B♭',
      'B',
    ]);
    expect(KEY_TONICS.minor.map((root) => root.label)).toContain('G♯');
    expect(KEY_TONICS.minor.map((root) => root.label)).not.toContain('A♯');
  });
});
