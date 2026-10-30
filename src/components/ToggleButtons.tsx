import './ToggleButtons.css';

export interface ToggleOption<Id extends string> {
  id: Id;
  label: string;
  /** Extra text for assistive technology, e.g. the full chord name behind a symbol. */
  description?: string;
  /** Small visible text under the label, e.g. the strings of a set written low to high. */
  hint?: string;
}

interface ToggleButtonsProps<Id extends string> {
  label: string;
  options: readonly ToggleOption<Id>[];
  value: Id | null;
  onChange: (id: Id) => void;
  size?: 'md' | 'sm';
}

/**
 * A row of mutually exclusive buttons. Uses `aria-pressed` rather than radio semantics so
 * each option stays a plain button that works with Tab and Enter.
 */
export function ToggleButtons<Id extends string>({
  label,
  options,
  value,
  onChange,
  size = 'md',
}: ToggleButtonsProps<Id>) {
  return (
    <div className={`toggle-buttons toggle-buttons--${size}`} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`toggle-buttons__button${option.hint ? ' toggle-buttons__button--stacked' : ''}`}
          aria-pressed={option.id === value}
          aria-label={option.description ? `${option.label}, ${option.description}` : undefined}
          onClick={() => onChange(option.id)}
        >
          {option.hint ? (
            <>
              <span className="toggle-buttons__label">{option.label}</span>
              <span className="toggle-buttons__hint">{option.hint}</span>
            </>
          ) : (
            option.label
          )}
        </button>
      ))}
    </div>
  );
}
