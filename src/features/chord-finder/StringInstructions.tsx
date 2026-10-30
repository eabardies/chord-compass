import { lowestSoundingString, stringNumber, type VoicedShape } from '../../domain/guitar';
import { noteName } from '../../domain/music';

interface StringInstructionsProps {
  shape: VoicedShape;
}

const STRING_NAMES: Record<number, string> = {
  6: 'low E',
  5: 'A',
  4: 'D',
  3: 'G',
  2: 'B',
  1: 'high e',
};

/**
 * Six cells, low E to high e: muted (×), open (○) or the fret, plus the finger, with the
 * lowest sounding string marked as the place to start strumming.
 */
export function StringInstructions({ shape }: StringInstructionsProps) {
  const start = lowestSoundingString(shape.frets);
  return (
    <ol className="string-cells" aria-label="Strings, low E to high e">
      {shape.strings.map((string) => {
        const number = stringNumber(string.index);
        const name = STRING_NAMES[number] ?? noteName(string.openNote);
        const isStart = string.index === start;
        const state =
          string.fret === null
            ? { symbol: '×', text: 'muted', modifier: 'muted' }
            : string.fret === 0
              ? { symbol: '○', text: 'open', modifier: 'open' }
              : { symbol: String(string.fret), text: `fret ${string.fret}`, modifier: 'fretted' };
        const finger =
          string.fret !== null && string.fret > 0 && string.finger !== null
            ? `finger ${string.finger}`
            : null;
        const accessible = [
          `String ${number}, ${name}`,
          state.text,
          finger,
          isStart ? 'start here' : null,
        ]
          .filter((part) => part !== null)
          .join(', ');
        return (
          <li
            key={string.index}
            className={`string-cells__item string-cells__item--${state.modifier}${isStart ? ' string-cells__item--start' : ''}`}
            aria-label={accessible}
          >
            <span className="string-cells__string" aria-hidden="true">
              {number} · {name}
            </span>
            <span className="string-cells__state" aria-hidden="true">
              {state.symbol}
            </span>
            <span className="string-cells__detail" aria-hidden="true">
              {finger ?? state.text}
            </span>
            {isStart && (
              <span className="string-cells__start" aria-hidden="true">
                Start here
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
