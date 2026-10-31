import { ToggleButtons } from '../../components/ToggleButtons';
import { StringSetSelector } from '../../components/triads/StringSetSelector';
import { MARKER_LABEL_MODES, type MarkerLabelMode } from '../../components/triads/markerLabels';
import { LEARNABLE_TRIAD_QUALITIES, TRIAD_QUALITY_LABELS } from '../../data';
import { STANDARD_TUNING, type StringSetId } from '../../domain/guitar';
import type { TriadQuality } from '../../domain/music';
import type { TriadLearningSelections } from './useTriadLearningState';

interface TriadControlsProps {
  selections: TriadLearningSelections;
  onQualityChange: (quality: TriadQuality) => void;
  onStringSetChange: (id: StringSetId) => void;
  onLabelModeChange: (mode: MarkerLabelMode) => void;
}

/** The live controls for a shown triad: quality, string set and marker labels. */
export function TriadControls({
  selections,
  onQualityChange,
  onStringSetChange,
  onLabelModeChange,
}: TriadControlsProps) {
  return (
    <div className="controls triad-controls">
      <div className="field">
        <span className="field__label">Triad quality</span>
        <ToggleButtons
          label="Triad quality"
          options={LEARNABLE_TRIAD_QUALITIES.map((quality) => ({
            id: quality,
            label: TRIAD_QUALITY_LABELS[quality],
          }))}
          value={selections.quality}
          onChange={onQualityChange}
        />
      </div>
      <StringSetSelector
        value={selections.stringSetId}
        onChange={onStringSetChange}
        tuning={STANDARD_TUNING}
      />
      <div className="field">
        <span className="field__label">Marker labels</span>
        <ToggleButtons
          label="Marker labels"
          options={MARKER_LABEL_MODES}
          value={selections.labelMode}
          onChange={onLabelModeChange}
        />
      </div>
    </div>
  );
}
