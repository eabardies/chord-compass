import { noteName } from '../music';
import { stringNumber } from './tuning';
import { ordinal, type VoicedShape } from './voicing';

/**
 * Plain-language description of a shape for screen readers and for anyone who prefers text
 * over a diagram, e.g. "A major, open position: string 6 muted, string 5 open (A), ...".
 */
export function describeShape(shape: VoicedShape): string {
  const parts = shape.strings.map((string) => {
    const label = `string ${stringNumber(string.index)}`;
    if (string.fret === null) return `${label} muted`;
    if (string.fret === 0) return `${label} open (${noteName(string.openNote)})`;
    const finger = string.finger ? `, finger ${string.finger}` : '';
    const note = string.tone ? noteName(string.tone.note) : '';
    return `${label} ${ordinal(string.fret)} fret${finger} (${note})`;
  });
  const barres = shape.barres.map(
    (barre) =>
      `Barre with finger ${barre.finger} across strings ${stringNumber(barre.fromString)} to ${stringNumber(barre.toString)} at the ${ordinal(barre.fret)} fret.`,
  );
  return [
    `${shape.chord.name}, ${shape.positionLabel.toLowerCase()}: ${parts.join(', ')}.`,
    ...barres,
  ].join(' ');
}

/** Sounding notes low to high, with "x" for muted strings: "x A E A C♯ E". */
export function shapeNoteNames(shape: VoicedShape): string[] {
  return shape.strings.map((string) => (string.tone ? noteName(string.tone.note) : 'x'));
}
