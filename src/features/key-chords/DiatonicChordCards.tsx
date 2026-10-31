import { TRIAD_QUALITY_LABELS } from '../../data';
import { spokenTriadName, type DiatonicTriad, type Triad } from '../../domain/music';

export interface DiatonicChordCardModel {
  readonly diatonic: DiatonicTriad;
  readonly triad: Triad;
}

interface DiatonicChordCardsProps {
  chords: readonly DiatonicChordCardModel[];
  selectedDegree: number;
  onSelect: (degree: number) => void;
}

/**
 * The seven chords of the key as pressable cards: numeral, symbol and quality. The pressed
 * card gets a heavier border and a check mark as well as the selected colours.
 */
export function DiatonicChordCards({ chords, selectedDegree, onSelect }: DiatonicChordCardsProps) {
  return (
    <div className="chord-cards" role="group" aria-label="Chords in this key">
      {chords.map(({ diatonic, triad }) => {
        const pressed = diatonic.degree === selectedDegree;
        return (
          <button
            key={diatonic.degree}
            type="button"
            className="chord-card"
            aria-pressed={pressed}
            aria-label={`${triad.symbol}, ${diatonic.numeral}, ${spokenTriadName(triad)}`}
            data-degree={diatonic.degree}
            onClick={() => onSelect(diatonic.degree)}
          >
            <span className="chord-card__numeral">{diatonic.numeral}</span>
            <span className="chord-card__symbol">{triad.symbol}</span>
            <span className="chord-card__quality">{TRIAD_QUALITY_LABELS[triad.quality]}</span>
          </button>
        );
      })}
    </div>
  );
}
