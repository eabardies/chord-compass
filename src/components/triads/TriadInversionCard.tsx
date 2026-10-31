import { Card } from '../Card';
import { TriadDiagram } from './TriadDiagram';
import type { TriadDiagramModel } from './triadDiagramModels';
import type { TriadVoicing } from '../../domain/guitar';
import { chordToneLabels, noteName, triadNoteNames } from '../../domain/music';
import './TriadInversionCard.css';

interface TriadInversionCardProps {
  voicing: TriadVoicing;
  diagram: TriadDiagramModel;
  headingLevel?: 3 | 4;
}

const ARROW = ' → ';

/**
 * One inversion: which note is in the bass, the tone order from the lowest string of the set
 * to the highest, and the shape that plays it. The diagram draws the highest string on top,
 * so the order written here (low to high) reads bottom-up on the picture.
 */
export function TriadInversionCard({
  voicing,
  diagram,
  headingLevel = 3,
}: TriadInversionCardProps) {
  const { inverted } = voicing;
  return (
    <Card
      as="article"
      headingLevel={headingLevel}
      title={inverted.name}
      badge={diagram.positionLabel}
    >
      <p className="triad-card__bass" data-testid={`${inverted.inversion}-bass`}>
        <strong>{noteName(inverted.bass.note)}</strong> in the bass
      </p>
      <dl className="triad-card__facts">
        <div className="triad-card__fact">
          <dt>Tones, low → high</dt>
          <dd data-testid={`${inverted.inversion}-notes`}>
            {triadNoteNames(inverted.tones).join(ARROW)}
          </dd>
        </div>
        <div className="triad-card__fact">
          <dt>Degrees</dt>
          <dd data-testid={`${inverted.inversion}-degrees`}>
            {chordToneLabels(inverted.tones).join(ARROW)}
          </dd>
        </div>
        <div className="triad-card__fact">
          <dt>Frets</dt>
          <dd data-testid={`${inverted.inversion}-frets`}>{voicing.frets.join('–')}</dd>
        </div>
      </dl>
      <TriadDiagram model={diagram} />
      <p className="note-text triad-card__caption">
        Play only the heavier strings. Frets and tones above read from the lowest string of the set
        (bottom) to the highest (top).
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
