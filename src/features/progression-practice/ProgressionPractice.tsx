import { useState } from 'react';
import { Card } from '../../components/Card';
import { LabeledSelect } from '../../components/LabeledSelect';
import { ShapeViewer } from '../../components/ShapeViewer';
import { ToggleButtons } from '../../components/ToggleButtons';
import {
  CHORD_TYPE_CATALOG,
  closestRootOption,
  KEY_TONICS,
  progressionsForMode,
  rootOptionById,
  shapeLibrary,
  TWELVE_BAR_BLUES,
} from '../../data';
import { shapesForChord, STANDARD_TUNING, type VoicedShape } from '../../domain/guitar';
import { keyName, MODE_LABELS, noteName, type Mode } from '../../domain/music';
import {
  instantiateProgression,
  templateName,
  type Progression,
  type ProgressionChord,
} from '../../domain/progressions';
import './ProgressionPractice.css';

const MODES: readonly Mode[] = ['major', 'minor'];
const DEFAULT_TONIC_ID = 'A';

/** Shape choices are remembered per template slot (or per blues degree) so changing key keeps them. */
type ShapeChoices = Readonly<Record<string, string>>;

export function ProgressionPractice() {
  const [mode, setMode] = useState<Mode>('major');
  const [tonicId, setTonicId] = useState(DEFAULT_TONIC_ID);
  const [progressionId, setProgressionId] = useState<string | null>(null);
  const [shapeChoices, setShapeChoices] = useState<ShapeChoices>({});

  const tonics = KEY_TONICS[mode];
  const tonic = rootOptionById(tonics, tonicId) ?? tonics[0];
  const key = { tonic: tonic.note, mode };
  const templates = progressionsForMode(mode);
  const template = templates.find((candidate) => candidate.id === progressionId) ?? templates[0];
  const progression = instantiateProgression(template, key, CHORD_TYPE_CATALOG);
  const blues = instantiateProgression(
    TWELVE_BAR_BLUES,
    { tonic: tonic.note, mode: 'major' },
    CHORD_TYPE_CATALOG,
  );

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    // Keep the same tonic sound when the mode's spelling list differs (A♭ major → G♯ minor).
    setTonicId(closestRootOption(KEY_TONICS[nextMode], tonic.note).id);
  };

  const chooseShape = (slotKey: string, definitionId: string) =>
    setShapeChoices((current) => ({ ...current, [slotKey]: definitionId }));

  return (
    <div className="progression-practice">
      <div className="section-lead">
        <h2 className="section-title">Progressions you&apos;ll hear everywhere.</h2>
        <p className="section-subtitle">
          Pick a key, choose a progression, and play through its chords.
        </p>
      </div>

      <div className="controls">
        <LabeledSelect
          id="key-tonic"
          label="Key"
          value={tonic.id}
          options={tonics}
          onChange={setTonicId}
        />
        <div className="field">
          <span className="field__label" id="mode-label">
            Mode
          </span>
          <ToggleButtons
            label="Mode"
            options={MODES.map((candidate) => ({ id: candidate, label: MODE_LABELS[candidate] }))}
            value={mode}
            onChange={changeMode}
          />
        </div>
      </div>

      <div className="stack">
        <ToggleButtons
          label={`Progressions in ${keyName(key)}`}
          options={templates.map((candidate) => ({
            id: candidate.id,
            label: templateName(candidate),
          }))}
          value={template.id}
          onChange={setProgressionId}
        />

        <section aria-labelledby="progression-heading">
          <h3 id="progression-heading" className="progression-practice__heading">
            {templateName(template)} in {keyName(key)}
          </h3>
          <p className="section-subtitle">{template.description}</p>
          <p className="note-text progression-practice__legend">
            Uppercase numerals are major chords, lowercase are minor. A ° marks a diminished chord.
          </p>
          <ProgressionGrid
            progression={progression}
            slotKey={(_entry, index) => `${template.id}:${index}`}
            choices={shapeChoices}
            onChoose={chooseShape}
          />
        </section>

        <section aria-labelledby="blues-heading" className="progression-practice__blues">
          <h3 id="blues-heading" className="progression-practice__heading">
            12-bar blues in {noteName(tonic.note)}
          </h3>
          <p className="section-subtitle">{TWELVE_BAR_BLUES.description}</p>
          <p className="note-text progression-practice__legend">
            Blues follows its own convention: dominant sevenths on I, IV and V, even though I7 and
            IV7 are not diatonic to the major key. One card per bar; choose a shape for I7, IV7 or
            V7 and every bar with that chord follows.
          </p>
          <ProgressionGrid
            progression={blues}
            slotKey={(entry) => `blues:${entry.step.degree}`}
            choices={shapeChoices}
            onChoose={chooseShape}
            showBarNumbers
          />
        </section>
      </div>
    </div>
  );
}

interface ProgressionGridProps {
  progression: Progression;
  slotKey: (entry: ProgressionChord, index: number) => string;
  choices: ShapeChoices;
  onChoose: (slotKey: string, definitionId: string) => void;
  showBarNumbers?: boolean;
}

function ProgressionGrid({
  progression,
  slotKey,
  choices,
  onChoose,
  showBarNumbers = false,
}: ProgressionGridProps) {
  const library = shapeLibrary();
  return (
    <ol className="progression-grid" aria-label={`Chords of ${templateName(progression.template)}`}>
      {progression.chords.map((entry, index) => {
        const shapes = shapesForChord(entry.chord, library, STANDARD_TUNING);
        const key = slotKey(entry, index);
        const selected: VoicedShape | null =
          shapes.find((shape) => shape.definition.id === choices[key]) ?? shapes[0] ?? null;
        return (
          <li key={`${key}-${index}`} className="progression-grid__item">
            <Card
              as="article"
              headingLevel={3}
              title={
                <span className="progression-grid__title">
                  <span className="progression-grid__numeral">{entry.numeral}</span>
                  <span className="progression-grid__symbol">{entry.chord.symbol}</span>
                  <span className="visually-hidden">, {entry.chord.name}</span>
                </span>
              }
              badge={showBarNumbers ? `Bar ${index + 1}` : selected?.positionLabel}
            >
              <ShapeViewer
                shapes={shapes}
                selected={selected}
                onSelect={(definitionId) => onChoose(key, definitionId)}
                switcherLabel={`Shapes for ${entry.chord.name}`}
                showStringNotes={false}
                chordSymbol={entry.chord.symbol}
              />
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
