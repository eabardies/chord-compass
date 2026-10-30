import { triadNoteNames, type Triad } from '../../domain/music';

interface TriadSummaryProps {
  triad: Triad;
}

/** Name, formula and notes: the chain the inversion cards then lay out on the neck. */
export function TriadSummary({ triad }: TriadSummaryProps) {
  return (
    <section className="triad-summary" aria-labelledby="triad-summary-heading">
      <h3 id="triad-summary-heading" className="triad-summary__name">
        {triad.name}
      </h3>
      <dl className="triad-summary__facts">
        <div className="triad-summary__fact">
          <dt>Formula</dt>
          <dd data-testid="triad-formula">{triad.formula}</dd>
        </div>
        <div className="triad-summary__fact">
          <dt>Notes</dt>
          <dd data-testid="triad-notes">{triadNoteNames(triad.tones).join('–')}</dd>
        </div>
      </dl>
      <p className="note-text">
        The formula counts degrees of the root&apos;s major scale. An inversion keeps the same three
        notes and changes which one is lowest.
      </p>
    </section>
  );
}
