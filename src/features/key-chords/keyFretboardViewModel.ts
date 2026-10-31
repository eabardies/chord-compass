import type {
  FretboardLabelMode,
  ScaleFretboardModel,
  ScaleFretboardPreferences,
  ScaleFretboardStringModel,
  ScaleMarkerModel,
  ScaleMarkerTone,
} from '../../components/scaleFretboardModels';
import { frettedPitchClass, stringNumber, type GuitarTuning } from '../../domain/guitar';
import {
  noteName,
  pitchClassOf,
  scaleDegreeLabels,
  scaleName,
  scaleNotesOf,
  type Scale,
  type Triad,
} from '../../domain/music';

/**
 * The selected scale across the neck with the chosen diatonic chord highlighted. Unlike the
 * explorer's fretboard, which maps the chord root's major reference scale, this one maps the
 * key's own scale, so every marker is a scale tone and the chord sits inside it. Degree labels
 * are degrees of the key (Fm in C minor reads 4, ♭6, 1), never chord-tone roles; those belong
 * to the chord summary and the triad cards. The key root keeps a heavy outline so it stays
 * recognisable while another chord is highlighted.
 */

const STRING_NAMES: Record<number, string> = {
  6: 'low E',
  5: 'A',
  4: 'D',
  3: 'G',
  2: 'B',
  1: 'high e',
};

export interface KeyScaleTone {
  readonly note: string;
  readonly degree: string;
  readonly pitchClass: number;
}

/** The scale as the fretboard labels it: note name and formula degree per pitch class. */
export function keyScaleTones(scale: Scale): KeyScaleTone[] {
  const degrees = scaleDegreeLabels(scale.type);
  return scaleNotesOf(scale).map((note, index) => ({
    note: noteName(note),
    degree: degrees[index],
    pitchClass: pitchClassOf(note),
  }));
}

export function keyMarkerLabel(tone: KeyScaleTone, mode: FretboardLabelMode): string {
  switch (mode) {
    case 'degrees':
      return tone.degree;
    case 'notes':
      return tone.note;
    case 'both':
      return `${tone.degree}/${tone.note}`;
  }
}

export function buildKeyFretboardModel(
  scale: Scale,
  chord: Triad,
  preferences: ScaleFretboardPreferences,
  tuning: GuitarTuning,
  maxFret: number,
): ScaleFretboardModel {
  const tones = keyScaleTones(scale);
  const byPitchClass = new Map(tones.map((tone) => [tone.pitchClass, tone]));
  const chordPitchClasses = new Set(chord.tones.map((tone) => tone.pitchClass));
  const chordRoot = pitchClassOf(chord.root);
  const keyRoot = pitchClassOf(scale.tonic);
  const toneOf = (pitchClass: number): ScaleMarkerTone => {
    if (!preferences.highlightChord) return 'scale';
    if (pitchClass === chordRoot) return 'root';
    if (chordPitchClasses.has(pitchClass)) return 'chord';
    return 'scale';
  };

  const markers: ScaleMarkerModel[] = [];
  tuning.strings.forEach((openNote, stringIndex) => {
    for (let fret = 0; fret <= maxFret; fret += 1) {
      const pitchClass = frettedPitchClass(openNote, fret);
      const scaleTone = byPitchClass.get(pitchClass);
      if (!scaleTone) continue;
      markers.push({
        id: `${stringIndex}-${fret}`,
        stringIndex,
        fret,
        label: keyMarkerLabel(scaleTone, preferences.labelMode),
        tone: toneOf(pitchClass),
        isKeyRoot: pitchClass === keyRoot,
      });
    }
  });

  const strings: ScaleFretboardStringModel[] = tuning.strings.map((open, index) => ({
    index,
    number: stringNumber(index),
    name: STRING_NAMES[stringNumber(index)] ?? noteName(open),
  }));

  const name = scaleName(scale);
  const scaleList = listNames(tones.map((tone) => tone.note));
  const title = preferences.highlightChord
    ? `${name} scale on the fretboard, ${chord.name} highlighted`
    : `${name} scale on the fretboard`;
  const chordSentence = preferences.highlightChord
    ? ` ${chord.name} is highlighted: ${listNames(chord.tones.map((t) => noteName(t.note)))}.`
    : '';
  return {
    title,
    description: `${name} scale on the fretboard, frets 0 to ${maxFret}, high e on top, low E at the bottom. Key root ${noteName(scale.tonic)}. Scale notes are ${scaleList}.${chordSentence}`,
    maxFret,
    strings,
    markers,
  };
}

/** "C, D, E♭ and F" */
function listNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
