import { shapeCode } from '../../domain/guitar';
import { ChordSearchForm } from './ChordSearchForm';
import { ChordSearchResult } from './ChordSearchResult';
import { EXAMPLE_SYMBOLS, lookupChord } from './lookup';
import { useChordFinderState } from './useChordFinderState';
import './ChordFinder.css';

/**
 * Chord finder tab. State is the draft text, the submitted text and the chosen shape id; the
 * parsed chord, its shapes and the instructions are derived from them during render.
 */
export function ChordFinder() {
  const { selections, setDraft, submit, selectShape } = useChordFinderState();
  const lookup = selections.submitted === null ? null : lookupChord(selections.submitted);
  const found = lookup?.status === 'found' ? lookup : null;
  const selected =
    found?.shapes.find((shape) => shape.definition.id === selections.selectedShapeId) ??
    found?.shapes[0] ??
    null;
  const announcement =
    found && selected
      ? `Showing ${found.chord.symbol}, ${selected.positionLabel.toLowerCase()}, shape ${shapeCode(selected.frets)}.`
      : '';

  return (
    <div className="chord-finder">
      <div className="section-lead">
        <h2 className="section-title">Find a chord. Play it.</h2>
        <p className="section-subtitle">
          Type the chord symbol and get a playable guitar shape straight away.
        </p>
      </div>

      <ChordSearchForm
        draft={selections.draft}
        examples={EXAMPLE_SYMBOLS}
        onDraftChange={setDraft}
        onSubmit={() => submit()}
        onExample={(symbol) => submit(symbol)}
      />

      {lookup && lookup.status !== 'found' && (
        <p className="chord-finder__error" role="alert">
          <strong>{lookup.message}</strong> {lookup.suggestion}
        </p>
      )}

      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      {found && selected && (
        <ChordSearchResult
          chord={found.chord}
          shapes={found.shapes}
          selected={selected}
          onSelectShape={selectShape}
        />
      )}

      {!lookup && (
        <p className="empty-state">
          Search for a chord, or pick one of the examples, to see how to play it.
        </p>
      )}
    </div>
  );
}
