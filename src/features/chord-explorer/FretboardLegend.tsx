import { NoteMarker } from '../../components/NoteMarker';

interface FretboardLegendProps {
  showChordTones: boolean;
  showAltered: boolean;
}

/** Legend using the same marker styles as the fretboard. */
export function FretboardLegend({ showChordTones, showAltered }: FretboardLegendProps) {
  const entries = [
    { key: 'root', label: 'Root', marker: <NoteMarker cx={22} cy={16} label="1" isRoot /> },
    ...(showChordTones
      ? [
          {
            key: 'chord',
            label: 'Selected chord tone',
            marker: <NoteMarker cx={22} cy={16} label="3" isRoot={false} />,
          },
        ]
      : []),
    {
      key: 'scale',
      label: 'Other scale note',
      marker: <NoteMarker cx={22} cy={16} label="2" isRoot={false} variant="quiet" />,
    },
    ...(showAltered
      ? [
          {
            key: 'altered',
            label: 'Altered chord tone',
            marker: <NoteMarker cx={22} cy={16} label="♭3" isRoot={false} variant="altered" />,
          },
        ]
      : []),
  ];
  return (
    <ul className="fretboard-legend" aria-label="Fretboard legend">
      {entries.map((entry) => (
        <li key={entry.key} className="fretboard-legend__item">
          <svg className="fretboard-legend__swatch" viewBox="0 0 44 32" aria-hidden="true">
            {entry.marker}
          </svg>
          <span>{entry.label}</span>
        </li>
      ))}
    </ul>
  );
}
