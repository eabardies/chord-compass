import { markerHeight, markerWidth } from './markerGeometry';
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
  /** Second, smaller line under the label, e.g. the note name under the degree. */
  sublabel?: string | undefined;
  /** Roots get an extra ring so they stand out without relying on colour. */
  isRoot: boolean;
  /** The key root on a key fretboard: a heavy outline on top of any variant. */
  keyRoot?: boolean | undefined;
  /** Open strings are drawn outlined instead of filled; shorthand for variant "outlined". */
  open?: boolean;
  variant?: NoteMarkerVariant;
  /** Override the width, e.g. to align markers in one column. */
  width?: number;
  /** Extra attributes for tests or tooling, e.g. data-tone. */
  dataTone?: string;
  /** Further data-* attributes (keys without the "data-" prefix). */
  data?: Record<string, string | number>;
}

/** A labelled pill marker for SVG diagrams. Purely visual: the labels are already formatted. */
export function NoteMarker({
  cx,
  cy,
  label,
  sublabel,
  isRoot,
  keyRoot = false,
  open = false,
  variant,
  width,
  dataTone,
  data = {},
}: NoteMarkerProps) {
  const w = width ?? markerWidth(label, sublabel);
  const h = markerHeight(sublabel);
  const resolved: NoteMarkerVariant = variant ?? (open ? 'outlined' : 'filled');
  const variantClass = {
    filled: 'note-marker--fretted',
    outlined: 'note-marker--open',
    quiet: 'note-marker--quiet',
    altered: 'note-marker--altered',
  }[resolved];
  const dataAttributes = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [`data-${key}`, String(value)]),
  );
  const classes = [
    'note-marker',
    variantClass,
    isRoot ? 'note-marker--root' : '',
    keyRoot ? 'note-marker--key-root' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <g
      className={classes}
      data-tone={dataTone}
      data-label={label}
      data-key-root={keyRoot ? 'true' : undefined}
      {...dataAttributes}
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
      {sublabel ? (
        <>
          <text className="note-marker__label" x={cx} y={cy - 3} textAnchor="middle">
            {label}
          </text>
          <text className="note-marker__sublabel" x={cx} y={cy + 10.5} textAnchor="middle">
            {sublabel}
          </text>
        </>
      ) : (
        <text className="note-marker__label" x={cx} y={cy + 3.5} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}
