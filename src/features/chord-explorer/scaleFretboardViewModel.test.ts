import { describe, expect, it } from 'vitest';
import {
  buildScaleFretboardModel,
  positionLabel,
  positionTone,
  type FretboardLabelMode,
} from './scaleFretboardViewModel';
import { chordTypeById } from '../../data';
import { buildFretboardMap, STANDARD_TUNING } from '../../domain/guitar';
import { buildChord, parseNote } from '../../domain/music';

const chord = (root: string, typeId: string) => buildChord(parseNote(root), chordTypeById(typeId));
const positions = (root: string, typeId: string) =>
  buildFretboardMap(chord(root, typeId), STANDARD_TUNING);
const model = (
  root: string,
  typeId: string,
  highlightChord = true,
  labelMode: FretboardLabelMode = 'degrees',
) =>
  buildScaleFretboardModel(
    chord(root, typeId),
    positions(root, typeId),
    { labelMode, highlightChord },
    STANDARD_TUNING,
    12,
  );

describe('marker labels', () => {
  it('formats degrees, notes and both for scale tones', () => {
    const third = positions('A', 'major').find((p) => p.stringIndex === 4 && p.fret === 2)!;
    expect(positionLabel(third, 'degrees')).toBe('3');
    expect(positionLabel(third, 'notes')).toBe('C♯');
    expect(positionLabel(third, 'both')).toBe('3/C♯');
  });

  it('uses the chord-formula degree for altered tones', () => {
    const flatThird = positions('A', 'minor').find((p) => p.isAlteredChordTone)!;
    expect(positionLabel(flatThird, 'degrees')).toBe('♭3');
    expect(positionLabel(flatThird, 'both')).toBe('♭3/C');
    const sharpFifth = positions('A', 'augmented').find((p) => p.isAlteredChordTone)!;
    expect(positionLabel(sharpFifth, 'both')).toBe('♯5/E♯');
    const flatSeventh = positions('A', 'dominant7').find((p) => p.isAlteredChordTone)!;
    expect(positionLabel(flatSeventh, 'both')).toBe('♭7/G');
  });
});

describe('marker tones', () => {
  it('classifies root, chord, scale and altered positions when highlighting', () => {
    const am = positions('A', 'minor');
    const tones = new Map(am.map((p) => [`${p.stringIndex}:${p.fret}`, positionTone(p, true)]));
    expect(tones.get('1:0')).toBe('root'); // open A
    expect(tones.get('5:0')).toBe('chord'); // open high E, the fifth
    expect(tones.get('4:1')).toBe('altered'); // C on the B string
    expect(tones.get('4:2')).toBe('scale'); // C♯, scale degree 3, not in Am
    expect(tones.get('4:3')).toBe('scale'); // D
    expect(tones.get('5:1')).toBeNull(); // F, neither
  });

  it('keeps only the root and scale notes when highlighting is off', () => {
    const am = positions('A', 'minor');
    const tones = am.map((p) => positionTone(p, false));
    expect(new Set(tones)).toEqual(new Set(['root', 'scale', null]));
    expect(tones.filter((tone) => tone === 'root')).toHaveLength(7);
  });
});

describe('fretboard model', () => {
  it('describes A major for assistive technology', () => {
    const result = model('A', 'major');
    expect(result.title).toBe('A major scale on the fretboard, A major highlighted');
    expect(result.description).toBe(
      'Frets 0 to 12, high e on top, low E at the bottom. Root A. Chord tones 3/C♯, 5/E. Other scale notes 2/B, 4/D, 6/F♯, 7/G♯.',
    );
    expect(result.strings.map((string) => string.name)).toEqual([
      'low E',
      'A',
      'D',
      'G',
      'B',
      'high e',
    ]);
    expect(result.markers.filter((marker) => marker.tone === 'root')).toHaveLength(7);
    expect(result.markers.some((marker) => marker.tone === 'altered')).toBe(false);
  });

  it('adds altered markers for Am7 and drops them when highlighting is off', () => {
    const on = model('A', 'minor7');
    expect(on.description).toContain('Altered chord tones ♭3/C, ♭7/G.');
    expect(on.markers.filter((marker) => marker.tone === 'altered').length).toBeGreaterThan(0);
    const off = model('A', 'minor7', false);
    expect(off.title).toBe('A major scale on the fretboard');
    expect(off.description).toBe(
      'Frets 0 to 12, high e on top, low E at the bottom. Root A. Scale notes 2/B, 3/C♯, 4/D, 5/E, 6/F♯, 7/G♯.',
    );
    expect(off.markers.some((marker) => marker.tone === 'altered' || marker.tone === 'chord')).toBe(
      false,
    );
    // Scale positions are unchanged either way.
    expect(off.markers.filter((m) => m.tone !== 'altered').length).toBe(
      on.markers.filter((m) => m.tone !== 'altered').length,
    );
  });

  it('prints note labels when asked', () => {
    const notes = model('Bb', 'major', true, 'notes');
    expect(new Set(notes.markers.map((marker) => marker.label))).toEqual(
      new Set(['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A']),
    );
  });
});
