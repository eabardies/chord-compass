import type { VoicedShape } from '../domain/guitar';
import { intervalLabel, noteName } from '../domain/music';
import { ChordDiagram } from './ChordDiagram';
import { StringNotes } from './StringNotes';
import { ToggleButtons } from './ToggleButtons';
import './ShapeViewer.css';

interface ShapeViewerProps {
  shapes: readonly VoicedShape[];
  selected: VoicedShape | null;
  onSelect: (definitionId: string) => void;
  /** Label for the shape switcher group, e.g. "Shapes for A major". */
  switcherLabel: string;
  /** Show the per-string note table under the diagram. */
  showStringNotes?: boolean;
  /** Show the chord name when there is no shape at all. */
  chordSymbol: string;
}

/**
 * A diagram plus the controls to switch between the shapes available for one chord.
 * Shape choice is owned by the parent so it can stay stable across unrelated changes.
 */
export function ShapeViewer({
  shapes,
  selected,
  onSelect,
  switcherLabel,
  showStringNotes = true,
  chordSymbol,
}: ShapeViewerProps) {
  if (!selected) {
    return (
      <p className="empty-state">
        No verified shape for {chordSymbol} yet. Its formula and notes still apply; try a nearby
        position with the barre shapes of a related chord.
      </p>
    );
  }

  const verified = selected.definition.playability === 'verified';
  const omitted = selected.definition.omittedDegrees.map((degree) => {
    const tone = selected.chord.tones.find(
      (candidate) =>
        candidate.interval.degree === degree.degree &&
        candidate.interval.alteration === degree.alteration,
    );
    return tone ? `${intervalLabel(degree)} (${noteName(tone.note)})` : intervalLabel(degree);
  });

  return (
    <div className="shape-viewer">
      <ChordDiagram shape={selected} showFingers={verified} />
      {shapes.length > 1 && (
        <ToggleButtons
          label={switcherLabel}
          size="sm"
          options={shapes.map((shape) => ({ id: shape.definition.id, label: shape.positionLabel }))}
          value={selected.definition.id}
          onChange={onSelect}
        />
      )}
      {showStringNotes && <StringNotes shape={selected} />}
      {omitted.length > 0 && (
        <p className="note-text">
          This shape intentionally leaves out the {omitted.join(' and ')}. The remaining notes still
          define the chord.
        </p>
      )}
      {!verified && (
        <p className="note-text">
          Fingering not yet verified by a player, so finger numbers are hidden. The notes are
          correct.
        </p>
      )}
    </div>
  );
}
