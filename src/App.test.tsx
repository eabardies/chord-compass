import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

async function generateChords(root: string) {
  const user = userEvent.setup();
  render(<App />);
  await user.selectOptions(screen.getByLabelText('Root note'), root);
  await user.click(screen.getByRole('button', { name: 'Generate chords' }));
  return user;
}

describe('explore chords', () => {
  it('generates every chord type for the chosen root and shows its notes', async () => {
    const user = await generateChords('C');
    const chips = screen.getByRole('group', { name: 'Chord types on C' });
    expect(
      within(chips)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['C', 'Cm', 'C7', 'Cmaj7', 'Cm7', 'Csus2', 'Csus4', 'Cdim', 'Caug']);

    await user.click(within(chips).getByRole('button', { name: /^Cm, C minor/ }));
    expect(screen.getByRole('heading', { name: 'C minor' })).toBeInTheDocument();
    const notes = screen.getByRole('list', { name: 'Chord notes' });
    expect(
      within(notes)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['C1', 'E♭♭3', 'G5']);
  });

  it('shows the shape notes for the open A major shape and lets the user switch shape', async () => {
    const user = await generateChords('A');
    expect(screen.getByRole('heading', { name: 'A major' })).toBeInTheDocument();
    expect(screen.getByTestId('shape-notes')).toHaveTextContent('A – E – A – C♯ – E');
    expect(
      screen.getByRole('img', {
        name: /A major, open position: string 6 muted, string 5 open \(A\)/,
      }),
    ).toBeInTheDocument();

    const shapeSwitcher = screen.getByRole('group', { name: 'Shapes for A major' });
    await user.click(within(shapeSwitcher).getByRole('button', { name: '5th fret barre' }));
    expect(screen.getByTestId('shape-notes')).toHaveTextContent('A – E – A – C♯ – E – A');
    expect(screen.getByRole('img', { name: /A major, 5th fret barre/ })).toBeInTheDocument();
  });

  it('keeps the chosen shape family when the root changes', async () => {
    const user = await generateChords('A');
    await user.click(
      within(screen.getByRole('group', { name: 'Shapes for A major' })).getByRole('button', {
        name: '5th fret barre',
      }),
    );
    await user.selectOptions(screen.getByLabelText('Root note'), 'C');
    await user.click(screen.getByRole('button', { name: 'Generate chords' }));
    expect(screen.getByRole('heading', { name: 'C major' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: 'Shapes for C major' })).getByRole('button', {
        name: '8th fret barre',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the major scale reference and updates it with the chord type and root', async () => {
    const user = await generateChords('A');
    const degreeLabels = () =>
      within(screen.getByRole('list', { name: /Degrees of the .* major scale/ }))
        .getAllByRole('listitem')
        .map((item) => item.getAttribute('aria-label'));

    expect(screen.getByRole('heading', { name: 'A major scale' })).toBeInTheDocument();
    expect(degreeLabels()).toEqual([
      'Degree 1, A, chord tone',
      'Degree 2, B, not used',
      'Degree 3, C♯, chord tone',
      'Degree 4, D, not used',
      'Degree 5, E, chord tone',
      'Degree 6, F♯, not used',
      'Degree 7, G♯, not used',
    ]);
    expect(screen.getByText('Build A: take degrees 1, 3, 5.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Am7, A minor seventh/ }));
    expect(degreeLabels()[2]).toBe('Degree 3, C♯, lowered to C as ♭3');
    expect(degreeLabels()[6]).toBe('Degree 7, G♯, lowered to G as ♭7');
    expect(
      screen.getByText(
        'Build Am7: lower C♯ to C (♭3) and lower G♯ to G (♭7). Keep degrees 1 and 5.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Aaug, A augmented/ }));
    expect(degreeLabels()[4]).toBe('Degree 5, E, raised to E♯ as ♯5');

    await user.selectOptions(screen.getByLabelText('Root note'), 'C');
    await user.click(screen.getByRole('button', { name: 'Generate chords' }));
    expect(screen.getByRole('heading', { name: 'C major scale' })).toBeInTheDocument();
    expect(degreeLabels()[4]).toBe('Degree 5, G, raised to G♯ as ♯5');
  });
});

describe('practise progressions', () => {
  it('updates chord names and diagrams when the key changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: 'Practise progressions' }));
    await user.click(screen.getByRole('button', { name: 'I–V–vi–IV' }));

    const chordsOf = () =>
      within(screen.getByRole('list', { name: 'Chords of I–V–vi–IV' }))
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent);
    expect(chordsOf()).toEqual(['IA, A major', 'VE, E major', 'viF♯m, F♯ minor', 'IVD, D major']);
    expect(screen.getByRole('img', { name: /F♯ minor, 2nd fret barre/ })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Key'), 'C');
    expect(chordsOf()).toEqual(['IC, C major', 'VG, G major', 'viAm, A minor', 'IVF, F major']);
    expect(screen.getByRole('img', { name: /A minor, open position/ })).toBeInTheDocument();
  });

  it('switches to minor progressions and a matching tonic spelling', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: 'Practise progressions' }));
    await user.selectOptions(screen.getByLabelText('Key'), 'Aflat');
    await user.click(screen.getByRole('button', { name: 'Natural minor' }));
    expect(screen.getByLabelText('Key')).toHaveValue('Gsharp');
    expect(screen.getByRole('button', { name: 'i–VI–III–VII' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'i–VI–III–VII in G♯ minor' })).toBeInTheDocument();
  });

  it('shows all twelve bars of the blues with dominant sevenths', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: 'Practise progressions' }));
    const bars = within(screen.getByRole('list', { name: /Chords of I7–I7/ })).getAllByRole(
      'listitem',
    );
    expect(bars).toHaveLength(12);
    expect(bars[4]).toHaveTextContent('IV7');
    expect(bars[4]).toHaveTextContent('D7');
    expect(bars[8]).toHaveTextContent('E7');
  });
});
