import { useState } from 'react';

/**
 * The finder's state: the text in the box, the text last submitted, and the shape the user
 * picked for that submission (by definition id). The search result itself is derived.
 */
export interface ChordFinderSelections {
  readonly draft: string;
  readonly submitted: string | null;
  readonly selectedShapeId: string | null;
}

export function useChordFinderState() {
  const [selections, setSelections] = useState<ChordFinderSelections>({
    draft: '',
    submitted: null,
    selectedShapeId: null,
  });

  return {
    selections,
    setDraft: (draft: string) => setSelections((current) => ({ ...current, draft })),
    /** Submit the given text (an example) or the current draft; a new search resets the shape. */
    submit: (text?: string) =>
      setSelections((current) => {
        const draft = text ?? current.draft;
        return { draft, submitted: draft, selectedShapeId: null };
      }),
    selectShape: (selectedShapeId: string) =>
      setSelections((current) => ({ ...current, selectedShapeId })),
  };
}
