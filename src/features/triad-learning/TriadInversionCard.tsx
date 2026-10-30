import { Card } from '../../components/Card';
import { TriadDiagram } from '../../components/TriadDiagram';
import type { TriadDiagramModel } from '../../components/triadDiagramModels';
import type { TriadVoicing } from '../../domain/guitar';

interface TriadInversionCardProps {
  voicing: TriadVoicing;
  diagram: TriadDiagramModel;
}

/** One inversion: its tone order in degrees and notes, and the shape that plays it. */
export function TriadInversionCard({ voicing, diagram }: TriadInversionCardProps) {
  const { inverted } = voicing;
  return (
    <Card as="article" headingLevel={3} title={inverted.name} badge={diagram.positionLabel}>
      <dl className="triad-card__facts">
        <div className="triad-card__fact">
          <dt>Degrees</dt>
          <dd data-testid={`${inverted.inversion}-degrees`}>{inverted.degreeOrder}</dd>
        </div>
        <div className="triad-card__fact">
          <dt>Notes</dt>
          <dd data-testid={`${inverted.inversion}-notes`}>{inverted.noteOrder}</dd>
        </div>
        <div className="triad-card__fact">
          <dt>Frets</dt>
          <dd data-testid={`${inverted.inversion}-frets`}>{voicing.frets.join('–')}</dd>
        </div>
      </dl>
      <TriadDiagram model={diagram} />
      <p className="note-text triad-card__caption">
        Low string on the left. Fret numbers and tones read low to high.
      </p>
      {!voicing.playable && (
        <p className="note-text triad-card__warning" role="note">
          This is the most compact way to place these notes on these strings, but it spans{' '}
          {voicing.span} frets, more than the comfortable limit. Treat it as a reference, not a
          fingering.
        </p>
      )}
    </Card>
  );
}
