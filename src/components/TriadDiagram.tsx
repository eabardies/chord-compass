import type { TriadDiagramModel } from './triadDiagramModels';
import { MARKER_HEIGHT, markerWidth } from './markerGeometry';
import { NoteMarker } from './NoteMarker';
import './TriadDiagram.css';

interface TriadDiagramProps {
  model: TriadDiagramModel;
}

// Geometry in SVG units; the SVG scales to its container.
const FRET_GAP = 34;
const TOP = 44;
const BOTTOM = 24;
const SIDE = 18;
const FRET_NUMBER_GUTTER = 30;
const MIN_STRING_GAP = 44;

/**
 * A focused three-string diagram: strings run vertically (lowest string on the left), frets
 * run down. Only the strings of the set are drawn, so there are no muted-string markers.
 * All labels arrive formatted in the model; this component only places them.
 */
export function TriadDiagram({ model }: TriadDiagramProps) {
  const widestMarker = Math.max(...model.markers.map((marker) => markerWidth(marker.label)));
  const stringGap = Math.max(MIN_STRING_GAP, widestMarker + 8);
  const left = Math.max(SIDE, widestMarker / 2 + 4) + FRET_NUMBER_GUTTER;
  const right = Math.max(SIDE, widestMarker / 2 + 4);
  const stringCount = model.strings.length;
  const width = left + stringGap * (stringCount - 1) + right;
  const height = TOP + FRET_GAP * model.fretsShown + BOTTOM;
  const stringX = (voice: number) => left + voice * stringGap;
  const fretY = (fret: number) => TOP + (fret - model.startFret + 0.5) * FRET_GAP;
  const boardBottom = TOP + model.fretsShown * FRET_GAP;

  return (
    <svg
      className="triad-diagram"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={model.title}
      aria-description={model.description}
    >
      <title>{model.title}</title>
      <desc>{model.description}</desc>

      {model.startFret === 1 ? (
        <rect
          className="triad-diagram__nut"
          x={stringX(0) - 1}
          y={TOP - 3}
          width={stringGap * (stringCount - 1) + 2}
          height={4}
          rx={1}
        />
      ) : (
        <text
          className="triad-diagram__fret-number"
          x={left - widestMarker / 2 - 10}
          y={fretY(model.startFret) + 4}
          textAnchor="end"
        >
          {model.startFret}fr
        </text>
      )}

      {Array.from({ length: model.fretsShown + 1 }, (_, row) => (
        <line
          key={`fret-${row}`}
          className="triad-diagram__line"
          x1={stringX(0)}
          x2={stringX(stringCount - 1)}
          y1={TOP + row * FRET_GAP}
          y2={TOP + row * FRET_GAP}
        />
      ))}

      {model.strings.map((string) => (
        <line
          key={`string-${string.voice}`}
          className="triad-diagram__line"
          x1={stringX(string.voice)}
          x2={stringX(string.voice)}
          y1={TOP}
          y2={boardBottom}
        />
      ))}

      {model.markers.map((marker) => (
        <NoteMarker
          key={marker.id}
          cx={stringX(marker.voice)}
          cy={marker.fret === 0 ? TOP - MARKER_HEIGHT / 2 - 8 : fretY(marker.fret)}
          label={marker.label}
          isRoot={marker.isRoot}
          open={marker.fret === 0}
        />
      ))}

      {model.strings.map((string) => (
        <text
          key={`name-${string.voice}`}
          className="triad-diagram__string-name"
          x={stringX(string.voice)}
          y={height - 8}
          textAnchor="middle"
        >
          {string.name}
        </text>
      ))}
    </svg>
  );
}
