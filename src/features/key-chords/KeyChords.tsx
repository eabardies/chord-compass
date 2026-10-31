import { useState } from 'react';
import { LabeledSelect } from '../../components/LabeledSelect';
import { NoteList } from '../../components/NoteList';
import { ScaleFretboard } from '../../components/ScaleFretboard';
import { ToggleButtons } from '../../components/ToggleButtons';
import { StringSetSelector } from '../../components/triads/StringSetSelector';
import { TriadInversionGrid } from '../../components/triads/TriadInversionGrid';
import {
  CHORD_ROOTS,
  chordTypeForTriad,
  closestRootOption,
  KEY_TONICS,
  rootOptionById,
} from '../../data';
import {
  FRETBOARD_MAX_FRET,
  STANDARD_TUNING,
  stringSetById,
  TRIAD_STRING_SETS,
  triadVoicings,
  type StringSetId,
} from '../../domain/guitar';
import {
  buildTriad,
  chordToneLabel,
  harmonizeScale,
  isMinorScale,
  noteName,
  scaleDegreeLabels,
  scaleName,
  scaleNotesOf,
  SCALE_TYPE_LABELS,
  SCALE_TYPES,
  triadNoteNames,
  type ScaleType,
  type TriadQuality,
} from '../../domain/music';
import { DiatonicChordCards } from './DiatonicChordCards';
import { buildKeyFretboardModel } from './keyFretboardViewModel';
import { FretboardLegend } from '../chord-explorer/FretboardLegend';
import './KeyChords.css';

export interface TriadPracticeRequest {
  readonly rootId: string;
  readonly quality: TriadQuality;
  readonly stringSetId: StringSetId;
}

interface KeyChordsProps {
  /** "Practise all … triads": the app shell opens Learn triads with this request. */
  onPractiseTriads: (request: TriadPracticeRequest) => void;
}

const DEFAULT_TONIC_ID = 'C';

/**
 * "Chords in a key" tab. State is four selections: tonic, scale type, chord degree and string
 * set. The scale, its seven triads, the highlighted notes and every triad voicing are derived
 * during render. The degree is kept across scale changes (ii stays ii), so the user can
 * compare the same degree in different scales.
 */
export function KeyChords({ onPractiseTriads }: KeyChordsProps) {
  const [tonicId, setTonicId] = useState(DEFAULT_TONIC_ID);
  const [scaleType, setScaleType] = useState<ScaleType>('major');
  const [degree, setDegree] = useState(1);
  const [stringSetId, setStringSetId] = useState<StringSetId>(TRIAD_STRING_SETS[0].id);
  const tuning = STANDARD_TUNING;

  const tonics = KEY_TONICS[isMinorScale(scaleType) ? 'minor' : 'major'];
  const tonic = rootOptionById(tonics, tonicId) ?? tonics[0];
  const scale = { tonic: tonic.note, type: scaleType };
  const name = scaleName(scale);
  const notes = scaleNotesOf(scale);
  const degreeLabels = scaleDegreeLabels(scaleType);
  const chords = harmonizeScale(scale).map((diatonic) => ({
    diatonic,
    triad: buildTriad(diatonic.root, chordTypeForTriad(diatonic.quality)),
  }));
  const selected = chords.find((chord) => chord.diatonic.degree === degree) ?? chords[0];
  const { triad } = selected;
  const chordToneByName = new Map(triad.tones.map((tone) => [noteName(tone.note), tone]));
  const stringSet = stringSetById(stringSetId) ?? TRIAD_STRING_SETS[0];
  const voicings = triadVoicings(triad, stringSet, tuning);
  const fretboard = buildKeyFretboardModel(scale, triad, tuning, FRETBOARD_MAX_FRET);
  const toneSummary = triadNoteNames(triad.tones).join(' · ');
  const announcement = `${triad.name}, ${selected.diatonic.numeral} in ${name}: ${toneSummary}. Triad shapes on strings ${stringSet.numbers}.`;

  const changeScaleType = (next: ScaleType) => {
    setScaleType(next);
    // Keep the same tonic sound when the spelling list differs (A♭ major → G♯ minor).
    const nextTonics = KEY_TONICS[isMinorScale(next) ? 'minor' : 'major'];
    setTonicId(closestRootOption(nextTonics, tonic.note).id);
  };

  return (
    <div className="key-chords">
      <div className="section-lead">
        <h2 className="section-title">Every key has seven chords.</h2>
        <p className="section-subtitle">
          Choose a key, see its notes and chords, then learn each chord as triads on the neck.
        </p>
      </div>

      <div className="controls">
        <LabeledSelect
          id="key-chords-root"
          label="Root note"
          value={tonic.id}
          options={tonics}
          onChange={setTonicId}
        />
        <div className="field">
          <span className="field__label">Scale type</span>
          <ToggleButtons
            label="Scale type"
            options={SCALE_TYPES.map((type) => ({ id: type, label: SCALE_TYPE_LABELS[type] }))}
            value={scaleType}
            onChange={changeScaleType}
          />
        </div>
      </div>

      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <div className="stack">
        <section className="key-chords__panel" aria-labelledby="key-scale-heading">
          <h3 id="key-scale-heading" className="key-chords__heading">
            Notes in {name}
          </h3>
          <NoteList
            label={`Notes in ${name}`}
            items={notes.map((note, index) => {
              const tone = chordToneByName.get(noteName(note));
              return {
                id: noteName(note),
                label: noteName(note),
                sublabel: degreeLabels[index],
                highlighted: tone !== undefined,
                highlightDescription: tone ? `${chordToneLabel(tone)} of ${triad.name}` : undefined,
              };
            })}
          />
          <p className="note-text">
            Highlighted notes are the tones of {triad.name}: {toneSummary}.
          </p>
        </section>

        <section className="key-chords__panel" aria-labelledby="key-chords-heading">
          <h3 id="key-chords-heading" className="key-chords__heading">
            Chords in this key
          </h3>
          <p className="section-subtitle">
            A triad on each scale note: the note, the third above it and the fifth above it.
          </p>
          <DiatonicChordCards
            chords={chords}
            selectedDegree={selected.diatonic.degree}
            onSelect={setDegree}
          />
          <div className="selected-chord" data-testid="selected-chord">
            <span className="eyebrow">Selected chord</span>
            <p className="selected-chord__name" data-testid="key-chord-name">
              {triad.name}
            </p>
            <p className="selected-chord__tones" data-testid="key-chord-tones">
              {triad.tones
                .map((tone) => `${noteName(tone.note)} (${chordToneLabel(tone)})`)
                .join(' · ')}
            </p>
            <p className="selected-chord__role" data-testid="key-chord-role">
              {selected.diatonic.numeral} in {name}
            </p>
          </div>
        </section>

        <section className="key-chords__panel" aria-labelledby="key-fretboard-heading">
          <h3 id="key-fretboard-heading" className="key-chords__heading">
            {name} on the fretboard
          </h3>
          <p className="section-subtitle">
            High e at the top · low E at the bottom · {triad.name} highlighted
          </p>
          <div className="key-chords__scroller" tabIndex={0}>
            <ScaleFretboard model={fretboard} />
          </div>
          <FretboardLegend showChordTones showAltered={false} />
        </section>

        <section className="key-chords__panel" aria-labelledby="triad-shapes-heading">
          <header className="key-chords__shapes-header">
            <div>
              <h3 id="triad-shapes-heading" className="key-chords__heading">
                Triad shapes
              </h3>
              <p className="section-subtitle">
                {triad.name} in root position, first and second inversion on three strings.
              </p>
            </div>
            <button
              type="button"
              className="button"
              onClick={() =>
                onPractiseTriads({
                  rootId: closestRootOption(CHORD_ROOTS, triad.root).id,
                  quality: triad.quality,
                  stringSetId: stringSet.id,
                })
              }
            >
              Practise all {triad.name} triads
            </button>
          </header>
          <StringSetSelector value={stringSet.id} onChange={setStringSetId} tuning={tuning} />
          <TriadInversionGrid
            voicings={voicings}
            labelMode="both"
            tuning={tuning}
            headingLevel={4}
            label={`Inversions of ${triad.name}`}
          />
        </section>
      </div>
    </div>
  );
}
