import { NoteMarker, type NoteMarkerVariant } from './NoteMarker';
import type { FretboardLegendEntry, ScaleMarkerTone } from './scaleFretboardModels';

const VARIANT: Record<ScaleMarkerTone, NoteMarkerVariant> = {
  root: 'filled',
  chord: 'filled',
  scale: 'quiet',
  altered: 'altered',
};

interface FretboardLegendProps {
  entries: readonly FretboardLegendEntry[];
}

/** Legend using the same marker styles as the fretboard; the entries come from the feature. */
export function FretboardLegend({ entries }: FretboardLegendProps) {
  return (
    <ul className="fretboard-legend" aria-label="Fretboard legend">
      {entries.map((entry) => (
        <li key={entry.key} className="fretboard-legend__item">
          <svg className="fretboard-legend__swatch" viewBox="0 0 44 32" aria-hidden="true">
            <NoteMarker
              cx={22}
              cy={16}
              label={entry.sample}
              isRoot={entry.tone === 'root'}
              keyRoot={entry.isKeyRoot}
              variant={VARIANT[entry.tone]}
            />
          </svg>
          <span>{entry.label}</span>
        </li>
      ))}
    </ul>
  );
}
