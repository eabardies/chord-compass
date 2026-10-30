import { useState } from 'react';
import type { StringSetId } from '../../domain/guitar';
import type { TriadQuality } from '../../domain/music';
import type { MarkerLabelMode } from './markerLabels';

/**
 * The four user selections of the Learn triads tab. Everything shown (formula, notes,
 * inversions, frets) is derived from these during render; nothing derived is stored.
 */
export interface TriadLearningSelections {
  readonly rootId: string;
  readonly quality: TriadQuality;
  readonly stringSetId: StringSetId;
  readonly labelMode: MarkerLabelMode;
}

export const DEFAULT_TRIAD_SELECTIONS: TriadLearningSelections = {
  rootId: 'A',
  quality: 'major',
  stringSetId: 'strings-1-2-3',
  labelMode: 'degrees',
};

export function useTriadLearningState(initial = DEFAULT_TRIAD_SELECTIONS) {
  const [selections, setSelections] = useState<TriadLearningSelections>(initial);
  const update = <Key extends keyof TriadLearningSelections>(
    key: Key,
    value: TriadLearningSelections[Key],
  ) => setSelections((current) => ({ ...current, [key]: value }));

  return {
    selections,
    setRootId: (rootId: string) => update('rootId', rootId),
    setQuality: (quality: TriadQuality) => update('quality', quality),
    setStringSetId: (stringSetId: StringSetId) => update('stringSetId', stringSetId),
    setLabelMode: (labelMode: MarkerLabelMode) => update('labelMode', labelMode),
  };
}
