import './NoteList.css';

export interface NoteListItem {
  id: string;
  label: string;
  sublabel?: string;
  /** Draw the tile on the selected surface, e.g. the scale notes that belong to the chosen chord. */
  highlighted?: boolean;
  /** Spoken alongside the label when highlighted, e.g. "chord tone". */
  highlightDescription?: string | undefined;
}

interface NoteListProps {
  label: string;
  items: readonly NoteListItem[];
}

/** A row of note or interval tiles with an optional small caption under each. */
export function NoteList({ label, items }: NoteListProps) {
  return (
    <ul className="note-list" aria-label={label}>
      {items.map((item) => (
        <li
          key={item.id}
          className={`note-list__item${item.highlighted ? ' note-list__item--highlighted' : ''}`}
          data-highlighted={item.highlighted ? 'true' : undefined}
        >
          <span className="note-list__label">{item.label}</span>
          {item.sublabel && <span className="note-list__sublabel">{item.sublabel}</span>}
          {item.highlighted && item.highlightDescription && (
            <span className="visually-hidden">, {item.highlightDescription}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
