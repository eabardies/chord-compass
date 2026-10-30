import { useState } from 'react';
import { Card } from '../../components/Card';
import { LabeledSelect } from '../../components/LabeledSelect';
import { MajorScaleReference } from '../../components/MajorScaleReference';
import { NoteList } from '../../components/NoteList';
import { ShapeViewer } from '../../components/ShapeViewer';
import { ToggleButtons } from '../../components/ToggleButtons';
import { ScaleFretboardSection } from './ScaleFretboardSection';
import {
  CHORD_ROOTS,
  CHORD_TYPES,
  rootOptionById,
  shapeLibrary,
  type ChordTypeId,
} from '../../data';
import { shapeNoteNames, shapesForChord, STANDARD_TUNING } from '../../domain/guitar';
import { buildChord, intervalLabel, majorScaleReference, noteName } from '../../domain/music';
import './ChordExplorer.css';

const DEFAULT_ROOT_ID = 'A';
const DEFAULT_TYPE_ID: ChordTypeId = 'major';

/**
 * Explore tab. State is three user selections (root in the picker, generated root, chord type)
 * plus the preferred shape; everything shown is derived from them during render.
 */
export function ChordExplorer() {
  const [pickedRootId, setPickedRootId] = useState(DEFAULT_ROOT_ID);
  const [generatedRootId, setGeneratedRootId] = useState<string | null>(null);
  const [chordTypeId, setChordTypeId] = useState<string>(DEFAULT_TYPE_ID);
  // The shape *definition* the user last chose. Keeping the definition id (not an index) means
  // switching root keeps "E-shape barre" selected when the new chord offers it too.
  const [preferredShapeId, setPreferredShapeId] = useState<string | null>(null);

  const generatedRoot = generatedRootId ? rootOptionById(CHORD_ROOTS, generatedRootId) : undefined;
  const chords = generatedRoot
    ? CHORD_TYPES.map((type) => buildChord(generatedRoot.note, type))
    : [];
  const chord = chords.find((candidate) => candidate.type.id === chordTypeId) ?? chords[0] ?? null;
  const shapes = chord ? shapesForChord(chord, shapeLibrary(), STANDARD_TUNING) : [];
  const selectedShape =
    shapes.find((shape) => shape.definition.id === preferredShapeId) ?? shapes[0] ?? null;

  return (
    <div className="chord-explorer">
      <div className="section-lead">
        <h2 className="section-title">A little theory. A lot of playing.</h2>
        <p className="section-subtitle">
          Explore chord types, then find your way around the fretboard.
        </p>
      </div>

      <form
        className="controls"
        onSubmit={(event) => {
          event.preventDefault();
          setGeneratedRootId(pickedRootId);
        }}
      >
        <LabeledSelect
          id="root-note"
          label="Root note"
          value={pickedRootId}
          options={CHORD_ROOTS}
          onChange={setPickedRootId}
        />
        <button type="submit" className="button">
          Generate chords
        </button>
      </form>

      {!generatedRoot && (
        <p className="empty-state">Pick a root note and generate its chords to get started.</p>
      )}

      {generatedRoot && chord && (
        <div className="stack">
          <ToggleButtons
            label={`Chord types on ${generatedRoot.label}`}
            options={chords.map((candidate) => ({
              id: candidate.type.id,
              label: candidate.symbol,
              description: candidate.name,
            }))}
            value={chord.type.id}
            onChange={setChordTypeId}
          />

          <MajorScaleReference reference={majorScaleReference(chord)} />

          <ScaleFretboardSection chord={chord} />

          <div className="panels">
            <Card title={chord.name} badge={selectedShape?.positionLabel}>
              <ShapeViewer
                shapes={shapes}
                selected={selectedShape}
                onSelect={setPreferredShapeId}
                switcherLabel={`Shapes for ${chord.name}`}
                chordSymbol={chord.symbol}
              />
            </Card>

            <Card title="Inside the chord">
              <div>
                <p className="eyebrow">
                  Formula{' '}
                  <span className="eyebrow__hint">· relative to the root&apos;s major scale</span>
                </p>
                <NoteList
                  label="Interval formula"
                  items={chord.tones.map((tone) => ({
                    id: intervalLabel(tone.interval),
                    label: intervalLabel(tone.interval),
                  }))}
                />
              </div>
              <hr className="divider" />
              <div>
                <p className="eyebrow">Chord notes</p>
                <NoteList
                  label="Chord notes"
                  items={chord.tones.map((tone) => ({
                    id: intervalLabel(tone.interval),
                    label: noteName(tone.note),
                    sublabel: intervalLabel(tone.interval),
                  }))}
                />
              </div>
              {selectedShape && (
                <>
                  <hr className="divider" />
                  <div>
                    <p className="eyebrow">
                      Notes in this shape <span className="eyebrow__hint">· low to high</span>
                    </p>
                    <p className="chord-explorer__shape-notes" data-testid="shape-notes">
                      {shapeNoteNames(selectedShape)
                        .filter((name) => name !== 'x')
                        .join(' – ')}
                    </p>
                    <p className="note-text">
                      A shape can repeat notes across several strings. The chord formula describes
                      its distinct notes; a voicing is one way to lay them out on the neck.
                    </p>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
