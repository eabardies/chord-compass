import {
  buildChord,
  harmonizeKey,
  romanNumeral,
  type Chord,
  type ChordTypeDefinition,
  type Key,
  type Mode,
  type TriadQuality,
} from '../music';

/** One chord slot in a template, expressed as a scale degree of the key. */
export interface ProgressionStep {
  readonly degree: number;
  /**
   * Overrides the chord type the key's harmonization would produce. Blues uses this to put
   * dominant sevenths on I, IV and V.
   */
  readonly chordTypeId?: string;
}

export interface ProgressionTemplate {
  readonly id: string;
  readonly mode: Mode;
  /** "diatonic" templates follow the key's harmonization; "blues" deliberately does not. */
  readonly kind: 'diatonic' | 'blues';
  readonly steps: readonly ProgressionStep[];
  readonly description: string;
}

export interface ProgressionChord {
  readonly step: ProgressionStep;
  readonly numeral: string;
  readonly chord: Chord;
}

export interface Progression {
  readonly template: ProgressionTemplate;
  readonly key: Key;
  readonly chords: readonly ProgressionChord[];
}

/** How the progression module finds chord types without depending on the data layer. */
export interface ChordTypeCatalog {
  byId(id: string): ChordTypeDefinition;
  forTriad(quality: TriadQuality): ChordTypeDefinition;
}

/** Numerals for the template itself, e.g. "I–V–vi–IV", derived from the mode's harmonization. */
export function templateNumerals(template: ProgressionTemplate): string[] {
  const triads = harmonizeKey({ tonic: { letter: 'C', accidental: 0 }, mode: template.mode });
  return template.steps.map((step) => stepNumeral(step, triads[step.degree - 1].quality));
}

export function templateName(template: ProgressionTemplate): string {
  return templateNumerals(template).join('–');
}

export function instantiateProgression(
  template: ProgressionTemplate,
  key: Key,
  catalog: ChordTypeCatalog,
): Progression {
  const triads = harmonizeKey(key);
  const chords = template.steps.map((step) => {
    const triad = triads[step.degree - 1];
    if (!triad) throw new Error(`Progression ${template.id} uses invalid degree ${step.degree}`);
    const type = step.chordTypeId
      ? catalog.byId(step.chordTypeId)
      : catalog.forTriad(triad.quality);
    return {
      step,
      numeral: stepNumeral(step, triad.quality),
      chord: buildChord(triad.root, type),
    };
  });
  return { template, key, chords };
}

/**
 * A step that overrides the chord type shows the override in its numeral. Dominant sevenths
 * are the only override in the curated data, written the conventional way: "I7", "IV7".
 */
function stepNumeral(step: ProgressionStep, quality: TriadQuality): string {
  if (step.chordTypeId === 'dominant7') {
    return `${romanNumeral(step.degree, 'major')}7`;
  }
  return romanNumeral(step.degree, quality);
}
