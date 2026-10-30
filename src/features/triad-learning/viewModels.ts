import {
  describeStringSet,
  describeTriadVoicing,
  ordinal,
  STRING_COUNT,
  stringNumber,
  type GuitarTuning,
  type TriadVoicing,
} from '../../domain/guitar';
import type {
  DiagramStringModel,
  FretboardGroupModel,
  MarkerModel,
  TriadDiagramModel,
  TriadFretboardModel,
} from '../../components/triadDiagramModels';
import { intervalLabel, noteName } from '../../domain/music';
import { markerLabel, type MarkerLabelMode } from './markerLabels';

/**
 * View models for the triad diagrams. Everything musical is computed here from domain
 * values, so the SVG components only place and style what they are given.
 */

const MIN_FRETS_SHOWN = 4;
const FRETBOARD_MIN_FRET = 12;

function stringModels(voicing: TriadVoicing, tuning: GuitarTuning): DiagramStringModel[] {
  return voicing.stringSet.stringIndexes.map((index, voice) => ({
    voice,
    number: stringNumber(index),
    name:
      index === STRING_COUNT - 1
        ? noteName(tuning.strings[index]).toLowerCase()
        : noteName(tuning.strings[index]),
  }));
}

function markerModels(voicing: TriadVoicing, mode: MarkerLabelMode): MarkerModel[] {
  return voicing.positions.map((position, voice) => {
    const where = position.fret === 0 ? 'open' : `${ordinal(position.fret)} fret`;
    return {
      id: `${voicing.inverted.inversion}-${position.stringIndex}`,
      voice,
      fret: position.fret,
      label: markerLabel(position.tone, mode),
      isRoot: position.tone.role === 'root',
      accessibleName: `string ${stringNumber(position.stringIndex)}, ${where}, ${noteName(position.tone.note)} (${intervalLabel(position.tone.interval)})`,
    };
  });
}

export function positionLabel(voicing: TriadVoicing): string {
  const fretted = voicing.frets.filter((fret) => fret > 0);
  if (fretted.length === 0) return 'Open strings';
  if (voicing.lowestFret === 0) return 'Open position';
  return `${ordinal(Math.min(...fretted))} fret`;
}

export function inversionDiagramModel(
  voicing: TriadVoicing,
  mode: MarkerLabelMode,
  tuning: GuitarTuning,
): TriadDiagramModel {
  // Shapes at or near the nut are drawn from fret 1 so the nut stays visible.
  const startFret = voicing.lowestFret <= 2 ? 1 : voicing.lowestFret;
  const fretsShown = Math.max(MIN_FRETS_SHOWN, voicing.highestFret - startFret + 1);
  const strings = voicing.stringSet.stringIndexes.map(stringNumber).join(', ');
  return {
    title: `${voicing.inverted.triad.name}, ${voicing.inverted.name.toLowerCase()} on strings ${strings}`,
    description: describeTriadVoicing(voicing),
    startFret,
    fretsShown,
    positionLabel: positionLabel(voicing),
    strings: stringModels(voicing, tuning),
    markers: markerModels(voicing, mode),
  };
}

export function fretboardModel(
  voicings: readonly TriadVoicing[],
  mode: MarkerLabelMode,
  tuning: GuitarTuning,
): TriadFretboardModel {
  const [first] = voicings;
  if (!first) throw new Error('A fretboard needs at least one voicing');
  const groups = voicings.map((voicing): FretboardGroupModel => ({
    id: voicing.inverted.inversion,
    label: voicing.inverted.name,
    lowestFret: voicing.lowestFret,
    highestFret: voicing.highestFret,
    playable: voicing.playable,
    markers: markerModels(voicing, mode),
  }));
  const maxFret = Math.max(FRETBOARD_MIN_FRET, ...groups.map((group) => group.highestFret));
  const setDescription = describeStringSet(first.stringSet, tuning);
  const placements = voicings.map(
    (voicing) => `${voicing.inverted.name.toLowerCase()} at frets ${voicing.frets.join('–')}`,
  );
  return {
    title: `${first.inverted.triad.name} across the fretboard on strings ${setDescription}`,
    description: `Frets 0 to ${maxFret}, strings ${setDescription} low to high: ${placements.join('; ')}.`,
    maxFret,
    strings: stringModels(first, tuning),
    groups,
  };
}
