import { NoteMarker } from '../../components/NoteMarker';
import { TriadFretboard } from '../../components/TriadFretboard';
import type { TriadFretboardModel } from '../../components/triadDiagramModels';

interface TriadFretboardSectionProps {
  model: TriadFretboardModel;
  stringSetName: string;
  stringSetLowToHigh: string;
}

/** The "Across the fretboard" view: one neck, all three inversions, with a legend. */
export function TriadFretboardSection({
  model,
  stringSetName,
  stringSetLowToHigh,
}: TriadFretboardSectionProps) {
  return (
    <section className="triad-fretboard-section" aria-labelledby="triad-fretboard-heading">
      <header className="triad-fretboard-section__header">
        <div>
          <h3 id="triad-fretboard-heading" className="triad-fretboard-section__title">
            Across the fretboard
          </h3>
          <p className="section-subtitle">
            {stringSetName} ({stringSetLowToHigh}), frets 0 to {model.maxFret}. The same three
            notes, in three positions.
          </p>
        </div>
        <ul className="triad-legend" aria-label="Legend">
          <li className="triad-legend__item">
            <svg className="triad-legend__swatch" viewBox="0 0 40 32" aria-hidden="true">
              <NoteMarker cx={20} cy={16} label="1" isRoot open={false} />
            </svg>
            <span>Root (ringed)</span>
          </li>
          <li className="triad-legend__item">
            <svg className="triad-legend__swatch" viewBox="0 0 40 32" aria-hidden="true">
              <NoteMarker cx={20} cy={16} label="3" isRoot={false} open={false} />
            </svg>
            <span>Other chord tone</span>
          </li>
          <li className="triad-legend__item">
            <svg className="triad-legend__swatch" viewBox="0 0 40 32" aria-hidden="true">
              <NoteMarker cx={20} cy={16} label="5" isRoot={false} open />
            </svg>
            <span>Open string</span>
          </li>
        </ul>
      </header>
      <div className="triad-fretboard-section__scroller" tabIndex={0}>
        <TriadFretboard model={model} />
      </div>
      <p className="note-text">
        Highest string on top, as in tablature. Each box is one inversion; the cards above stay in
        inversion order while the boxes sit where the shapes fall on the neck.
      </p>
    </section>
  );
}
