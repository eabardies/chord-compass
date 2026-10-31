import { describe, expect, it } from 'vitest';
import { chordTypeForTriad } from '../../data';
import { FRETBOARD_MAX_FRET, STANDARD_TUNING } from '../../domain/guitar';
import {
  buildTriad,
  harmonizeScale,
  parseNote,
  type ScaleType,
  type Scale,
} from '../../domain/music';
import type { ScaleFretboardPreferences } from '../../components/scaleFretboardModels';
import { buildKeyFretboardModel, keyScaleTones } from './keyFretboardViewModel';

const scaleOf = (tonic: string, type: ScaleType): Scale => ({ tonic: parseNote(tonic), type });

/** The diatonic triad on `degree` of the scale, built the way the tab builds it. */
function chordOn(scale: Scale, degree: number) {
  const diatonic = harmonizeScale(scale)[degree - 1];
  return buildTriad(diatonic.root, chordTypeForTriad(diatonic.quality));
}

const DEFAULTS: ScaleFretboardPreferences = { labelMode: 'degrees', highlightChord: true };

function model(
  tonic: string,
  type: ScaleType,
  degree: number,
  preferences: Partial<ScaleFretboardPreferences> = {},
) {
  const scale = scaleOf(tonic, type);
  return buildKeyFretboardModel(
    scale,
    chordOn(scale, degree),
    { ...DEFAULTS, ...preferences },
    STANDARD_TUNING,
    FRETBOARD_MAX_FRET,
  );
}

/** Distinct labels carrying a given tone, in label order. */
const labels = (built: ReturnType<typeof model>, tone: string) =>
  [...new Set(built.markers.filter((m) => m.tone === tone).map((m) => m.label))].sort();

const keyRootLabels = (built: ReturnType<typeof model>) => [
  ...new Set(built.markers.filter((m) => m.isKeyRoot).map((m) => m.label)),
];

describe('key scale tones', () => {
  it('pairs each scale note with its degree in the selected scale', () => {
    expect(
      keyScaleTones(scaleOf('C', 'natural-minor')).map((t) => `${t.degree}/${t.note}`),
    ).toEqual(['1/C', '2/D', '♭3/E♭', '4/F', '5/G', '♭6/A♭', '♭7/B♭']);
  });
});

describe('key fretboard model', () => {
  it('C major with Dm selected highlights D, F, A as degrees 2, 4, 6', () => {
    const built = model('C', 'major', 2);
    expect(built.title).toBe('C major scale on the fretboard, D minor highlighted');
    expect(labels(built, 'root')).toEqual(['2']);
    expect(labels(built, 'chord')).toEqual(['4', '6']);
    expect(labels(built, 'scale')).toEqual(['1', '3', '5', '7']);
    expect(labels(built, 'altered')).toEqual([]);
    expect(keyRootLabels(built)).toEqual(['1']);
    expect(built.description).toBe(
      'C major scale on the fretboard, frets 0 to 12, high e on top, low E at the bottom. Key root C. Scale notes are C, D, E, F, G, A and B. D minor is highlighted: D, F and A.',
    );
  });

  it('C natural minor with Fm selected highlights F, A♭, C as degrees 4, ♭6, 1', () => {
    const built = model('C', 'natural-minor', 4);
    expect(labels(built, 'root')).toEqual(['4']);
    expect(labels(built, 'chord')).toEqual(['1', '♭6']);
    expect(labels(built, 'scale')).toEqual(['2', '5', '♭3', '♭7']);
    // The key root C is a chord tone here and keeps its key-root outline on the chord marker.
    const keyRoot = built.markers.filter((m) => m.isKeyRoot);
    expect(keyRoot.length).toBeGreaterThan(0);
    expect(keyRoot.every((m) => m.tone === 'chord' && m.label === '1')).toBe(true);

    const notes = model('C', 'natural-minor', 4, { labelMode: 'notes' });
    expect(labels(notes, 'root')).toEqual(['F']);
    expect(labels(notes, 'chord')).toEqual(['A♭', 'C']);
    expect(labels(notes, 'scale')).toEqual(['B♭', 'D', 'E♭', 'G']);

    const both = model('C', 'natural-minor', 4, { labelMode: 'both' });
    expect(labels(both, 'root')).toEqual(['4/F']);
    expect(labels(both, 'chord')).toEqual(['1/C', '♭6/A♭']);
  });

  it('C harmonic minor with G selected highlights G, B, D', () => {
    const built = model('C', 'harmonic-minor', 5, { labelMode: 'notes' });
    expect(built.title).toBe('C harmonic minor scale on the fretboard, G major highlighted');
    expect(labels(built, 'root')).toEqual(['G']);
    expect(labels(built, 'chord')).toEqual(['B', 'D']);
    expect(labels(built, 'scale')).toEqual(['A♭', 'C', 'E♭', 'F']);
    expect(labels(model('C', 'harmonic-minor', 5), 'scale')).toEqual(['1', '4', '♭3', '♭6']);
  });

  it('C melodic minor with E♭aug selected highlights E♭, G, B', () => {
    const built = model('C', 'melodic-minor', 3, { labelMode: 'notes' });
    expect(built.title).toBe(
      'C melodic minor scale on the fretboard, E flat augmented highlighted',
    );
    expect(labels(built, 'root')).toEqual(['E♭']);
    expect(labels(built, 'chord')).toEqual(['B', 'G']);
    expect(labels(built, 'scale')).toEqual(['A', 'C', 'D', 'F']);
    expect(labels(model('C', 'melodic-minor', 3), 'root')).toEqual(['♭3']);
  });

  it('works away from C: E major with C♯m selected, and F♯ major keeps its E♯', () => {
    const e = model('E', 'major', 6, { labelMode: 'both' });
    expect(labels(e, 'root')).toEqual(['6/C♯']);
    expect(labels(e, 'chord')).toEqual(['1/E', '3/G♯']);
    expect(labels(e, 'scale')).toEqual(['2/F♯', '4/A', '5/B', '7/D♯']);
    expect(keyRootLabels(e)).toEqual(['1/E']);

    const fSharp = model('F#', 'major', 7, { labelMode: 'notes' });
    expect(labels(fSharp, 'root')).toEqual(['E♯']);
    expect(labels(fSharp, 'chord')).toEqual(['B', 'G♯']);
  });

  it('without the highlight every note is a plain scale note and the key root keeps its outline', () => {
    const built = model('C', 'natural-minor', 4, { highlightChord: false });
    expect(built.title).toBe('C natural minor scale on the fretboard');
    expect(built.markers.every((m) => m.tone === 'scale')).toBe(true);
    expect(keyRootLabels(built)).toEqual(['1']);
    expect(built.description).not.toContain('highlighted');
  });

  it('covers every string from fret 0 to 12, with fret 12 repeating the open string', () => {
    const built = model('G', 'major', 1);
    expect(built.strings.map((s) => s.name)).toEqual(['low E', 'A', 'D', 'G', 'B', 'high e']);
    for (let stringIndex = 0; stringIndex < 6; stringIndex += 1) {
      const open = built.markers.find((m) => m.stringIndex === stringIndex && m.fret === 0);
      const octave = built.markers.find((m) => m.stringIndex === stringIndex && m.fret === 12);
      expect(open?.label).toBe(octave?.label);
    }
  });
});
