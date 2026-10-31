import {
  describeStringSet,
  TRIAD_STRING_SETS,
  type GuitarTuning,
  type StringSetId,
} from '../../domain/guitar';
import { ToggleButtons } from '../ToggleButtons';

interface StringSetSelectorProps {
  value: StringSetId;
  onChange: (id: StringSetId) => void;
  tuning: GuitarTuning;
}

/**
 * The four adjacent three-string groups. Each button names the set as guitarists do
 * ("1–2–3 · Treble", string 1 being the high e) and, underneath, the strings low to high
 * with their open notes ("3–2–1 · G–B–e"), which is the order the voicings are written in.
 */
export function StringSetSelector({ value, onChange, tuning }: StringSetSelectorProps) {
  return (
    <div className="field">
      <span className="field__label">
        String set <span className="field__hint">· string 1 is the high e</span>
      </span>
      <ToggleButtons
        label="String set"
        options={TRIAD_STRING_SETS.map((set) => {
          const lowToHigh = describeStringSet(set, tuning);
          return {
            id: set.id,
            label: set.descriptor ? `${set.numbers} · ${set.descriptor}` : set.numbers,
            hint: lowToHigh,
            description: `strings ${lowToHigh} low to high`,
          };
        })}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
