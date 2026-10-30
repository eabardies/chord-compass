import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { installMatchMedia, setSystemDark } from './test/matchMedia';
import { THEME_STORAGE_KEY } from './theme/themeResolution';

/** The visible tab panel. Hidden panels stay mounted, so queries are scoped to the active one. */
const panel = () => within(screen.getByRole('tabpanel'));

async function generateChords(root: string) {
  const user = userEvent.setup();
  render(<App />);
  await user.selectOptions(panel().getByLabelText('Root note'), root);
  await user.click(screen.getByRole('button', { name: 'Generate chords' }));
  return user;
}

describe('theme', () => {
  const toggle = () => screen.getByRole('button', { name: /Switch to (dark|light) mode/ });
  const theme = () => document.documentElement.getAttribute('data-theme');

  it('renders light by default and follows a dark operating system', () => {
    render(<App />);
    expect(theme()).toBe('light');
    expect(toggle()).toHaveAccessibleName('Switch to dark mode');
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(toggle()).toHaveTextContent('Dark');
  });

  it('renders dark when the operating system prefers dark', () => {
    installMatchMedia(true);
    render(<App />);
    expect(theme()).toBe('dark');
    expect(toggle()).toHaveAccessibleName('Switch to light mode');
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(toggle()).toHaveTextContent('Light');
  });

  it('toggles the theme, updates the control and remembers the choice', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(toggle());
    expect(theme()).toBe('dark');
    expect(toggle()).toHaveAccessibleName('Switch to light mode');
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(toggle()).toHaveTextContent('Light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await user.click(toggle());
    expect(theme()).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('restores a saved choice over the operating system preference', () => {
    installMatchMedia(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    render(<App />);
    expect(theme()).toBe('light');
    expect(toggle()).toHaveAccessibleName('Switch to dark mode');
  });

  it('follows operating-system changes only until the user chooses', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(theme()).toBe('light');
    act(() => setSystemDark(true));
    expect(theme()).toBe('dark');
    act(() => setSystemDark(false));
    expect(theme()).toBe('light');

    await user.click(toggle());
    expect(theme()).toBe('dark');
    act(() => setSystemDark(false));
    expect(theme()).toBe('dark');
    act(() => setSystemDark(true));
    expect(theme()).toBe('dark');
  });

  it('ignores a malformed saved value', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    render(<App />);
    expect(theme()).toBe('light');
  });

  it('keeps every section usable after switching theme', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(toggle());
    expect(theme()).toBe('dark');

    await user.selectOptions(panel().getByLabelText('Root note'), 'A');
    await user.click(screen.getByRole('button', { name: 'Generate chords' }));
    expect(screen.getByRole('heading', { name: 'A major' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /A major scale on the fretboard/ })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Chord finder' }));
    await user.click(screen.getByRole('button', { name: 'C/B' }));
    expect(screen.getByTestId('shape-code')).toHaveTextContent('x2x010');

    await user.click(screen.getByRole('tab', { name: 'Learn triads' }));
    expect(screen.getByRole('heading', { name: 'A major' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Practise progressions' }));
    expect(screen.getByRole('heading', { name: /in A major$/ })).toBeInTheDocument();

    await user.click(toggle());
    expect(theme()).toBe('light');
    expect(screen.getByRole('heading', { name: /in A major$/ })).toBeInTheDocument();
  });
});

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

describe('scale fretboard in explore chords', () => {
  const fretboard = () => screen.getByRole('img', { name: /major scale on the fretboard/ });
  const markers = (tone: string) =>
    Array.from(fretboard().querySelectorAll(`[data-tone="${tone}"]`));
  const labelsOf = (tone: string) =>
    new Set(markers(tone).map((marker) => marker.getAttribute('data-label')));
  const legend = () =>
    within(screen.getByRole('list', { name: 'Fretboard legend' }))
      .getAllByRole('listitem')
      .map((item) => item.querySelector('span')?.textContent);
  const chip = (name: RegExp) => screen.getByRole('button', { name });

  it('renders A major with roots, chord tones and the other scale notes', async () => {
    await generateChords('A');
    expect(screen.getByRole('heading', { name: 'A major on the fretboard' })).toBeInTheDocument();
    expect(fretboard()).toHaveAccessibleName('A major scale on the fretboard, A major highlighted');
    expect(fretboard()).toHaveAttribute(
      'aria-description',
      'Frets 0 to 12, high e on top, low E at the bottom. Root A. Chord tones 3/C♯, 5/E. Other scale notes 2/B, 4/D, 6/F♯, 7/G♯.',
    );
    expect(markers('root')).toHaveLength(7);
    expect(labelsOf('root')).toEqual(new Set(['1']));
    expect(labelsOf('chord')).toEqual(new Set(['3', '5']));
    expect(labelsOf('scale')).toEqual(new Set(['2', '4', '6', '7']));
    expect(markers('altered')).toHaveLength(0);
    expect(legend()).toEqual(['Root', 'Selected chord tone', 'Other scale note']);
    expect(screen.getByRole('button', { name: 'Highlight selected chord' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('follows chord type and root changes, showing altered tones distinctly', async () => {
    const user = await generateChords('A');
    await user.click(chip(/^Am, A minor$/));
    expect(fretboard()).toHaveAccessibleName('A major scale on the fretboard, A minor highlighted');
    expect(labelsOf('altered')).toEqual(new Set(['♭3']));
    expect(labelsOf('chord')).toEqual(new Set(['5']));
    expect(labelsOf('scale')).toEqual(new Set(['2', '3', '4', '6', '7']));
    expect(legend()).toContain('Altered chord tone');

    await user.click(chip(/^A7, A dominant seventh$/));
    expect(labelsOf('altered')).toEqual(new Set(['♭7']));
    expect(labelsOf('scale')).toContain('7');

    await user.click(chip(/^Am7, A minor seventh$/));
    expect(labelsOf('altered')).toEqual(new Set(['♭3', '♭7']));

    await user.click(chip(/^Aaug, A augmented$/));
    await user.click(
      within(screen.getByRole('group', { name: 'Fretboard dot labels' })).getByRole('button', {
        name: 'Notes',
      }),
    );
    expect(labelsOf('altered')).toEqual(new Set(['E♯']));

    await user.selectOptions(panel().getByLabelText('Root note'), 'Bflat');
    await user.click(screen.getByRole('button', { name: 'Generate chords' }));
    expect(screen.getByRole('heading', { name: 'B♭ major on the fretboard' })).toBeInTheDocument();
    // Still B♭ augmented: F is the natural fifth, so it is a plain scale note and F♯ is altered.
    expect(labelsOf('scale')).toEqual(new Set(['C', 'E♭', 'F', 'G', 'A']));
    expect(labelsOf('altered')).toEqual(new Set(['F♯']));
    expect(labelsOf('root')).toEqual(new Set(['B♭']));
  });

  it('switches between degree, note and combined labels and keeps the choice', async () => {
    const user = await generateChords('A');
    const labels = () => within(screen.getByRole('group', { name: 'Fretboard dot labels' }));
    await user.click(labels().getByRole('button', { name: 'Notes' }));
    expect(labelsOf('root')).toEqual(new Set(['A']));
    expect(labelsOf('chord')).toEqual(new Set(['C♯', 'E']));
    await user.click(labels().getByRole('button', { name: 'Both' }));
    expect(labelsOf('root')).toEqual(new Set(['1/A']));
    expect(labelsOf('scale')).toEqual(new Set(['2/B', '4/D', '6/F♯', '7/G♯']));

    await user.click(chip(/^Am, A minor$/));
    expect(labels().getByRole('button', { name: 'Both' })).toHaveAttribute('aria-pressed', 'true');
    expect(labelsOf('altered')).toEqual(new Set(['♭3/C']));
  });

  it('disables and re-enables chord highlighting', async () => {
    const user = await generateChords('A');
    await user.click(chip(/^Am7, A minor seventh$/));
    const highlight = () => screen.getByRole('button', { name: 'Highlight selected chord' });
    const scaleCount = markers('scale').length + markers('chord').length;

    await user.click(highlight());
    expect(highlight()).toHaveAttribute('aria-pressed', 'false');
    expect(fretboard()).toHaveAccessibleName('A major scale on the fretboard');
    expect(markers('chord')).toHaveLength(0);
    expect(markers('altered')).toHaveLength(0);
    expect(markers('root')).toHaveLength(7);
    expect(markers('scale')).toHaveLength(scaleCount);
    expect(legend()).toEqual(['Root', 'Other scale note']);

    await user.click(chip(/^A7, A dominant seventh$/));
    expect(highlight()).toHaveAttribute('aria-pressed', 'false');
    await user.click(highlight());
    expect(labelsOf('altered')).toEqual(new Set(['♭7']));
  });

  it('collapses and reopens, keeping the state across chord changes', async () => {
    const user = await generateChords('A');
    const toggle = () => screen.getByRole('button', { name: /fretboard$/ });
    expect(toggle()).toHaveTextContent('Hide fretboard');
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle());
    expect(toggle()).toHaveTextContent('Show fretboard');
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('img', { name: /major scale on the fretboard/ })).toBeNull();

    await user.click(chip(/^Am, A minor$/));
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle());
    expect(fretboard()).toHaveAccessibleName('A major scale on the fretboard, A minor highlighted');
  });

  it('keeps the fretboard inside a horizontally scrolling container', async () => {
    await generateChords('A');
    const scroller = fretboard().parentElement as HTMLElement;
    expect(scroller).toHaveStyle({ overflowX: 'auto' });
    expect(fretboard().style.minWidth).toMatch(/^\d+px$/);
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

describe('chord finder', () => {
  async function openFinder() {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: 'Chord finder' }));
    return user;
  }

  const input = () => panel().getByLabelText('Chord symbol');
  const shapeCode = () => screen.getByTestId('shape-code').textContent;
  const playSteps = () =>
    within(screen.getByRole('region', { name: 'Play this shape' }))
      .getAllByRole('listitem')
      .map((item) => item.textContent);
  const stringCells = () =>
    within(screen.getByRole('list', { name: 'Strings, low E to high e' }))
      .getAllByRole('listitem')
      .map((item) => item.getAttribute('aria-label'));

  it('finds a chord with the button and shows the recommended shape straight away', async () => {
    const user = await openFinder();
    await user.type(input(), 'C/B');
    await user.click(screen.getByRole('button', { name: 'Find chord' }));

    expect(screen.getByRole('heading', { level: 3, name: 'C/B' })).toBeInTheDocument();
    expect(screen.getByText('C major over B')).toBeInTheDocument();
    const header = within(
      screen.getByRole('heading', { level: 3, name: 'C/B' }).closest('header') as HTMLElement,
    );
    expect(header.getByText('Recommended shape')).toBeInTheDocument();
    expect(header.getByText('Open position')).toBeInTheDocument();
    expect(shapeCode()).toBe('x2x010');
    expect(screen.getByRole('img', { name: 'C/B, open position, shape x2x010' })).toHaveAttribute(
      'aria-description',
      expect.stringContaining('string 5 2nd fret, finger 2 (B)'),
    );
    expect(playSteps()).toEqual([
      'Start on string 5.',
      'Strum toward the high e string.',
      'Mute strings 6 and 4.',
      'Let strings 3 and 1 ring open.',
      'Finger 2 on string 5 fret 2, finger 1 on string 2 fret 1.',
    ]);
    expect(stringCells()).toEqual([
      'String 6, low E, muted',
      'String 5, A, fret 2, finger 2, start here',
      'String 4, D, muted',
      'String 3, G, open',
      'String 2, B, fret 1, finger 1',
      'String 1, high e, open',
    ]);
    expect(screen.getByRole('heading', { name: 'Other ways to play it' })).toBeInTheDocument();
  });

  it('searches when Enter is pressed and hides the alternatives for a single shape', async () => {
    const user = await openFinder();
    await user.type(input(), 'c/e{Enter}');
    expect(screen.getByRole('heading', { level: 3, name: 'C/E' })).toBeInTheDocument();
    expect(shapeCode()).toBe('032010');
    expect(playSteps().slice(0, 2)).toEqual(['Start on string 6.', 'Strum all six strings.']);
    expect(screen.queryByRole('heading', { name: 'Other ways to play it' })).toBeNull();
  });

  it('searches when an example is clicked', async () => {
    const user = await openFinder();
    await user.click(screen.getByRole('button', { name: 'B♭maj7/D' }));
    expect(input()).toHaveValue('B♭maj7/D');
    expect(screen.getByRole('heading', { level: 3, name: 'B♭maj7/D' })).toBeInTheDocument();
    expect(screen.getByText('B♭ major seventh over D')).toBeInTheDocument();
    expect(shapeCode()).toBe('x53335');
    expect(playSteps()).toContain('Barre strings 4 to 2 at fret 3 with finger 1.');
  });

  it('switches to an alternative shape and updates the diagram and instructions together', async () => {
    const user = await openFinder();
    await user.click(screen.getByRole('button', { name: 'C/B' }));
    const alternative = screen.getByRole('button', { name: /7x555x/ });
    expect(alternative).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /x2x010/ })).toHaveAccessibleName(
      'Open position, x2x010, open, recommended',
    );

    await user.click(alternative);
    expect(alternative).toHaveAttribute('aria-pressed', 'true');
    expect(alternative).toHaveAccessibleName('5th fret barre, 7x555x, barre, selected');
    expect(screen.getByText('Selected shape')).toBeInTheDocument();
    expect(shapeCode()).toBe('7x555x');
    expect(
      screen.getByRole('img', { name: 'C/B, 5th fret barre, shape 7x555x' }),
    ).toBeInTheDocument();
    expect(playSteps()).toEqual([
      'Start on string 6.',
      'Strum down to string 2; do not hit string 1.',
      'Mute strings 5 and 1.',
      'Barre strings 4 to 2 at fret 5 with finger 1.',
      'Finger 3 on string 6 fret 7.',
    ]);
    expect(stringCells()[0]).toBe('String 6, low E, fret 7, finger 3, start here');
    expect(stringCells()[5]).toBe('String 1, high e, muted');
    // The recommended option keeps its label; the chosen one is "selected", not "recommended".
    expect(screen.getByRole('button', { name: /x2x010/ })).toHaveAccessibleName(
      'Open position, x2x010, open, recommended',
    );
  });

  it('accepts ASCII and musical accidentals', async () => {
    const user = await openFinder();
    await user.type(input(), 'F#m7{Enter}');
    expect(screen.getByRole('heading', { level: 3, name: 'F♯m7' })).toBeInTheDocument();
    expect(shapeCode()).toBe('242222');
    expect(playSteps()).toContain('Barre strings 6 to 1 at fret 2 with finger 1.');

    await user.clear(input());
    await user.type(input(), 'F♯m7{Enter}');
    expect(shapeCode()).toBe('242222');

    await user.clear(input());
    await user.type(input(), 'Bbmaj7/D{Enter}');
    expect(screen.getByRole('heading', { level: 3, name: 'B♭maj7/D' })).toBeInTheDocument();
  });

  it('explains invalid notation, keeps the text and hides the previous result', async () => {
    const user = await openFinder();
    await user.click(screen.getByRole('button', { name: 'C/B' }));
    expect(screen.getByRole('heading', { level: 3, name: 'C/B' })).toBeInTheDocument();

    await user.clear(input());
    await user.type(input(), 'Cxyz{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent(
      '“xyz” is not a chord type this app knows. Supported types, written on C: C, Cm, C7, Cmaj7, Cm7, Csus2, Csus4, Cdim, Caug.',
    );
    expect(input()).toHaveValue('Cxyz');
    expect(screen.queryByRole('heading', { level: 3, name: 'C/B' })).toBeNull();
    expect(screen.queryByTestId('shape-code')).toBeNull();

    await user.clear(input());
    await user.type(input(), 'H{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('“H” does not start with a note name.');

    await user.clear(input());
    await user.type(input(), 'C/X{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('“X” after the slash is not a bass note.');
  });

  it('distinguishes a valid chord that has no verified shape yet', async () => {
    const user = await openFinder();
    await user.type(input(), 'C/F{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'C/F is a valid chord, but there is no verified shape for it yet. Try C without the bass note, or one of the examples.',
    );
    expect(screen.queryByTestId('shape-code')).toBeNull();
  });

  it('keeps the search and the chosen shape when switching sections', async () => {
    const user = await openFinder();
    await user.click(screen.getByRole('button', { name: 'C/B' }));
    await user.click(screen.getByRole('button', { name: /7x555x/ }));
    expect(shapeCode()).toBe('7x555x');

    await user.click(screen.getByRole('tab', { name: 'Learn triads' }));
    expect(screen.getByRole('heading', { name: 'A major' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Chord finder' }));
    expect(input()).toHaveValue('C/B');
    expect(screen.getByRole('heading', { level: 3, name: 'C/B' })).toBeInTheDocument();
    expect(shapeCode()).toBe('7x555x');
    expect(screen.getByRole('button', { name: /7x555x/ })).toHaveAttribute('aria-pressed', 'true');
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
