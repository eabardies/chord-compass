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
 * Learn triads tab. State is four selections (root, quality, string set, label mode); the
 * triad, its inversions and every fret position are derived during render.
 */
export function TriadLearning({ state }: TriadLearningProps) {
  const { selections, setRootId, setQuality, setStringSetId, setLabelMode } = state;
  const tuning = STANDARD_TUNING;

  const root = rootOptionById(CHORD_ROOTS, selections.rootId) ?? CHORD_ROOTS[0];
  const stringSet = stringSetById(selections.stringSetId) ?? TRIAD_STRING_SETS[0];
  const triad = buildTriad(root.note, chordTypeForTriad(selections.quality));
  const voicings = triadVoicings(triad, stringSet, tuning);
  const stringSetLowToHigh = describeStringSet(stringSet, tuning);
  const announcement = `${triad.name}, ${triadNoteNames(triad.tones).join(' ')}, on ${stringSet.name.toLowerCase()}.`;

  return (
    <div className="triad-learning">
      <div className="section-lead">
        <h2 className="section-title">Three notes, three positions.</h2>
        <p className="section-subtitle">
          Follow a triad from its formula to its notes, then to each inversion on three strings.
        </p>
      </div>

      <TriadControls
        selections={selections}
        onRootChange={setRootId}
        onQualityChange={setQuality}
        onStringSetChange={setStringSetId}
        onLabelModeChange={setLabelMode}
      />

      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <div className="stack">
        <TriadSummary triad={triad} />
        <TriadInversionGrid voicings={voicings} labelMode={selections.labelMode} tuning={tuning} />
        <TriadFretboardSection
          model={fretboardModel(voicings, selections.labelMode, tuning)}
          stringSetName={stringSet.name}
          stringSetLowToHigh={stringSetLowToHigh}
        />
      </div>
    </div>
  );
}
