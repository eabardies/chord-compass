import { MARKER_HEIGHT, markerWidth } from './markerGeometry';
import './NoteMarker.css';

const RING_GAP = 3;

interface NoteMarkerProps {
  cx: number;
  cy: number;
  label: string;
  /** Roots get an extra ring so they stand out without relying on colour. */
  isRoot: boolean;
  /** Open strings are drawn outlined instead of filled. */
  open: boolean;
  /** Override the width, e.g. to align markers in one column. */
  width?: number;
}

/** A labelled pill marker for SVG diagrams. Purely visual: the label is already formatted. */
export function NoteMarker({ cx, cy, label, isRoot, open, width }: NoteMarkerProps) {
  const w = width ?? markerWidth(label);
  const h = MARKER_HEIGHT;
  const variant = open ? 'note-marker--open' : 'note-marker--fretted';
  return (
    <g className={`note-marker ${variant}${isRoot ? ' note-marker--root' : ''}`}>
      {isRoot && (
        <rect
          className="note-marker__ring"
          x={cx - w / 2 - RING_GAP}
          y={cy - h / 2 - RING_GAP}
          width={w + RING_GAP * 2}
          height={h + RING_GAP * 2}
          rx={(h + RING_GAP * 2) / 2}
        />
      )}
      <rect
        className="note-marker__pill"
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx={h / 2}
      />
      <text className="note-marker__label" x={cx} y={cy + 3.5} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}
