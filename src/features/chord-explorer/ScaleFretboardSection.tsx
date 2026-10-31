import { FretboardSection } from '../../components/FretboardSection';
import type {
  FretboardLabelMode,
  FretboardLegendEntry,
  ScaleFretboardModel,
  ScaleFretboardPreferences,
} from '../../components/scaleFretboardModels';
import {
  buildFretboardMap,
  FRETBOARD_MAX_FRET,
  STANDARD_TUNING,
  type GuitarTuning,
} from '../../domain/guitar';
import { noteName, type Chord } from '../../domain/music';
import { buildScaleFretboardModel } from './scaleFretboardViewModel';

interface ScaleFretboardSectionProps {
  chord: Chord;
  labelMode: FretboardLabelMode;
  onLabelModeChange: (mode: FretboardLabelMode) => void;
  tuning?: GuitarTuning;
}

/**
 * The explorer's fretboard: the selected root's major reference scale with the selected chord
 * overlaid, including altered chord tones outside that scale. Only the data differs from the
 * key fretboard; the section component is shared.
 */
export function ScaleFretboardSection({
  chord,
  labelMode,
  onLabelModeChange,
  tuning = STANDARD_TUNING,
}: ScaleFretboardSectionProps) {
  const rootName = noteName(chord.root);
  const positions = buildFretboardMap(chord, tuning, FRETBOARD_MAX_FRET);

  const buildModel = (preferences: ScaleFretboardPreferences) =>
    buildScaleFretboardModel(chord, positions, preferences, tuning, FRETBOARD_MAX_FRET);

  const legend = (
    preferences: ScaleFretboardPreferences,
    model: ScaleFretboardModel,
  ): FretboardLegendEntry[] => {
    const hasAltered = model.markers.some((marker) => marker.tone === 'altered');
    return [
      { key: 'root', label: 'Root', tone: 'root', sample: '1' },
      ...(preferences.highlightChord
        ? [{ key: 'chord', label: 'Selected chord tone', tone: 'chord', sample: '3' } as const]
        : []),
      { key: 'scale', label: 'Other scale note', tone: 'scale', sample: '2' },
      ...(hasAltered
        ? [{ key: 'altered', label: 'Altered chord tone', tone: 'altered', sample: '♭3' } as const]
        : []),
    ];
  };

  return (
    <FretboardSection
      id="explore-fretboard"
      title={`${rootName} major on the fretboard`}
      note={
        <>
          This is the {rootName} <strong>major reference scale</strong> that chord formulas are read
          against, whatever the selected chord&apos;s quality. Altered chord tones are shown on top
          of it.
        </>
      }
      labelMode={labelMode}
      onLabelModeChange={onLabelModeChange}
      buildModel={buildModel}
      legend={legend}
    />
  );
}
