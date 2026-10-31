import { useState } from 'react';
import type { StringSetId } from '../../domain/guitar';
import type { TriadQuality } from '../../domain/music';
import type { MarkerLabelMode } from '../../components/triads/markerLabels';

/**
 * The user selections of the Learn triads tab. `pickedRootId` is what the root picker shows;
 * `rootId` is the root whose triads are on screen, `null` until the user presses "Show triads"
 * (or another tab sends a chord here). Everything shown (formula, notes, inversions, frets) is
 * derived from these during render; nothing derived is stored.
 */
export interface TriadLearningSelections {
  readonly pickedRootId: string;
  readonly rootId: string | null;
  readonly quality: TriadQuality;
  readonly stringSetId: StringSetId;
  readonly labelMode: MarkerLabelMode;
}

/** What another section asks the tab to show: "practise all C major triads on these strings". */
export interface TriadPracticeRequest {
  readonly rootId: string;
  readonly quality: TriadQuality;
  readonly stringSetId: StringSetId;
}

export const DEFAULT_TRIAD_SELECTIONS: TriadLearningSelections = {
  pickedRootId: 'A',
  rootId: null,
  quality: 'major',
  stringSetId: 'strings-1-2-3',
  labelMode: 'both',
};

export type TriadLearningState = ReturnType<typeof useTriadLearningState>;

export function useTriadLearningState(initial = DEFAULT_TRIAD_SELECTIONS) {
  const [selections, setSelections] = useState<TriadLearningSelections>(initial);
  const update = <Key extends keyof TriadLearningSelections>(
    key: Key,
    value: TriadLearningSelections[Key],
  ) => setSelections((current) => ({ ...current, [key]: value }));

  return {
    selections,
    setPickedRootId: (pickedRootId: string) => update('pickedRootId', pickedRootId),
    /** "Show triads": the picked root becomes the shown root. */
    showPickedRoot: () =>
      setSelections((current) => ({ ...current, rootId: current.pickedRootId })),
    setQuality: (quality: TriadQuality) => update('quality', quality),
    setStringSetId: (stringSetId: StringSetId) => update('stringSetId', stringSetId),
    setLabelMode: (labelMode: MarkerLabelMode) => update('labelMode', labelMode),
    /** Switch the tab to a chord sent from elsewhere, keeping the label preference. */
    practise: (request: TriadPracticeRequest) =>
      setSelections((current) => ({ ...current, ...request, pickedRootId: request.rootId })),
  };
}
