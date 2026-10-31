import type { GuitarTuning, TriadVoicing } from '../../domain/guitar';
import type { MarkerLabelMode } from './markerLabels';
import { TriadInversionCard } from './TriadInversionCard';
import { inversionDiagramModel } from './triadViewModels';

interface TriadInversionGridProps {
  voicings: readonly TriadVoicing[];
  labelMode: MarkerLabelMode;
  tuning: GuitarTuning;
  headingLevel?: 3 | 4;
  /** Distinguishes several grids on one page for assistive technology. */
  label?: string;
}

/** The three inversions side by side, always in order: root position, first, second. */
export function TriadInversionGrid({
  voicings,
  labelMode,
  tuning,
  headingLevel = 3,
  label = 'Inversions',
}: TriadInversionGridProps) {
  return (
    <ol className="triad-grid" aria-label={label}>
      {voicings.map((voicing) => (
        <li key={voicing.inverted.inversion} className="triad-grid__item">
          <TriadInversionCard
            voicing={voicing}
            diagram={inversionDiagramModel(voicing, labelMode, tuning)}
            headingLevel={headingLevel}
          />
        </li>
      ))}
    </ol>
  );
}
