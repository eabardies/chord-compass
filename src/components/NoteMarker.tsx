import { MARKER_HEIGHT, markerWidth } from './markerGeometry';
import './NoteMarker.css';

const RING_GAP = 3;

/**
 * filled   the default, a solid accent pill (a fretted note, a chord tone)
 * outlined an open string
 * quiet    a note that is present but not emphasised (a scale note outside the chord)
 * altered  a note outside the reference scale, dashed so it reads differently in greyscale
 */
export type NoteMarkerVariant = 'filled' | 'outlined' | 'quiet' | 'altered';

interface NoteMarkerProps {
  cx: number;
  cy: number;
  label: string;
  /** Roots get an extra ring so they stand out without relying on colour. */
  isRoot: boolean;
  /** Open strings are drawn outlined instead of filled; shorthand for variant "outlined". */
  open?: boolean;
  variant?: NoteMarkerVariant;
  /** Override the width, e.g. to align markers in one column. */
  width?: number;
  /** Extra attributes for tests or tooling, e.g. data-tone. */
  dataTone?: string;
}

/** A labelled pill marker for SVG diagrams. Purely visual: the label is already formatted. */
export function NoteMarker({
  cx,
  cy,
  label,
  isRoot,
  open = false,
  variant,
  width,
  dataTone,
}: NoteMarkerProps) {
  const w = width ?? markerWidth(label);
  const h = MARKER_HEIGHT;
  const resolved: NoteMarkerVariant = variant ?? (open ? 'outlined' : 'filled');
  const variantClass = {
    filled: 'note-marker--fretted',
    outlined: 'note-marker--open',
    quiet: 'note-marker--quiet',
    altered: 'note-marker--altered',
  }[resolved];
  return (
    <g
      className={`note-marker ${variantClass}${isRoot ? ' note-marker--root' : ''}`}
      data-tone={dataTone}
      data-label={label}
    >
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
