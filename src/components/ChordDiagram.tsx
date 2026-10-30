import { describeShape, hasOpenString, type VoicedShape } from '../domain/guitar';
import { noteName } from '../domain/music';
import './ChordDiagram.css';

interface ChordDiagramProps {
  shape: VoicedShape;
  /** Hide finger numbers when the fingering has not been verified by a player. */
  showFingers?: boolean;
  /**
   * Short accessible name, e.g. "C/B, open position, shape x2x010". When given, the full
   * string-by-string text becomes the description instead of the name.
   */
  label?: string;
}

// Geometry in SVG units; the SVG scales to its container.
const STRING_GAP = 22;
const FRET_GAP = 26;
const LEFT = 32;
const TOP = 30;
const RIGHT = 14;
const BOTTOM = 26;
const MIN_FRETS_SHOWN = 5;
const DOT_RADIUS = 8;

/**
 * Responsive SVG chord diagram: strings run vertically, low E on the left, frets run down.
 * First-position shapes show the nut; higher shapes show their starting fret number.
 */
export function ChordDiagram({ shape, showFingers = true, label }: ChordDiagramProps) {
  const stringCount = shape.frets.length;
  const highestFret = Math.max(0, ...shape.frets.filter((fret): fret is number => fret !== null));
  // Open shapes and shapes near the nut are drawn from fret 1 so the nut stays visible.
  const startFret = hasOpenString(shape.frets) || shape.lowestFret <= 2 ? 1 : shape.lowestFret;
  const fretsShown = Math.max(MIN_FRETS_SHOWN, highestFret - startFret + 1);
  const width = LEFT + STRING_GAP * (stringCount - 1) + RIGHT;
  const height = TOP + FRET_GAP * fretsShown + BOTTOM;
  const stringX = (index: number) => LEFT + index * STRING_GAP;
  const fretY = (fret: number) => TOP + (fret - startFret + 0.5) * FRET_GAP;
  const description = describeShape(shape);

  return (
    <svg
      className="chord-diagram"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label ?? description}
      aria-description={label ? description : undefined}
    >
      <title>{label ?? description}</title>
      {label && <desc>{description}</desc>}

      {/* Nut or starting fret */}
      {startFret === 1 ? (
        <rect
          className="chord-diagram__nut"
          x={stringX(0) - 1}
          y={TOP - 3}
          width={STRING_GAP * (stringCount - 1) + 2}
          height={4}
          rx={1}
        />
      ) : (
        <text
          className="chord-diagram__fret-number"
          x={LEFT - 10}
          y={fretY(startFret) + 4}
          textAnchor="end"
        >
          {startFret}fr
        </text>
      )}

      {/* Fret lines */}
      {Array.from({ length: fretsShown + 1 }, (_, row) => (
        <line
          key={`fret-${row}`}
          className="chord-diagram__line"
          x1={stringX(0)}
          x2={stringX(stringCount - 1)}
          y1={TOP + row * FRET_GAP}
          y2={TOP + row * FRET_GAP}
        />
      ))}

      {/* Strings */}
      {shape.strings.map((string) => (
        <line
          key={`string-${string.index}`}
          className="chord-diagram__line"
          x1={stringX(string.index)}
          x2={stringX(string.index)}
          y1={TOP}
          y2={TOP + fretsShown * FRET_GAP}
        />
      ))}

      {/* Barres sit under the finger dots */}
      {shape.barres.map((barre) => (
        <rect
          key={`barre-${barre.fret}-${barre.fromString}`}
          className="chord-diagram__barre"
          x={stringX(barre.fromString) - DOT_RADIUS}
          y={fretY(barre.fret) - DOT_RADIUS}
          width={stringX(barre.toString) - stringX(barre.fromString) + DOT_RADIUS * 2}
          height={DOT_RADIUS * 2}
          rx={DOT_RADIUS}
        />
      ))}

      {/* Open / muted markers and finger dots */}
      {shape.strings.map((string) => {
        const x = stringX(string.index);
        if (string.fret === null) {
          return (
            <text
              key={`mark-${string.index}`}
              className="chord-diagram__muted"
              x={x}
              y={TOP - 11}
              textAnchor="middle"
            >
              ×
            </text>
          );
        }
        if (string.fret === 0) {
          return (
            <circle
              key={`mark-${string.index}`}
              className="chord-diagram__open"
              cx={x}
              cy={TOP - 14}
              r={4.5}
            />
          );
        }
        return (
          <g key={`dot-${string.index}`}>
            <circle className="chord-diagram__dot" cx={x} cy={fretY(string.fret)} r={DOT_RADIUS} />
            {showFingers && string.finger !== null && (
              <text
                className="chord-diagram__finger"
                x={x}
                y={fretY(string.fret) + 3.5}
                textAnchor="middle"
              >
                {string.finger}
              </text>
            )}
          </g>
        );
      })}

      {/* String names */}
      {shape.strings.map((string) => (
        <text
          key={`name-${string.index}`}
          className="chord-diagram__string-name"
          x={stringX(string.index)}
          y={height - 8}
          textAnchor="middle"
        >
          {string.index === stringCount - 1
            ? noteName(string.openNote).toLowerCase()
            : noteName(string.openNote)}
        </text>
      ))}
    </svg>
  );
}
