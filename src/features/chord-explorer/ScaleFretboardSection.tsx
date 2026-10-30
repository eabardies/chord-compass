import { useId, useState } from 'react';
import { ScaleFretboard } from '../../components/ScaleFretboard';
import { ToggleButtons } from '../../components/ToggleButtons';
import {
  buildFretboardMap,
  FRETBOARD_MAX_FRET,
  STANDARD_TUNING,
  type GuitarTuning,
} from '../../domain/guitar';
import { noteName, type Chord } from '../../domain/music';
import { FretboardLegend } from './FretboardLegend';
import {
  buildScaleFretboardModel,
  FRETBOARD_LABEL_MODES,
  type FretboardLabelMode,
} from './scaleFretboardViewModel';
import './ScaleFretboardSection.css';

interface ScaleFretboardSectionProps {
  chord: Chord;
  tuning?: GuitarTuning;
}

/**
 * The selected root's major scale across the neck, with the selected chord overlaid. Only the
 * three interface preferences are state; the notes come from the chord passed in, so they
 * follow the explorer's selections without being copied.
 */
export function ScaleFretboardSection({
  chord,
  tuning = STANDARD_TUNING,
}: ScaleFretboardSectionProps) {
  const [labelMode, setLabelMode] = useState<FretboardLabelMode>('degrees');
  const [highlightChord, setHighlightChord] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const headingId = useId();
  const panelId = useId();

  const positions = buildFretboardMap(chord, tuning, FRETBOARD_MAX_FRET);
  const model = buildScaleFretboardModel(
    chord,
    positions,
    { labelMode, highlightChord },
    tuning,
    FRETBOARD_MAX_FRET,
  );
  const hasAltered = model.markers.some((marker) => marker.tone === 'altered');
  const rootName = noteName(chord.root);

  return (
    <section className="scale-fretboard-section" aria-labelledby={headingId}>
      <header className="scale-fretboard-section__header">
        <div>
          <h3 id={headingId} className="scale-fretboard-section__title">
            {rootName} major on the fretboard
          </h3>
          <p className="section-subtitle">
            High e at the top · low E at the bottom · fret 12 repeats the open strings
          </p>
          <p className="note-text">
            This is the {rootName} <strong>major reference scale</strong> that chord formulas are
            read against, whatever the selected chord&apos;s quality. Altered chord tones are shown
            on top of it.
          </p>
        </div>
        <button
          type="button"
          className="button scale-fretboard-section__toggle"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Hide fretboard' : 'Show fretboard'}
        </button>
      </header>

      <div id={panelId} hidden={!expanded} className="scale-fretboard-section__panel">
        <div className="scale-fretboard-section__controls">
          <div className="field">
            <span className="field__label">Dot labels</span>
            <ToggleButtons
              label="Fretboard dot labels"
              size="sm"
              options={FRETBOARD_LABEL_MODES}
              value={labelMode}
              onChange={setLabelMode}
            />
          </div>
          <button
            type="button"
            className="toggle-buttons__button scale-fretboard-section__highlight"
            aria-pressed={highlightChord}
            onClick={() => setHighlightChord((current) => !current)}
          >
            Highlight selected chord
          </button>
        </div>

        <p className="visually-hidden" aria-live="polite" aria-atomic="true">
          {model.title}.
        </p>

        <div
          className="scale-fretboard-section__scroller"
          style={{ overflowX: 'auto' }}
          tabIndex={0}
        >
          <ScaleFretboard model={model} />
        </div>
        <p className="note-text scale-fretboard-section__scroll-hint" aria-hidden="true">
          Scroll sideways to see all 12 frets.
        </p>

        <FretboardLegend showChordTones={highlightChord} showAltered={hasAltered} />
      </div>
    </section>
  );
}
