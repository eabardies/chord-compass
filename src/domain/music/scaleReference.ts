import type { Chord } from './chords';
import { intervalLabel, type Interval } from './intervals';
import { scaleNotes } from './keys';
import { noteName, type NoteSpelling } from './notes';

/**
 * Chord formulas are written against the major scale of the chord root, so the major scale is
 * the natural reference for explaining a chord: unchanged degrees are taken as they are,
 * altered degrees (♭3, ♭7, ♯5) are the scale note moved by a semitone. This is a reference
 * for reading formulas, not a claim that the chord belongs to that major key.
 */
export type ScaleDegreeRole = 'unused' | 'chord-tone' | 'altered';

export interface DegreeAlteration {
  readonly interval: Interval;
  /** The chord tone that replaces the scale note, spelled by degree (E♯, not F). */
  readonly note: NoteSpelling;
  readonly direction: 'lowered' | 'raised';
}

export interface ScaleDegreeReference {
  /** 1..7 */
  readonly degree: number;
  readonly scaleNote: NoteSpelling;
  readonly role: ScaleDegreeRole;
  readonly alteration: DegreeAlteration | null;
}

export interface MajorScaleReference {
  readonly root: NoteSpelling;
  readonly degrees: readonly ScaleDegreeReference[];
  /** Plain-language recipe, e.g. "Build Am: lower C♯ to C (♭3). Keep degrees 1 and 5." */
  readonly summary: string;
}

const DEGREES_PER_OCTAVE = 7;

/** Degrees above the octave (9, 11, 13) sit on the same scale step as 2, 4, 6. */
function scaleStep(degree: number): number {
  return ((degree - 1) % DEGREES_PER_OCTAVE) + 1;
}

export function majorScaleReference(chord: Chord): MajorScaleReference {
  const scale = scaleNotes({ tonic: chord.root, mode: 'major' });
  const degrees = scale.map((scaleNote, index): ScaleDegreeReference => {
    const degree = index + 1;
    const tone = chord.tones.find((candidate) => scaleStep(candidate.interval.degree) === degree);
    if (!tone) return { degree, scaleNote, role: 'unused', alteration: null };
    if (tone.interval.alteration === 0) {
      return { degree, scaleNote, role: 'chord-tone', alteration: null };
    }
    return {
      degree,
      scaleNote,
      role: 'altered',
      alteration: {
        interval: tone.interval,
        note: tone.note,
        direction: tone.interval.alteration < 0 ? 'lowered' : 'raised',
      },
    };
  });
  return { root: chord.root, degrees, summary: buildSummary(chord, degrees) };
}

function buildSummary(chord: Chord, degrees: readonly ScaleDegreeReference[]): string {
  const kept = degrees.filter((entry) => entry.role === 'chord-tone').map((entry) => entry.degree);
  const altered = degrees.flatMap((entry) => (entry.alteration ? [entry] : []));
  if (altered.length === 0) {
    return `Build ${chord.symbol}: take degrees ${kept.join(', ')}.`;
  }
  const changes = altered.map((entry) => {
    const alteration = entry.alteration as DegreeAlteration;
    const verb = alteration.direction === 'lowered' ? 'lower' : 'raise';
    return `${verb} ${noteName(entry.scaleNote)} to ${noteName(alteration.note)} (${intervalLabel(alteration.interval)})`;
  });
  const keep =
    kept.length > 0
      ? ` Keep ${kept.length === 1 ? 'degree' : 'degrees'} ${listWithAnd(kept)}.`
      : '';
  return `Build ${chord.symbol}: ${listWithAnd(changes)}.${keep}`;
}

/** "1", "1 and 5", "1, 3, and 5" */
function listWithAnd(items: readonly (string | number)[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
