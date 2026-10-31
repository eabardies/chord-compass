import type {
  FretboardLabelMode,
  ScaleFretboardModel,
  ScaleFretboardPreferences,
  ScaleFretboardStringModel,
  ScaleMarkerModel,
  ScaleMarkerTone,
} from '../../components/scaleFretboardModels';
import {
  STRING_COUNT,
  stringNumber,
  type FretboardPosition,
  type GuitarTuning,
} from '../../domain/guitar';
import { intervalLabel, noteName, type Chord } from '../../domain/music';

// The label mode and preferences are the shared fretboard contract; re-exported for callers.
export { FRETBOARD_LABEL_MODES } from '../../components/scaleFretboardModels';
export type { FretboardLabelMode, ScaleFretboardPreferences };

const STRING_NAMES: Record<number, string> = {
  6: 'low E',
  5: 'A',
  4: 'D',
  3: 'G',
  2: 'B',
  1: 'high e',
};

/**
 * The degree a marker prints: the major-scale degree for scale tones, the chord-formula
 * degree (♭3, ♭7, ♯5) for altered chord tones. A chord tone inside the scale shows its scale
 * degree, which equals its formula degree.
 */
export function positionDegreeLabel(position: FretboardPosition): string {
  if (position.scaleDegree !== null) return String(position.scaleDegree);
  if (position.chordDegree !== null) return intervalLabel(position.chordDegree);
  return '';
}

/** "3", "C♯" or "3/C♯"; "♭3/C" for an altered tone. */
export function positionLabel(position: FretboardPosition, mode: FretboardLabelMode): string {
  const degree = positionDegreeLabel(position);
  const note = position.note ? noteName(position.note) : '';
  switch (mode) {
    case 'degrees':
      return degree;
    case 'notes':
      return note;
    case 'both':
      return `${degree}/${note}`;
  }
}

/** Which marker a position gets, or null when it is not shown at all. */
export function positionTone(
  position: FretboardPosition,
  highlightChord: boolean,
): ScaleMarkerTone | null {
  if (position.isRoot) return 'root';
  if (highlightChord && position.isAlteredChordTone) return 'altered';
  if (!position.isScaleTone) return null;
  if (highlightChord && position.isChordTone) return 'chord';
  return 'scale';
}

export function buildScaleFretboardModel(
  chord: Chord,
  positions: readonly FretboardPosition[],
  preferences: ScaleFretboardPreferences,
  tuning: GuitarTuning,
  maxFret: number,
): ScaleFretboardModel {
  const markers = positions.flatMap((position): ScaleMarkerModel[] => {
    const tone = positionTone(position, preferences.highlightChord);
    if (tone === null) return [];
    return [
      {
        id: `${position.stringIndex}-${position.fret}`,
        stringIndex: position.stringIndex,
        fret: position.fret,
        label: positionLabel(position, preferences.labelMode),
        tone,
      },
    ];
  });
  const strings: ScaleFretboardStringModel[] = tuning.strings.map((_, index) => ({
    index,
    number: stringNumber(index),
    name: STRING_NAMES[stringNumber(index)] ?? noteName(tuning.strings[index]),
  }));
  if (strings.length !== STRING_COUNT) throw new Error('Scale fretboard expects six strings');

  const rootName = noteName(chord.root);
  const title = preferences.highlightChord
    ? `${rootName} major scale on the fretboard, ${chord.name} highlighted`
    : `${rootName} major scale on the fretboard`;
  return {
    title,
    description: describeMarkers(chord, positions, preferences.highlightChord, maxFret),
    maxFret,
    strings,
    markers,
  };
}

/** One sentence per marker category, naming the distinct notes rather than every position. */
function describeMarkers(
  chord: Chord,
  positions: readonly FretboardPosition[],
  highlightChord: boolean,
  maxFret: number,
): string {
  // Distinct notes in degree order, so the sentence reads 2/B, 3/C♯ rather than fretboard order.
  const degreeOrder = (position: FretboardPosition) =>
    (position.scaleDegree ?? position.chordDegree?.degree ?? 0) +
    (position.chordDegree?.alteration ?? 0) / 10;
  const names = (filter: (position: FretboardPosition) => boolean) => [
    ...new Set(
      [...positions]
        .filter(filter)
        .sort((a, b) => degreeOrder(a) - degreeOrder(b))
        .map((position) => positionLabel(position, 'both')),
    ),
  ];
  const rootName = noteName(chord.root);
  const parts = [`Frets 0 to ${maxFret}, high e on top, low E at the bottom.`, `Root ${rootName}.`];
  if (highlightChord) {
    const chordTones = names((p) => p.isChordTone && p.isScaleTone && !p.isRoot);
    const others = names((p) => p.isScaleTone && !p.isChordTone);
    const altered = names((p) => p.isAlteredChordTone);
    if (chordTones.length > 0) parts.push(`Chord tones ${chordTones.join(', ')}.`);
    if (others.length > 0) parts.push(`Other scale notes ${others.join(', ')}.`);
    if (altered.length > 0) parts.push(`Altered chord tones ${altered.join(', ')}.`);
  } else {
    const others = names((p) => p.isScaleTone && !p.isRoot);
    parts.push(`Scale notes ${others.join(', ')}.`);
  }
  return parts.join(' ');
}
