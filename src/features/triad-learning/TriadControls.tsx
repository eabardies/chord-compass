import { LabeledSelect } from '../../components/LabeledSelect';
import { ToggleButtons } from '../../components/ToggleButtons';
import { CHORD_ROOTS, LEARNABLE_TRIAD_QUALITIES, TRIAD_QUALITY_LABELS } from '../../data';
import {
  describeStringSet,
  STANDARD_TUNING,
  TRIAD_STRING_SETS,
  type StringSetId,
} from '../../domain/guitar';
import type { TriadQuality } from '../../domain/music';
import { MARKER_LABEL_MODES, type MarkerLabelMode } from './markerLabels';
import type { TriadLearningSelections } from './useTriadLearningState';

interface TriadControlsProps {
  selections: TriadLearningSelections;
  onRootChange: (rootId: string) => void;
  onQualityChange: (quality: TriadQuality) => void;
  onStringSetChange: (id: StringSetId) => void;
  onLabelModeChange: (mode: MarkerLabelMode) => void;
}

export function TriadControls({
  selections,
  onRootChange,
  onQualityChange,
  onStringSetChange,
  onLabelModeChange,
}: TriadControlsProps) {
  return (
    <div className="controls triad-controls">
      <LabeledSelect
        id="triad-root"
        label="Root note"
        value={selections.rootId}
        options={CHORD_ROOTS}
        onChange={onRootChange}
      />
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
      <div className="field">
        <span className="field__label">
          String set <span className="field__hint">· shown low to high</span>
        </span>
        <ToggleButtons
          label="String set"
          options={TRIAD_STRING_SETS.map((set) => {
            const lowToHigh = describeStringSet(set, STANDARD_TUNING);
            return {
              id: set.id,
              label: set.name,
              hint: lowToHigh,
              description: `low to high ${lowToHigh}`,
            };
          })}
          value={selections.stringSetId}
          onChange={onStringSetChange}
        />
      </div>
      <div className="field">
        <span className="field__label">Dot labels</span>
        <ToggleButtons
          label="Dot labels"
          options={MARKER_LABEL_MODES}
          value={selections.labelMode}
          onChange={onLabelModeChange}
        />
      </div>
    </div>
  );
}
