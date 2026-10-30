import { SHAPE_FAMILY_LABELS, shapeCode, shapeFamily, type VoicedShape } from '../../domain/guitar';

interface ShapeSelectorProps {
  shapes: readonly VoicedShape[];
  selectedId: string;
  recommendedId: string;
  onSelect: (definitionId: string) => void;
}

/** The other verified shapes for the chord. Position, code and family, with the state spelled out. */
export function ShapeSelector({ shapes, selectedId, recommendedId, onSelect }: ShapeSelectorProps) {
  return (
    <section className="shape-selector" aria-labelledby="shape-selector-heading">
      <h4 id="shape-selector-heading" className="shape-selector__title">
        Other ways to play it
      </h4>
      <ul className="shape-selector__list">
        {shapes.map((shape) => {
          const id = shape.definition.id;
          const code = shapeCode(shape.frets);
          const family = SHAPE_FAMILY_LABELS[shapeFamily(shape)];
          const isSelected = id === selectedId;
          const isRecommended = id === recommendedId;
          const tag = isRecommended ? 'Recommended' : isSelected ? 'Selected' : null;
          const parts = [shape.positionLabel, code, family.toLowerCase(), tag?.toLowerCase()];
          return (
            <li key={id}>
              <button
                type="button"
                className="shape-selector__option"
                aria-pressed={isSelected}
                aria-label={parts.filter((part) => part).join(', ')}
                onClick={() => onSelect(id)}
              >
                <span className="shape-selector__position">{shape.positionLabel}</span>
                <span className="shape-selector__code">{code}</span>
                <span className="shape-selector__meta">
                  <span className="shape-selector__family">{family}</span>
                  {tag && <span className="shape-selector__tag">{tag}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
