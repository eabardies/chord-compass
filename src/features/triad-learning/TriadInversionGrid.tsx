import type { GuitarTuning, TriadVoicing } from '../../domain/guitar';
import type { MarkerLabelMode } from './markerLabels';
import { TriadInversionCard } from './TriadInversionCard';
import { inversionDiagramModel } from './viewModels';

interface TriadInversionGridProps {
  voicings: readonly TriadVoicing[];
  labelMode: MarkerLabelMode;
  tuning: GuitarTuning;
}

/** The three inversions side by side, always in order: root position, first, second. */
export function TriadInversionGrid({ voicings, labelMode, tuning }: TriadInversionGridProps) {
  return (
    <ol className="triad-grid" aria-label="Inversions">
      {voicings.map((voicing) => (
        <li key={voicing.inverted.inversion} className="triad-grid__item">
          <TriadInversionCard
            voicing={voicing}
            diagram={inversionDiagramModel(voicing, labelMode, tuning)}
          />
        </li>
      ))}
    </ol>
  );
}
