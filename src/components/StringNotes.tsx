import { stringNumber, type VoicedShape } from '../domain/guitar';
import { intervalLabel, noteName } from '../domain/music';
import './StringNotes.css';

interface StringNotesProps {
  shape: VoicedShape;
}

/** The sounding note on each string, low E to high E, with its chord degree. */
export function StringNotes({ shape }: StringNotesProps) {
  return (
    <ol className="string-notes" aria-label="Sounding note on each string, low to high">
      {shape.strings.map((string) => (
        <li key={string.index} className="string-notes__item">
          <span className="string-notes__string">
            {stringNumber(string.index)} · {noteName(string.openNote)}
          </span>
          <span className={`string-notes__note${string.tone ? '' : ' string-notes__note--muted'}`}>
            {string.tone ? noteName(string.tone.note) : '×'}
          </span>
          <span className="string-notes__degree">
            {string.tone ? intervalLabel(string.tone.interval) : 'muted'}
          </span>
        </li>
      ))}
    </ol>
  );
}
