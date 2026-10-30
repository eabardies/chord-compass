import type { FormEvent } from 'react';

interface ChordSearchFormProps {
  draft: string;
  examples: readonly string[];
  onDraftChange: (text: string) => void;
  onSubmit: () => void;
  onExample: (symbol: string) => void;
}

/** The search box, its button, and the clickable examples. Submits on Enter or the button only. */
export function ChordSearchForm({
  draft,
  examples,
  onDraftChange,
  onSubmit,
  onExample,
}: ChordSearchFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="chord-search" onSubmit={handleSubmit} role="search">
      <div className="chord-search__row">
        <div className="field chord-search__field">
          <label className="field__label" htmlFor="chord-symbol">
            Chord symbol
          </label>
          <input
            id="chord-symbol"
            className="chord-search__input"
            type="text"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="C/B"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="search"
          />
        </div>
        <button type="submit" className="button chord-search__button">
          Find chord
        </button>
      </div>
      <div className="chord-search__examples">
        <span className="chord-search__examples-label" id="chord-examples-label">
          Try
        </span>
        <ul className="chord-search__example-list" aria-labelledby="chord-examples-label">
          {examples.map((symbol) => (
            <li key={symbol}>
              <button
                type="button"
                className="chord-search__example"
                onClick={() => onExample(symbol)}
              >
                {symbol}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
