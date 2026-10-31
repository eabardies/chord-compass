interface SelectOption {
  id: string;
  label: string;
  /** Read instead of the label by assistive technology, e.g. "C sharp" for "C♯". */
  spokenName?: string;
}

interface LabeledSelectProps {
  id: string;
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (id: string) => void;
}

export function LabeledSelect({ id, label, value, options, onChange }: LabeledSelectProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id} aria-label={option.spokenName}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
