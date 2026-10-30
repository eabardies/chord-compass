import type { FretboardGroupModel, TriadFretboardModel } from './triadDiagramModels';
import { markerWidth } from './markerGeometry';
import { NoteMarker } from './NoteMarker';
import './TriadFretboard.css';

interface TriadFretboardProps {
  model: TriadFretboardModel;
}

// Geometry in SVG units. The SVG keeps its natural width and scrolls on narrow screens.
const LEFT = 52;
const OPEN_COLUMN = 40;
const MIN_FRET_WIDTH = 46;
const STRING_GAP = 34;
const TOP = 72;
const BOTTOM = 26;
const BOARD_PADDING = STRING_GAP / 2;
const GROUP_PADDING = 4;
const LABEL_CHAR_WIDTH = 6.2;
const LABEL_ROW_GAP = 16;
const INLAY_FRETS = [3, 5, 7, 9, 12, 15];
const DOUBLE_INLAY_FRETS = [12];

/**
 * A horizontal fretboard showing where each inversion of one triad sits on the chosen three
 * strings. The highest string is on top, like tablature; fret 0 is a column left of the nut.
 * Each inversion is boxed and labelled so the three shapes read as positions of one chord.
 */
export function TriadFretboard({ model }: TriadFretboardProps) {
  const widestMarker = Math.max(
    ...model.groups.flatMap((group) => group.markers.map((marker) => markerWidth(marker.label))),
  );
  const fretWidth = Math.max(MIN_FRET_WIDTH, widestMarker + 10);
  const openColumn = Math.max(OPEN_COLUMN, widestMarker + 6);
  const nutX = LEFT + openColumn;
  const fretLineX = (fret: number) => nutX + fret * fretWidth;
  const columnCenter = (fret: number) =>
    fret === 0 ? LEFT + openColumn / 2 : fretLineX(fret) - fretWidth / 2;
  const columnLeft = (fret: number) => (fret === 0 ? LEFT : fretLineX(fret - 1));
  const columnRight = (fret: number) => (fret === 0 ? nutX : fretLineX(fret));
  const voices = model.strings.length;
  const stringY = (voice: number) => TOP + (voices - 1 - voice) * STRING_GAP;
  const boardTop = TOP - BOARD_PADDING;
  const boardBottom = stringY(0) + BOARD_PADDING;
  const width = fretLineX(model.maxFret) + 12;
  const height = boardBottom + BOTTOM;
  const labels = placeGroupLabels(model.groups, columnLeft, columnRight);

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
              cy={(stringY(voices - 1) + stringY(voices - 2)) / 2}
              r={4}
            />
            <circle
              className="triad-fretboard__inlay"
              cx={columnCenter(fret)}
              cy={(stringY(0) + stringY(1)) / 2}
              r={4}
            />
          </g>
        ) : (
          <circle
            key={`inlay-${fret}`}
            className="triad-fretboard__inlay"
            cx={columnCenter(fret)}
            cy={(boardTop + boardBottom) / 2}
            r={4}
          />
        ),
      )}

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
        <g key={`string-${string.voice}`}>
          <line
            className="triad-fretboard__string"
            x1={LEFT}
            x2={fretLineX(model.maxFret)}
            y1={stringY(string.voice)}
            y2={stringY(string.voice)}
          />
          <text
            className="triad-fretboard__string-name"
            x={LEFT - 8}
            y={stringY(string.voice) + 4}
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
          y={boardTop - GROUP_PADDING}
          width={columnRight(group.highestFret) - columnLeft(group.lowestFret) - GROUP_PADDING * 2}
          height={boardBottom - boardTop + GROUP_PADDING * 2}
          rx={10}
        />
      ))}

      {labels.map((label) => (
        <text
          key={`label-${label.id}`}
          className="triad-fretboard__group-label"
          x={label.x}
          y={boardTop - GROUP_PADDING - 8 - label.row * LABEL_ROW_GAP}
          textAnchor="middle"
        >
          {label.text}
        </text>
      ))}

      {model.groups.flatMap((group) =>
        group.markers.map((marker) => (
          <NoteMarker
            key={marker.id}
            cx={columnCenter(marker.fret)}
            cy={stringY(marker.voice)}
            label={marker.label}
            isRoot={marker.isRoot}
            open={marker.fret === 0}
          />
        )),
      )}

      {Array.from({ length: model.maxFret + 1 }, (_, fret) => (
        <text
          key={`number-${fret}`}
          className="triad-fretboard__fret-number"
          x={columnCenter(fret)}
          y={height - 8}
          textAnchor="middle"
        >
          {fret}
        </text>
      ))}
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
