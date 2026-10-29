import './NoteList.css';

export interface NoteListItem {
  id: string;
  label: string;
  sublabel?: string;
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
        <li key={item.id} className="note-list__item">
          <span className="note-list__label">{item.label}</span>
          {item.sublabel && <span className="note-list__sublabel">{item.sublabel}</span>}
        </li>
      ))}
    </ul>
  );
}
