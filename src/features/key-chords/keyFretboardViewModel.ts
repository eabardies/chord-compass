import type {
  ScaleFretboardModel,
  ScaleFretboardStringModel,
  ScaleMarkerModel,
  ScaleMarkerTone,
} from '../../components/scaleFretboardModels';
import { frettedPitchClass, stringNumber, type GuitarTuning } from '../../domain/guitar';
import {
  intervalLabel,
  noteName,
  pitchClassOf,
  SCALE_FORMULAS,
  scaleName,
  scaleNotesOf,
  type Scale,
  type Triad,
} from '../../domain/music';

/**
 * The selected scale across the neck with the chosen diatonic chord highlighted. Unlike the
 * explorer's fretboard, which maps the chord root's major scale, this one maps the key's own
 * scale, so every marker is a scale tone and the chord sits inside it: root, chord tone, or
 * other scale note. Labels are "degree/note", degrees from the scale formula (♭3, ♭6, 7).
 */

const STRING_NAMES: Record<number, string> = {
  6: 'low E',
  5: 'A',
  4: 'D',
  3: 'G',
  2: 'B',
  1: 'high e',
};

export function buildKeyFretboardModel(
  scale: Scale,
  chord: Triad,
  tuning: GuitarTuning,
  maxFret: number,
): ScaleFretboardModel {
  const degrees = SCALE_FORMULAS[scale.type].map(intervalLabel);
  const notes = scaleNotesOf(scale);
  const byPitchClass = new Map(
    notes.map((note, index) => [pitchClassOf(note), { note, degree: degrees[index] }]),
  );
  const chordPitchClasses = new Set(chord.tones.map((tone) => tone.pitchClass));
  const rootPitchClass = pitchClassOf(chord.root);
  const tone = (pitchClass: number): ScaleMarkerTone => {
    if (pitchClass === rootPitchClass) return 'root';
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
        label: `${scaleTone.degree}/${noteName(scaleTone.note)}`,
        tone: tone(pitchClass),
      });
    }
  });

  const strings: ScaleFretboardStringModel[] = tuning.strings.map((open, index) => ({
    index,
    number: stringNumber(index),
    name: STRING_NAMES[stringNumber(index)] ?? noteName(open),
  }));
  const chordTones = chord.tones
    .filter((t) => t.role !== 'root')
    .map((t) => noteName(t.note))
    .join(', ');
  const others = notes
    .filter((note) => !chordPitchClasses.has(pitchClassOf(note)))
    .map(noteName)
    .join(', ');
  return {
    title: `${scaleName(scale)} on the fretboard, ${chord.name} highlighted`,
    description: `Frets 0 to ${maxFret}, high e on top, low E at the bottom. Root ${noteName(chord.root)}. Chord tones ${chordTones}. Other scale notes ${others}.`,
    maxFret,
    strings,
    markers,
  };
}
