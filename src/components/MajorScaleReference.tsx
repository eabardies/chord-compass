import { useId } from 'react';
import { intervalLabel, noteName, type MajorScaleReference as Reference } from '../domain/music';
import './MajorScaleReference.css';

interface MajorScaleReferenceProps {
  reference: Reference;
}

/**
 * Shows the seven notes of the chord root's major scale and how the selected chord's formula
 * picks or alters them. Pure presentation: all theory comes from `majorScaleReference`.
 */
export function MajorScaleReference({ reference }: MajorScaleReferenceProps) {
  const headingId = useId();
  const rootName = noteName(reference.root);

  return (
    <section className="scale-reference" aria-labelledby={headingId}>
      <header className="scale-reference__header">
        <h3 id={headingId} className="scale-reference__title">
          {rootName} major scale
        </h3>
        <p className="eyebrow">Chord formula reference</p>
      </header>

      <ol
        className="scale-reference__degrees"
        aria-label={`Degrees of the ${rootName} major scale`}
      >
        {reference.degrees.map((entry) => {
          const scaleNote = noteName(entry.scaleNote);
          const status = statusText(entry);
          return (
            <li
              key={entry.degree}
              className={`scale-reference__degree scale-reference__degree--${entry.role}`}
              aria-label={`Degree ${entry.degree}, ${scaleNote}, ${status.accessible}`}
            >
              <span className="scale-reference__number" aria-hidden="true">
                {entry.degree}
              </span>
              <span className="scale-reference__note" aria-hidden="true">
                {scaleNote}
              </span>
              <span className="scale-reference__status" aria-hidden="true">
                {status.visible}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="scale-reference__summary">{reference.summary}</p>
      <p className="note-text">
        Formulas are read against the root&apos;s major scale. That does not mean the chord belongs
        to that major key.
      </p>
    </section>
  );
}

function statusText(entry: Reference['degrees'][number]): { visible: string; accessible: string } {
  if (entry.alteration) {
    const altered = noteName(entry.alteration.note);
    return {
      visible: `${intervalLabel(entry.alteration.interval)} → ${altered}`,
      accessible: `${entry.alteration.direction} to ${altered} as ${intervalLabel(entry.alteration.interval)}`,
    };
  }
  if (entry.role === 'chord-tone') return { visible: 'Chord tone', accessible: 'chord tone' };
  return { visible: 'Not used', accessible: 'not used' };
}
