import { ChordDiagram } from '../../components/ChordDiagram';
import { playInstructions, shapeCode, type VoicedShape } from '../../domain/guitar';
import type { Chord } from '../../domain/music';
import { ShapeSelector } from './ShapeSelector';
import { StringInstructions } from './StringInstructions';

interface ChordSearchResultProps {
  chord: Chord;
  /** Verified shapes, recommended first. */
  shapes: readonly VoicedShape[];
  selected: VoicedShape;
  onSelectShape: (definitionId: string) => void;
}

/** The found chord: symbol, name, the chosen shape's diagram, how to play it, and alternatives. */
export function ChordSearchResult({
  chord,
  shapes,
  selected,
  onSelectShape,
}: ChordSearchResultProps) {
  const recommended = shapes[0];
  const code = shapeCode(selected.frets);
  const isRecommended = selected.definition.id === recommended.definition.id;
  const instructions = playInstructions(selected);

  return (
    <article className="chord-result" aria-labelledby="chord-result-heading">
      <header className="chord-result__header">
        <div>
          <h3 id="chord-result-heading" className="chord-result__symbol">
            {chord.symbol}
          </h3>
          <p className="chord-result__name">{chord.name}</p>
        </div>
        <div className="chord-result__shape">
          <span className="chord-result__badge">
            {isRecommended ? 'Recommended shape' : 'Selected shape'}
          </span>
          <span className="chord-result__position">{selected.positionLabel}</span>
          <span className="chord-result__code" data-testid="shape-code">
            {code}
          </span>
        </div>
      </header>

      <div className="chord-result__body">
        <div className="chord-result__diagram">
          <ChordDiagram
            shape={selected}
            label={`${chord.symbol}, ${selected.positionLabel.toLowerCase()}, shape ${code}`}
          />
        </div>
        <section className="chord-result__play" aria-labelledby="play-heading">
          <h4 id="play-heading" className="chord-result__subtitle">
            Play this shape
          </h4>
          <ol className="play-steps">
            {instructions.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </div>

      <section aria-labelledby="strings-heading">
        <h4 id="strings-heading" className="chord-result__subtitle">
          String by string
        </h4>
        <StringInstructions shape={selected} />
      </section>

      {shapes.length > 1 && (
        <ShapeSelector
          shapes={shapes}
          selectedId={selected.definition.id}
          recommendedId={recommended.definition.id}
          onSelect={onSelectShape}
        />
      )}
    </article>
  );
}
