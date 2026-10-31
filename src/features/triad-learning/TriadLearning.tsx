import { LabeledSelect } from '../../components/LabeledSelect';
import { TriadInversionGrid } from '../../components/triads/TriadInversionGrid';
import { fretboardModel } from '../../components/triads/triadViewModels';
import { CHORD_ROOTS, chordTypeForTriad, rootOptionById } from '../../data';
import {
  describeStringSet,
  STANDARD_TUNING,
  stringSetById,
  TRIAD_STRING_SETS,
  triadVoicings,
} from '../../domain/guitar';
import { buildTriad, triadNoteNames } from '../../domain/music';
import { TriadControls } from './TriadControls';
import { TriadFretboardSection } from './TriadFretboardSection';
import { TriadSummary } from './TriadSummary';
import type { TriadLearningState } from './useTriadLearningState';
import './TriadLearning.css';

interface TriadLearningProps {
  /** Owned by the app shell so that other sections can send a chord here to practise. */
  state: TriadLearningState;
}

/**
 * Learn triads tab. Like Explore chords, it opens empty: the user picks a root and presses
 * "Show triads", after which quality, string set and label mode are live controls. The triad,
 * its inversions and every fret position are derived during render.
 */
export function TriadLearning({ state }: TriadLearningProps) {
  const { selections, setPickedRootId, showPickedRoot, setQuality, setStringSetId, setLabelMode } =
    state;
  const tuning = STANDARD_TUNING;

  const root = selections.rootId === null ? null : rootOptionById(CHORD_ROOTS, selections.rootId);
  const stringSet = stringSetById(selections.stringSetId) ?? TRIAD_STRING_SETS[0];
  const triad = root ? buildTriad(root.note, chordTypeForTriad(selections.quality)) : null;
  const voicings = triad ? triadVoicings(triad, stringSet, tuning) : [];
  const stringSetLowToHigh = describeStringSet(stringSet, tuning);
  const announcement = triad
    ? `${triad.name}, ${triadNoteNames(triad.tones).join(' ')}, on ${stringSet.name.toLowerCase()}.`
    : '';

  return (
    <div className="triad-learning">
      <div className="section-lead">
        <h2 className="section-title">Three notes, three positions.</h2>
        <p className="section-subtitle">
          Follow a triad from its formula to its notes, then to each inversion on three strings.
        </p>
      </div>

      <form
        className="controls"
        onSubmit={(event) => {
          event.preventDefault();
          showPickedRoot();
        }}
      >
        <LabeledSelect
          id="triad-root"
          label="Root note"
          value={selections.pickedRootId}
          options={CHORD_ROOTS}
          onChange={setPickedRootId}
        />
        <button type="submit" className="button">
          Show triads
        </button>
      </form>

      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      {!triad && (
        <p className="empty-state">Pick a root note and show its triads to get started.</p>
      )}

      {triad && (
        <div className="stack">
          <TriadControls
            selections={selections}
            onQualityChange={setQuality}
            onStringSetChange={setStringSetId}
            onLabelModeChange={setLabelMode}
          />
          <TriadSummary triad={triad} />
          <TriadInversionGrid
            voicings={voicings}
            labelMode={selections.labelMode}
            tuning={tuning}
          />
          <TriadFretboardSection
            model={fretboardModel(voicings, selections.labelMode, tuning)}
            stringSetName={stringSet.name}
            stringSetLowToHigh={stringSetLowToHigh}
          />
        </div>
      )}
    </div>
  );
}
