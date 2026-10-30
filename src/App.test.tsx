import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

/** The visible tab panel. Hidden panels stay mounted, so queries are scoped to the active one. */
const panel = () => within(screen.getByRole('tabpanel'));

async function generateChords(root: string) {
  const user = userEvent.setup();
  render(<App />);
  await user.selectOptions(panel().getByLabelText('Root note'), root);
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
    await user.selectOptions(panel().getByLabelText('Root note'), 'C');
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

    await user.selectOptions(panel().getByLabelText('Root note'), 'C');
    await user.click(screen.getByRole('button', { name: 'Generate chords' }));
    expect(screen.getByRole('heading', { name: 'C major scale' })).toBeInTheDocument();
    expect(degreeLabels()[4]).toBe('Degree 5, G, raised to G♯ as ♯5');
  });
});

describe('learn triads', () => {
  async function openTriads() {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: 'Learn triads' }));
    return user;
  }

  /** Degrees, notes and frets of each inversion card, in card order. */
  const cards = () =>
    (['root', 'first', 'second'] as const).map((inversion) => ({
      degrees: screen.getByTestId(`${inversion}-degrees`).textContent,
      notes: screen.getByTestId(`${inversion}-notes`).textContent,
      frets: screen.getByTestId(`${inversion}-frets`).textContent,
    }));

  /** Text printed inside the note markers of a diagram, low string first. */
  const markerLabels = (image: HTMLElement) =>
    Array.from(image.querySelectorAll('.note-marker__label')).map((text) => text.textContent);

  const fretboard = () => screen.getByRole('img', { name: /across the fretboard/ });

  it('opens on A major with the formula, notes, three inversions and the fretboard', async () => {
    await openTriads();
    expect(screen.getByRole('tab', { name: 'Learn triads' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'A major' })).toBeInTheDocument();
    expect(screen.getByTestId('triad-formula')).toHaveTextContent('1–3–5');
    expect(screen.getByTestId('triad-notes')).toHaveTextContent('A–C♯–E');

    const inversions = within(screen.getByRole('list', { name: 'Inversions' }));
    expect(
      inversions.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(['Root position', 'First inversion', 'Second inversion']);
    expect(cards()).toEqual([
      { degrees: '1–3–5', notes: 'A–C♯–E', frets: '2–2–0' },
      { degrees: '3–5–1', notes: 'C♯–E–A', frets: '6–5–5' },
      { degrees: '5–1–3', notes: 'E–A–C♯', frets: '9–10–9' },
    ]);
    expect(
      screen.getByRole('img', { name: 'A major, root position on strings 3, 2, 1' }),
    ).toHaveAttribute(
      'aria-description',
      'A major, root position on strings 3, 2, 1: string 3 2nd fret A (1), string 2 2nd fret C♯ (3), string 1 open E (5).',
    );
    expect(
      screen.getByRole('img', { name: 'A major, first inversion on strings 3, 2, 1' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'A major, second inversion on strings 3, 2, 1' }),
    ).toBeInTheDocument();

    expect(fretboard()).toHaveAccessibleName(
      'A major across the fretboard on strings 3–2–1 · G–B–e',
    );
    expect(fretboard()).toHaveAttribute(
      'aria-description',
      'Frets 0 to 12, strings 3–2–1 · G–B–e low to high: root position at frets 2–2–0; first inversion at frets 6–5–5; second inversion at frets 9–10–9.',
    );
    expect(screen.getByRole('list', { name: 'Legend' })).toHaveTextContent('Root (ringed)');
  });

  it('updates every card and the fretboard when the root changes', async () => {
    const user = await openTriads();
    await user.selectOptions(panel().getByLabelText('Root note'), 'C');
    expect(screen.getByRole('heading', { name: 'C major' })).toBeInTheDocument();
    expect(screen.getByTestId('triad-notes')).toHaveTextContent('C–E–G');
    expect(cards()).toEqual([
      { degrees: '1–3–5', notes: 'C–E–G', frets: '5–5–3' },
      { degrees: '3–5–1', notes: 'E–G–C', frets: '9–8–8' },
      { degrees: '5–1–3', notes: 'G–C–E', frets: '0–1–0' },
    ]);
    expect(
      screen.getByRole('img', { name: 'C major, second inversion on strings 3, 2, 1' }),
    ).toBeInTheDocument();
    expect(fretboard()).toHaveAttribute(
      'aria-description',
      expect.stringContaining('second inversion at frets 0–1–0'),
    );
  });

  it('switches between major and minor', async () => {
    const user = await openTriads();
    await user.click(screen.getByRole('button', { name: 'Minor' }));
    expect(screen.getByRole('button', { name: 'Minor' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'A minor' })).toBeInTheDocument();
    expect(screen.getByTestId('triad-formula')).toHaveTextContent('1–♭3–5');
    expect(screen.getByTestId('triad-notes')).toHaveTextContent('A–C–E');
    expect(cards()).toEqual([
      { degrees: '1–♭3–5', notes: 'A–C–E', frets: '2–1–0' },
      { degrees: '♭3–5–1', notes: 'C–E–A', frets: '5–5–5' },
      { degrees: '5–1–♭3', notes: 'E–A–C', frets: '9–10–8' },
    ]);

    await user.click(screen.getByRole('button', { name: 'Major' }));
    expect(screen.getByRole('heading', { name: 'A major' })).toBeInTheDocument();
    expect(cards()[0].frets).toBe('2–2–0');
  });

  it('changes the string set and shows its low-to-high order', async () => {
    const user = await openTriads();
    const sets = within(screen.getByRole('group', { name: 'String set' }));
    expect(sets.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Strings 1–2–33–2–1 · G–B–e',
      'Strings 2–3–44–3–2 · D–G–B',
      'Strings 3–4–55–4–3 · A–D–G',
    ]);

    await user.click(sets.getByRole('button', { name: /^Strings 3–4–5/ }));
    expect(cards()).toEqual([
      { degrees: '1–3–5', notes: 'A–C♯–E', frets: '12–11–9' },
      { degrees: '3–5–1', notes: 'C♯–E–A', frets: '4–2–2' },
      { degrees: '5–1–3', notes: 'E–A–C♯', frets: '7–7–6' },
    ]);
    expect(
      screen.getByRole('img', { name: 'A major, root position on strings 5, 4, 3' }),
    ).toBeInTheDocument();
    expect(fretboard()).toHaveAccessibleName(
      'A major across the fretboard on strings 5–4–3 · A–D–G',
    );
  });

  it('switches marker labels between degrees, notes and both', async () => {
    const user = await openTriads();
    const firstInversion = () =>
      screen.getByRole('img', { name: 'A major, first inversion on strings 3, 2, 1' });
    expect(markerLabels(firstInversion())).toEqual(['3', '5', '1']);

    await user.click(screen.getByRole('button', { name: 'Notes' }));
    expect(markerLabels(firstInversion())).toEqual(['C♯', 'E', 'A']);
    expect(markerLabels(fretboard())).toEqual(['A', 'C♯', 'E', 'C♯', 'E', 'A', 'E', 'A', 'C♯']);

    await user.click(screen.getByRole('button', { name: 'Both' }));
    expect(markerLabels(firstInversion())).toEqual(['3 / C♯', '5 / E', '1 / A']);

    await user.click(screen.getByRole('button', { name: 'Degrees' }));
    expect(markerLabels(firstInversion())).toEqual(['3', '5', '1']);
  });

  it('keeps its selections, and the other tabs theirs, when switching tabs', async () => {
    const user = await openTriads();
    await user.selectOptions(panel().getByLabelText('Root note'), 'Eflat');
    await user.click(screen.getByRole('button', { name: 'Minor' }));
    await user.click(screen.getByRole('button', { name: /^Strings 2–3–4/ }));
    await user.click(screen.getByRole('button', { name: 'Both' }));
    expect(screen.getByRole('heading', { name: 'E♭ minor' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Explore chords' }));
    await user.selectOptions(panel().getByLabelText('Root note'), 'G');
    await user.click(screen.getByRole('button', { name: 'Generate chords' }));
    expect(screen.getByRole('heading', { name: 'G major' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Learn triads' }));
    expect(screen.getByRole('heading', { name: 'E♭ minor' })).toBeInTheDocument();
    expect(panel().getByLabelText('Root note')).toHaveValue('Eflat');
    expect(screen.getByRole('button', { name: 'Minor' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^Strings 2–3–4/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Both' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('triad-notes')).toHaveTextContent('E♭–G♭–B♭');

    await user.click(screen.getByRole('tab', { name: 'Explore chords' }));
    expect(screen.getByRole('heading', { name: 'G major' })).toBeInTheDocument();
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
