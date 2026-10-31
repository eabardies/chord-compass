import { useState } from 'react';
import { FretboardSection } from '../../components/FretboardSection';
import { LabeledSelect } from '../../components/LabeledSelect';
import { NoteList } from '../../components/NoteList';
import type {
  FretboardLabelMode,
  FretboardLegendEntry,
  ScaleFretboardPreferences,
} from '../../components/scaleFretboardModels';
import { ToggleButtons } from '../../components/ToggleButtons';
import { StringSetSelector } from '../../components/triads/StringSetSelector';
import { TriadInversionGrid } from '../../components/triads/TriadInversionGrid';
import { CHORD_ROOTS, chordTypeForTriad, closestRootOption, rootOptionById } from '../../data';
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
  noteName,
  scaleDegreeLabels,
  scaleHasDoubleAccidentals,
  scaleName,
  scaleNotesOf,
  SCALE_TYPE_LABELS,
  SCALE_TYPES,
  simplerEnharmonicTonic,
  spokenNoteName,
  spokenTriadName,
  type ScaleType,
  type TriadQuality,
} from '../../domain/music';
import { DiatonicChordCards } from './DiatonicChordCards';
import { buildKeyFretboardModel } from './keyFretboardViewModel';
import './KeyChords.css';

export interface TriadPracticeRequest {
  readonly rootId: string;
  readonly quality: TriadQuality;
  readonly stringSetId: StringSetId;
}

interface KeyChordsProps {
  /** "Practise all … triads": the app shell opens Learn triads with this request. */
  onPractiseTriads: (request: TriadPracticeRequest) => void;
  /** The fretboard dot-label preference, shared with the other fretboards in the app. */
  fretboardLabelMode: FretboardLabelMode;
  onFretboardLabelModeChange: (mode: FretboardLabelMode) => void;
}

const DEFAULT_TONIC_ID = 'A';

/**
 * "Chords in a key" tab. Like Explore chords, it opens empty: the user picks a root and presses
 * "Show chords in this key"; from then on the scale type, chord degree and string set are live
 * controls. The scale, its seven triads, the highlighted notes and every triad voicing are
 * derived during render. The degree is kept across scale changes (ii stays ii), so the user can
 * compare the same degree in different scales. The tonic is whichever of the shared roots the
 * user picked, spelled exactly so: C♯ major is C♯ major, D♯ major keeps its double sharps.
 */
export function KeyChords({
  onPractiseTriads,
  fretboardLabelMode,
  onFretboardLabelModeChange,
}: KeyChordsProps) {
  const [pickedTonicId, setPickedTonicId] = useState(DEFAULT_TONIC_ID);
  const [shownTonicId, setShownTonicId] = useState<string | null>(null);
  const [scaleType, setScaleType] = useState<ScaleType>('major');
  const [degree, setDegree] = useState(1);
  const [stringSetId, setStringSetId] = useState<StringSetId>(TRIAD_STRING_SETS[0].id);
  const tuning = STANDARD_TUNING;

  const picker = (
    <form
      className="controls"
      onSubmit={(event) => {
        event.preventDefault();
        setShownTonicId(pickedTonicId);
      }}
    >
      <LabeledSelect
        id="key-chords-root"
        label="Root note"
        value={pickedTonicId}
        options={CHORD_ROOTS}
        onChange={setPickedTonicId}
      />
      <button type="submit" className="button">
        Show chords in this key
      </button>
    </form>
  );
  const lead = (
    <div className="section-lead">
      <h2 className="section-title">Every key has seven chords.</h2>
      <p className="section-subtitle">
        Choose a key, see its notes and chords, then learn each chord as triads on the neck.
      </p>
    </div>
  );

  const tonic = shownTonicId === null ? null : rootOptionById(CHORD_ROOTS, shownTonicId);
  if (!tonic) {
    return (
      <div className="key-chords">
        {lead}
        {picker}
        <p className="empty-state">
          Pick a root note and show the chords in its key to get started.
        </p>
      </div>
    );
  }

  const scale = { tonic: tonic.note, type: scaleType };
  const name = scaleName(scale);
  const spokenScale = `${spokenNoteName(tonic.note)} ${SCALE_TYPE_LABELS[scaleType].toLowerCase()}`;
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
  const toneSummary = triad.tones.map((tone) => noteName(tone.note)).join(' · ');
  const spokenTones = triad.tones.map((tone) => spokenNoteName(tone.note)).join(', ');
  const announcement = `${spokenTriadName(triad)}, ${selected.diatonic.numeral} in ${spokenScale}: ${spokenTones}. Triad shapes on strings ${stringSet.numbers}.`;
  // Uncommon spellings (D♯ major) are kept as chosen; the common alternative is only mentioned.
  const commonAlternative = scaleHasDoubleAccidentals(scale)
    ? simplerEnharmonicTonic(
        scale,
        CHORD_ROOTS.map((root) => root.note),
      )
    : null;

  const buildFretboard = (preferences: ScaleFretboardPreferences) =>
    buildKeyFretboardModel(scale, triad, preferences, tuning, FRETBOARD_MAX_FRET);

  // Legend samples use the key's own degree labels, so they match what the dots print.
  const degreeOf = (noteText: string) =>
    degreeLabels[notes.findIndex((note) => noteName(note) === noteText)] ?? '1';
  const chordRootDegree = degreeOf(noteName(triad.root));
  const chordToneDegree = degreeOf(noteName(triad.tones[1].note));
  const otherDegree =
    degreeLabels.find((_, index) => index > 0 && !chordToneByName.has(noteName(notes[index]))) ??
    '2';
  const fretboardLegend = (preferences: ScaleFretboardPreferences): FretboardLegendEntry[] => [
    { key: 'key-root', label: 'Key root', tone: 'scale', sample: '1', isKeyRoot: true },
    ...(preferences.highlightChord
      ? ([
          {
            key: 'chord-root',
            label: 'Selected chord root',
            tone: 'root',
            sample: chordRootDegree,
          },
          {
            key: 'chord',
            label: 'Selected chord tone',
            tone: 'chord',
            sample: chordToneDegree,
          },
        ] as const)
      : []),
    { key: 'scale', label: 'Other scale note', tone: 'scale', sample: otherDegree },
  ];

  return (
    <div className="key-chords">
      {lead}
      {picker}

      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <div className="stack">
        <div className="field">
          <span className="field__label">Scale type</span>
          <ToggleButtons
            label="Scale type"
            options={SCALE_TYPES.map((type) => ({ id: type, label: SCALE_TYPE_LABELS[type] }))}
            value={scaleType}
            onChange={setScaleType}
          />
        </div>

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
                highlightDescription: tone
                  ? `${chordToneLabel(tone)} of ${spokenTriadName(triad)}`
                  : undefined,
              };
            })}
          />
          <p className="note-text">
            Highlighted notes are the tones of {triad.name}: {toneSummary}.
          </p>
          {commonAlternative && (
            <p className="note-text" data-testid="enharmonic-note">
              {name} uses double {tonic.note.accidental > 0 ? 'sharps' : 'flats'}.{' '}
              {scaleName({ tonic: commonAlternative, type: scaleType })} is its more commonly
              written enharmonic equivalent.
            </p>
          )}
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

        <FretboardSection
          id="key-fretboard"
          title={`${name} on the fretboard`}
          highlightLine={`${triad.name} highlighted`}
          labelMode={fretboardLabelMode}
          onLabelModeChange={onFretboardLabelModeChange}
          buildModel={buildFretboard}
          legend={fretboardLegend}
        />

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
