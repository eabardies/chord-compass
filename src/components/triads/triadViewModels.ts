import {
  describeStringSet,
  describeTriadVoicing,
  openStringName,
  ordinal,
  STRING_COUNT,
  stringInSet,
  stringNumber,
  type GuitarTuning,
  type StringSet,
  type TriadVoicing,
} from '../../domain/guitar';
import { chordToneLabel, noteName } from '../../domain/music';
import type {
  DiagramStringModel,
  FretboardGroupModel,
  MarkerModel,
  TriadDiagramModel,
  TriadFretboardModel,
} from './triadDiagramModels';
import { markerText, type MarkerLabelMode } from './markerLabels';

/**
 * View models for the triad diagrams. Everything musical is computed here from domain
 * values, so the SVG components only place and style what they are given.
 */

const MIN_FRETS_SHOWN = 4;
const FRETBOARD_MIN_FRET = 12;
/** Shapes this close to the nut are drawn from fret 1 so the nut stays in view. */
const NUT_WINDOW_LOWEST_FRET = 2;

/** All six strings, low E first, with the set's strings flagged active. */
export function stringModels(stringSet: StringSet, tuning: GuitarTuning): DiagramStringModel[] {
  return Array.from({ length: STRING_COUNT }, (_, index) => ({
    index,
    number: stringNumber(index),
    name: openStringName(index, tuning),
    active: stringInSet(stringSet, index),
  }));
}

function markerModels(voicing: TriadVoicing, mode: MarkerLabelMode): MarkerModel[] {
  return voicing.positions.map((position) => {
    const where = position.fret === 0 ? 'open' : `${ordinal(position.fret)} fret`;
    const degree = chordToneLabel(position.tone);
    const note = noteName(position.tone.note);
    return {
      id: `${voicing.inverted.inversion}-${position.stringIndex}`,
      stringIndex: position.stringIndex,
      fret: position.fret,
      ...markerText(position.tone, mode),
      degree,
      note,
      isRoot: position.tone.role === 'root',
      accessibleName: `string ${stringNumber(position.stringIndex)}, ${where}, ${note} (${degree})`,
    };
  });
}

export function positionLabel(voicing: TriadVoicing): string {
  const fretted = voicing.frets.filter((fret) => fret > 0);
  if (fretted.length === 0) return 'Open strings';
  if (voicing.lowestFret === 0) return 'Open position';
  return `${ordinal(Math.min(...fretted))} fret`;
}

/** The frets a card diagram shows for a voicing: at least four, from the nut when close to it. */
export function diagramWindow(voicing: TriadVoicing): { startFret: number; fretsShown: number } {
  const startFret = voicing.lowestFret <= NUT_WINDOW_LOWEST_FRET ? 1 : voicing.lowestFret;
  const fretsShown = Math.max(MIN_FRETS_SHOWN, voicing.highestFret - startFret + 1);
  return { startFret, fretsShown };
}

export function inversionDiagramModel(
  voicing: TriadVoicing,
  mode: MarkerLabelMode,
  tuning: GuitarTuning,
): TriadDiagramModel {
  const { startFret, fretsShown } = diagramWindow(voicing);
  const showNut = startFret === 1;
  const strings = voicing.stringSet.stringIndexes.map(stringNumber).join(', ');
  const lastFret = startFret + fretsShown - 1;
  const window = showNut
    ? `the nut on the left, frets 1 to ${lastFret}`
    : `no nut shown, frets ${startFret} to ${lastFret} from the left`;
  const orientation = `Tab view: string 1, the high e, at the top; string 6, the low E, at the bottom; ${window}.`;
  return {
    title: `${voicing.inverted.triad.name}, ${voicing.inverted.name.toLowerCase()} on strings ${strings}`,
    description: `${describeTriadVoicing(voicing)} ${orientation}`,
    startFret,
    fretsShown,
    showNut,
    positionLabel: positionLabel(voicing),
    strings: stringModels(voicing.stringSet, tuning),
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
    strings: stringModels(first.stringSet, tuning),
    groups,
  };
}
