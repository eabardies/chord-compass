import type { TriadDiagramModel } from './triadDiagramModels';
import { markerHeight, markerWidth } from '../markerGeometry';
import { NoteMarker } from '../NoteMarker';
import './TriadDiagram.css';

interface TriadDiagramProps {
  model: TriadDiagramModel;
}

// Geometry in SVG units; the SVG scales to its container.
const LABEL_GUTTER = 46;
const OPEN_COLUMN = 32;
const MIN_FRET_WIDTH = 44;
const TOP = 24;
const BOTTOM = 8;
const RIGHT = 8;
const NUT_WIDTH = 5;
const FLAT_STRING_GAP = 32;
const STACKED_STRING_GAP = 42;

/**
 * One triad voicing on a horizontal neck in tablature orientation: string 1 (high e) at the
 * top, string 6 (low E) at the bottom, the nut on the left, fret numbers above each column.
 * All six strings are drawn so the three of the set can be seen in place; the others are
 * thinner and unlabelled by markers. Labels arrive formatted in the model.
 */
export function TriadDiagram({ model }: TriadDiagramProps) {
  const stacked = model.markers.some((marker) => marker.sublabel);
  const widestMarker = Math.max(
    0,
    ...model.markers.map((marker) => markerWidth(marker.label, marker.sublabel)),
  );
  const tallestMarker = Math.max(0, ...model.markers.map((m) => markerHeight(m.sublabel)));
  const stringGap = Math.max(stacked ? STACKED_STRING_GAP : FLAT_STRING_GAP, tallestMarker + 8);
  const fretWidth = Math.max(MIN_FRET_WIDTH, widestMarker + 12);
  const openColumn = model.showNut ? Math.max(OPEN_COLUMN, widestMarker + 8) : 0;
  const boardLeft = LABEL_GUTTER + openColumn;
  const fretLineX = (column: number) => boardLeft + column * fretWidth;
  const boardRight = fretLineX(model.fretsShown);
  const columnCenter = (fret: number) =>
    fret === 0 ? LABEL_GUTTER + openColumn / 2 : fretLineX(fret - model.startFret) + fretWidth / 2;
  const count = model.strings.length;
  // Tab orientation: the highest string (index 5) on top, the low E (index 0) at the bottom.
  const stringY = (index: number) => TOP + stringGap / 2 + (count - 1 - index) * stringGap;
  const boardTop = TOP;
  const boardBottom = TOP + count * stringGap;
  const width = boardRight + RIGHT;
  const height = boardBottom + BOTTOM;
  const activeIndexes = model.strings.filter((s) => s.active).map((s) => s.index);
  const bandTop = stringY(Math.max(...activeIndexes)) - stringGap / 2;
  const bandBottom = stringY(Math.min(...activeIndexes)) + stringGap / 2;
  const fretNumbers = Array.from({ length: model.fretsShown }, (_, i) => model.startFret + i);

  return (
    <figure className="triad-diagram">
      <figcaption className="triad-diagram__orientation">
        <span className="triad-diagram__orientation-view">Tab view · high e at top</span>
        <span className="triad-diagram__orientation-ends" aria-hidden="true">
          <span>Nut ←</span>
          <span>→ Bridge</span>
        </span>
      </figcaption>
      <svg
        className="triad-diagram__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={model.title}
        aria-description={model.description}
        data-start-fret={model.startFret}
        data-frets-shown={model.fretsShown}
      >
        <title>{model.title}</title>
        <desc>{model.description}</desc>

        <rect
          className="triad-diagram__board"
          x={boardLeft}
          y={boardTop}
          width={boardRight - boardLeft}
          height={boardBottom - boardTop}
        />

        {/* The strings of the set: a soft band makes the group visible before any marker. */}
        <rect
          className="triad-diagram__active-band"
          data-testid="active-band"
          x={0}
          y={bandTop}
          width={width}
          height={bandBottom - bandTop}
          rx={6}
        />

        {model.showNut ? (
          <rect
            className="triad-diagram__nut"
            data-testid="nut"
            x={boardLeft - NUT_WIDTH / 2}
            y={boardTop}
            width={NUT_WIDTH}
            height={boardBottom - boardTop}
            rx={1}
          />
        ) : (
          <line
            className="triad-diagram__fret"
            x1={boardLeft}
            x2={boardLeft}
            y1={boardTop}
            y2={boardBottom}
          />
        )}
        {fretNumbers.map((_, column) => (
          <line
            key={`fret-${column + 1}`}
            className="triad-diagram__fret"
            x1={fretLineX(column + 1)}
            x2={fretLineX(column + 1)}
            y1={boardTop}
            y2={boardBottom}
          />
        ))}

        {model.strings.map((string) => (
          <g key={`string-${string.index}`}>
            <line
              className={`triad-diagram__string${string.active ? ' triad-diagram__string--active' : ''}`}
              data-string={string.number}
              data-active={string.active}
              x1={model.showNut ? LABEL_GUTTER : boardLeft}
              x2={boardRight}
              y1={stringY(string.index)}
              y2={stringY(string.index)}
            />
            <text
              className={`triad-diagram__string-name${string.active ? ' triad-diagram__string-name--active' : ''}`}
              data-string-label={string.number}
              x={LABEL_GUTTER - 8}
              y={stringY(string.index) + 4}
              textAnchor="end"
            >
              {string.number} · {string.name}
            </text>
          </g>
        ))}

        {model.showNut && (
          <text
            className="triad-diagram__fret-number"
            data-fret-number={0}
            x={columnCenter(0)}
            y={TOP - 8}
            textAnchor="middle"
          >
            0
          </text>
        )}
        {fretNumbers.map((fret, column) => (
          <text
            key={`number-${fret}`}
            className={`triad-diagram__fret-number${!model.showNut && column === 0 ? ' triad-diagram__fret-number--start' : ''}`}
            data-fret-number={fret}
            x={columnCenter(fret)}
            y={TOP - 8}
            textAnchor="middle"
          >
            {fret}
          </text>
        ))}

        {model.markers.map((marker) => (
          <NoteMarker
            key={marker.id}
            cx={columnCenter(marker.fret)}
            cy={stringY(marker.stringIndex)}
            label={marker.label}
            sublabel={marker.sublabel}
            isRoot={marker.isRoot}
            open={marker.fret === 0}
            data={{
              string: count - marker.stringIndex,
              fret: marker.fret,
              degree: marker.degree,
              note: marker.note,
            }}
          />
        ))}
      </svg>
    </figure>
  );
}
