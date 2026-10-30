import { markerWidth } from './markerGeometry';
import { NoteMarker, type NoteMarkerVariant } from './NoteMarker';
import type { ScaleFretboardModel, ScaleMarkerTone } from './scaleFretboardModels';
import './ScaleFretboard.css';

interface ScaleFretboardProps {
  model: ScaleFretboardModel;
}

// Geometry in SVG units. The viewBox only changes with the label width, never with the notes.
const LEFT = 58;
const OPEN_COLUMN = 44;
const MIN_FRET_WIDTH = 46;
const STRING_GAP = 30;
const TOP = 22;
const BOTTOM = 28;
const BOARD_PADDING = STRING_GAP / 2;
const SINGLE_INLAYS = [3, 5, 7, 9];
const DOUBLE_INLAYS = [12];

const VARIANT: Record<ScaleMarkerTone, NoteMarkerVariant> = {
  root: 'filled',
  chord: 'filled',
  scale: 'quiet',
  altered: 'altered',
};

/**
 * Six-string horizontal fretboard, high e on top, frets 0 (open) to `maxFret`. Markers come
 * fully classified and labelled in the model; this component owns only the geometry.
 */
export function ScaleFretboard({ model }: ScaleFretboardProps) {
  const widest = Math.max(22, ...model.markers.map((marker) => markerWidth(marker.label)));
  const fretWidth = Math.max(MIN_FRET_WIDTH, widest + 10);
  const openColumn = Math.max(OPEN_COLUMN, widest + 8);
  const nutX = LEFT + openColumn;
  const fretLineX = (fret: number) => nutX + fret * fretWidth;
  const columnCenter = (fret: number) =>
    fret === 0 ? LEFT + openColumn / 2 : fretLineX(fret) - fretWidth / 2;
  const count = model.strings.length;
  // Highest string on top: index 5 (high e) at TOP, index 0 (low E) at the bottom.
  const stringY = (index: number) => TOP + (count - 1 - index) * STRING_GAP;
  const boardTop = TOP - BOARD_PADDING;
  const boardBottom = stringY(0) + BOARD_PADDING;
  const width = fretLineX(model.maxFret) + 12;
  const height = boardBottom + BOTTOM;
  const inlayY = (between: [number, number]) => (stringY(between[0]) + stringY(between[1])) / 2;

  return (
    <svg
      className="scale-fretboard"
      viewBox={`0 0 ${width} ${height}`}
      style={{ minWidth: `${width}px` }}
      role="img"
      aria-label={model.title}
      aria-description={model.description}
    >
      <title>{model.title}</title>
      <desc>{model.description}</desc>

      <rect
        className="scale-fretboard__board"
        x={nutX}
        y={boardTop}
        width={fretLineX(model.maxFret) - nutX}
        height={boardBottom - boardTop}
      />

      {SINGLE_INLAYS.filter((fret) => fret <= model.maxFret).map((fret) => (
        <circle
          key={`inlay-${fret}`}
          className="scale-fretboard__inlay"
          cx={columnCenter(fret)}
          cy={inlayY([2, 3])}
          r={5}
        />
      ))}
      {DOUBLE_INLAYS.filter((fret) => fret <= model.maxFret).map((fret) => (
        <g key={`inlay-${fret}`}>
          <circle
            className="scale-fretboard__inlay"
            cx={columnCenter(fret)}
            cy={inlayY([3, 4])}
            r={5}
          />
          <circle
            className="scale-fretboard__inlay"
            cx={columnCenter(fret)}
            cy={inlayY([1, 2])}
            r={5}
          />
        </g>
      ))}

      <rect
        className="scale-fretboard__nut"
        x={nutX - 3}
        y={boardTop}
        width={6}
        height={boardBottom - boardTop}
        rx={1}
      />
      {Array.from({ length: model.maxFret }, (_, index) => index + 1).map((fret) => (
        <line
          key={`fret-${fret}`}
          className="scale-fretboard__fret"
          x1={fretLineX(fret)}
          x2={fretLineX(fret)}
          y1={boardTop}
          y2={boardBottom}
        />
      ))}

      {model.strings.map((string) => (
        <g key={`string-${string.index}`}>
          <line
            className="scale-fretboard__string"
            // Thicker towards the low E, as on a real guitar.
            strokeWidth={1 + (count - 1 - string.index) * 0.3}
            x1={LEFT}
            x2={fretLineX(model.maxFret)}
            y1={stringY(string.index)}
            y2={stringY(string.index)}
          />
          <text
            className="scale-fretboard__string-name"
            x={LEFT - 8}
            y={stringY(string.index) + 4}
            textAnchor="end"
          >
            {string.number} · {string.name}
          </text>
        </g>
      ))}

      {model.markers.map((marker) => (
        <NoteMarker
          key={marker.id}
          cx={columnCenter(marker.fret)}
          cy={stringY(marker.stringIndex)}
          label={marker.label}
          isRoot={marker.tone === 'root'}
          variant={VARIANT[marker.tone]}
          dataTone={marker.tone}
        />
      ))}

      {Array.from({ length: model.maxFret + 1 }, (_, fret) => (
        <text
          key={`number-${fret}`}
          className="scale-fretboard__fret-number"
          x={columnCenter(fret)}
          y={height - 9}
          textAnchor="middle"
        >
          {fret}
        </text>
      ))}
    </svg>
  );
}
