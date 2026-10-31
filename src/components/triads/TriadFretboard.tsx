import type { FretboardGroupModel, TriadFretboardModel } from './triadDiagramModels';
import { markerHeight, markerWidth } from '../markerGeometry';
import { NoteMarker } from '../NoteMarker';
import './TriadFretboard.css';

interface TriadFretboardProps {
  model: TriadFretboardModel;
}

// Geometry in SVG units. The SVG keeps its natural width and scrolls on narrow screens.
const LEFT = 52;
const OPEN_COLUMN = 40;
const MIN_FRET_WIDTH = 46;
const FLAT_STRING_GAP = 32;
const STACKED_STRING_GAP = 42;
const FRET_NUMBER_ROW = 18;
const LABEL_ROW_GAP = 16;
const LABEL_ROWS_TOP = 10;
const BOTTOM = 10;
const GROUP_PADDING = 4;
const LABEL_CHAR_WIDTH = 6.2;
const INLAY_FRETS = [3, 5, 7, 9, 12, 15];
const DOUBLE_INLAY_FRETS = [12];

/**
 * A horizontal fretboard showing where each inversion of one triad sits on the chosen three
 * strings. Tab orientation: string 1 on top, nut on the left, fret 0 as a column before the
 * nut, fret numbers above the neck. All six strings are drawn; each inversion is boxed over
 * the strings of the set and labelled so the three shapes read as positions of one chord.
 */
export function TriadFretboard({ model }: TriadFretboardProps) {
  const markers = model.groups.flatMap((group) => group.markers);
  const stacked = markers.some((marker) => marker.sublabel);
  const widestMarker = Math.max(
    0,
    ...markers.map((marker) => markerWidth(marker.label, marker.sublabel)),
  );
  const tallestMarker = Math.max(0, ...markers.map((marker) => markerHeight(marker.sublabel)));
  const stringGap = Math.max(stacked ? STACKED_STRING_GAP : FLAT_STRING_GAP, tallestMarker + 8);
  const fretWidth = Math.max(MIN_FRET_WIDTH, widestMarker + 10);
  const openColumn = Math.max(OPEN_COLUMN, widestMarker + 6);
  const nutX = LEFT + openColumn;
  const fretLineX = (fret: number) => nutX + fret * fretWidth;
  const columnCenter = (fret: number) =>
    fret === 0 ? LEFT + openColumn / 2 : fretLineX(fret) - fretWidth / 2;
  const columnLeft = (fret: number) => (fret === 0 ? LEFT : fretLineX(fret - 1));
  const columnRight = (fret: number) => (fret === 0 ? nutX : fretLineX(fret));
  const labels = placeGroupLabels(model.groups, columnLeft, columnRight);
  const labelRows = Math.max(0, ...labels.map((label) => label.row + 1));
  const top = LABEL_ROWS_TOP + labelRows * LABEL_ROW_GAP + FRET_NUMBER_ROW;
  const count = model.strings.length;
  const stringY = (index: number) => top + stringGap / 2 + (count - 1 - index) * stringGap;
  const boardTop = top;
  const boardBottom = top + count * stringGap;
  const activeIndexes = model.strings.filter((s) => s.active).map((s) => s.index);
  const bandTop = stringY(Math.max(...activeIndexes)) - stringGap / 2;
  const bandBottom = stringY(Math.min(...activeIndexes)) + stringGap / 2;
  const width = fretLineX(model.maxFret) + 12;
  const height = boardBottom + BOTTOM;
  const inlayY = (between: [number, number]) => (stringY(between[0]) + stringY(between[1])) / 2;

  return (
    <svg
      className="triad-fretboard"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={model.title}
      aria-description={model.description}
    >
      <title>{model.title}</title>
      <desc>{model.description}</desc>

      <rect
        className="triad-fretboard__board"
        x={nutX}
        y={boardTop}
        width={fretLineX(model.maxFret) - nutX}
        height={boardBottom - boardTop}
      />

      {INLAY_FRETS.filter((fret) => fret <= model.maxFret).map((fret) =>
        DOUBLE_INLAY_FRETS.includes(fret) ? (
          <g key={`inlay-${fret}`}>
            <circle
              className="triad-fretboard__inlay"
              cx={columnCenter(fret)}
              cy={inlayY([3, 4])}
              r={4}
            />
            <circle
              className="triad-fretboard__inlay"
              cx={columnCenter(fret)}
              cy={inlayY([1, 2])}
              r={4}
            />
          </g>
        ) : (
          <circle
            key={`inlay-${fret}`}
            className="triad-fretboard__inlay"
            cx={columnCenter(fret)}
            cy={inlayY([2, 3])}
            r={4}
          />
        ),
      )}

      <rect
        className="triad-fretboard__active-band"
        x={0}
        y={bandTop}
        width={width}
        height={bandBottom - bandTop}
        rx={6}
      />

      <rect
        className="triad-fretboard__nut"
        x={nutX - 2}
        y={boardTop}
        width={4}
        height={boardBottom - boardTop}
        rx={1}
      />
      {Array.from({ length: model.maxFret }, (_, index) => index + 1).map((fret) => (
        <line
          key={`fret-${fret}`}
          className="triad-fretboard__fret"
          x1={fretLineX(fret)}
          x2={fretLineX(fret)}
          y1={boardTop}
          y2={boardBottom}
        />
      ))}

      {model.strings.map((string) => (
        <g key={`string-${string.index}`}>
          <line
            className={`triad-fretboard__string${string.active ? ' triad-fretboard__string--active' : ''}`}
            data-string={string.number}
            data-active={string.active}
            x1={LEFT}
            x2={fretLineX(model.maxFret)}
            y1={stringY(string.index)}
            y2={stringY(string.index)}
          />
          <text
            className={`triad-fretboard__string-name${string.active ? ' triad-fretboard__string-name--active' : ''}`}
            x={LEFT - 8}
            y={stringY(string.index) + 4}
            textAnchor="end"
          >
            {string.number} · {string.name}
          </text>
        </g>
      ))}

      {model.groups.map((group) => (
        <rect
          key={`box-${group.id}`}
          className={`triad-fretboard__group${group.playable ? '' : ' triad-fretboard__group--stretch'}`}
          x={columnLeft(group.lowestFret) + GROUP_PADDING}
          y={bandTop - GROUP_PADDING}
          width={columnRight(group.highestFret) - columnLeft(group.lowestFret) - GROUP_PADDING * 2}
          height={bandBottom - bandTop + GROUP_PADDING * 2}
          rx={10}
        />
      ))}

      {labels.map((label) => (
        <text
          key={`label-${label.id}`}
          className="triad-fretboard__group-label"
          x={label.x}
          y={LABEL_ROWS_TOP + (labelRows - 1 - label.row) * LABEL_ROW_GAP + 2}
          textAnchor="middle"
        >
          {label.text}
        </text>
      ))}

      {Array.from({ length: model.maxFret + 1 }, (_, fret) => (
        <text
          key={`number-${fret}`}
          className="triad-fretboard__fret-number"
          data-fret-number={fret}
          x={columnCenter(fret)}
          y={boardTop - 6}
          textAnchor="middle"
        >
          {fret}
        </text>
      ))}

      {model.groups.flatMap((group) =>
        group.markers.map((marker) => (
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
        )),
      )}
    </svg>
  );
}

interface PlacedLabel {
  id: string;
  text: string;
  x: number;
  width: number;
  row: number;
}

/**
 * Centre each inversion label over its box; when two boxes sit close together, lift the
 * later label to a second row so the texts never overlap.
 */
function placeGroupLabels(
  groups: readonly FretboardGroupModel[],
  columnLeft: (fret: number) => number,
  columnRight: (fret: number) => number,
): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  const ordered = [...groups].sort((a, b) => a.lowestFret - b.lowestFret);
  for (const group of ordered) {
    const x = (columnLeft(group.lowestFret) + columnRight(group.highestFret)) / 2;
    const width = group.label.length * LABEL_CHAR_WIDTH;
    const overlaps = (other: PlacedLabel) => Math.abs(other.x - x) < (other.width + width) / 2 + 8;
    let row = 0;
    while (placed.some((other) => other.row === row && overlaps(other))) row += 1;
    placed.push({ id: group.id, text: group.label, x, width, row });
  }
  return placed;
}
