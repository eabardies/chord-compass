import { useState, type ReactNode } from 'react';
import { FretboardLegend } from './FretboardLegend';
import { ScaleFretboard } from './ScaleFretboard';
import { ToggleButtons } from './ToggleButtons';
import {
  FRETBOARD_LABEL_MODES,
  type FretboardLabelMode,
  type FretboardLegendEntry,
  type ScaleFretboardModel,
  type ScaleFretboardPreferences,
} from './scaleFretboardModels';
import './FretboardSection.css';

interface FretboardSectionProps {
  /** Stable id prefix for the heading and the collapsible panel. */
  id: string;
  /** "A major on the fretboard", "C natural minor on the fretboard". */
  title: string;
  /** Shown under the title while the chord is highlighted, e.g. "F minor highlighted". */
  highlightLine?: string | undefined;
  /** Optional explanation under the subtitle. */
  note?: ReactNode;
  /** The dot-label preference, shared between every fretboard in the app. */
  labelMode: FretboardLabelMode;
  onLabelModeChange: (mode: FretboardLabelMode) => void;
  /** Builds the markers for the current preferences; all music lives in the caller. */
  buildModel: (preferences: ScaleFretboardPreferences) => ScaleFretboardModel;
  /** Legend rows for the current preferences and model. */
  legend: (
    preferences: ScaleFretboardPreferences,
    model: ScaleFretboardModel,
  ) => readonly FretboardLegendEntry[];
}

const SUBTITLE = 'High e at the top · low E at the bottom · fret 12 repeats the open strings';

/**
 * The one fretboard section used by every tab: title, show/hide, dot labels, chord highlight,
 * the neck in a sideways scroller, and a legend. Visibility and the highlight toggle are local
 * to each section; the label mode is passed in so the choice carries between tabs. Nothing
 * musical is computed here: the caller supplies the model for the current preferences.
 */
export function FretboardSection({
  id,
  title,
  highlightLine,
  note,
  labelMode,
  onLabelModeChange,
  buildModel,
  legend,
}: FretboardSectionProps) {
  const [highlightChord, setHighlightChord] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const headingId = `${id}-heading`;
  const panelId = `${id}-panel`;

  const preferences: ScaleFretboardPreferences = { labelMode, highlightChord };
  const model = buildModel(preferences);

  return (
    <section className="scale-fretboard-section" aria-labelledby={headingId}>
      <header className="scale-fretboard-section__header">
        <div>
          <h3 id={headingId} className="scale-fretboard-section__title">
            {title}
          </h3>
          <p className="section-subtitle">{SUBTITLE}</p>
          {highlightChord && highlightLine && (
            <p className="scale-fretboard-section__highlight-line">{highlightLine}</p>
          )}
          {note && <p className="note-text">{note}</p>}
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
              onChange={onLabelModeChange}
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

        <FretboardLegend entries={legend(preferences, model)} />
      </div>
    </section>
  );
}
