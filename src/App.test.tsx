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

  /** Bass, degrees, notes and frets of each inversion card in the visible panel, in card order. */
  const cards = () =>
    (['root', 'first', 'second'] as const).map((inversion) => ({
      bass: panel().getByTestId(`${inversion}-bass`).textContent,
      degrees: panel().getByTestId(`${inversion}-degrees`).textContent,
      notes: panel().getByTestId(`${inversion}-notes`).textContent,
      frets: panel().getByTestId(`${inversion}-frets`).textContent,
    }));

  /** Primary text inside the note markers of a diagram, lowest string of the set first. */
  const markerLabels = (image: HTMLElement) =>
    Array.from(image.querySelectorAll('.note-marker'))
      .sort((a, b) => Number(b.getAttribute('data-string')) - Number(a.getAttribute('data-string')))
      .map((marker) => marker.querySelector('.note-marker__label')?.textContent);

  const markerSublabels = (image: HTMLElement) =>
    Array.from(image.querySelectorAll('.note-marker'))
      .sort((a, b) => Number(b.getAttribute('data-string')) - Number(a.getAttribute('data-string')))
      .map((marker) => marker.querySelector('.note-marker__sublabel')?.textContent ?? null);

  const fretboard = () => screen.getByRole('img', { name: /across the fretboard/ });

  it('opens on A major with the formula, notes, three inversions and the fretboard', async () => {
    await openTriads();
    expect(screen.getByRole('tab', { name: 'Learn triads' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'A major' })).toBeInTheDocument();
    expect(panel().getByTestId('triad-formula')).toHaveTextContent('1–3–5');
    expect(panel().getByTestId('triad-notes')).toHaveTextContent('A–C♯–E');

    const inversions = within(screen.getByRole('list', { name: 'Inversions' }));
    expect(
      inversions.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(['Root position', 'First inversion', 'Second inversion']);
    expect(cards()).toEqual([
      { bass: 'A in the bass', degrees: 'R → 3 → 5', notes: 'A → C♯ → E', frets: '2–2–0' },
      { bass: 'C♯ in the bass', degrees: '3 → 5 → R', notes: 'C♯ → E → A', frets: '6–5–5' },
      { bass: 'E in the bass', degrees: '5 → R → 3', notes: 'E → A → C♯', frets: '9–10–9' },
    ]);
    expect(
      screen.getByRole('img', { name: 'A major, root position on strings 3, 2, 1' }),
    ).toHaveAttribute(
      'aria-description',
      'A major, root position on strings 3, 2, 1: string 3 2nd fret A (R), string 2 2nd fret C♯ (3), string 1 open E (5). Tab view: string 1, the high e, at the top; string 6, the low E, at the bottom; the nut on the left, frets 1 to 4.',
    );
    expect(
      screen.getByRole('img', { name: 'A major, first inversion on strings 3, 2, 1' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'A major, second inversion on strings 3, 2, 1' }),
    ).toBeInTheDocument();
    expect(panel().getAllByText('Tab view · high e at top')).toHaveLength(4);

    expect(fretboard()).toHaveAccessibleName(
      'A major across the fretboard on strings 3–2–1 · G–B–e',
    );
    expect(fretboard()).toHaveAttribute(
      'aria-description',
      'Frets 0 to 12, strings 3–2–1 · G–B–e low to high: root position at frets 2–2–0; first inversion at frets 6–5–5; second inversion at frets 9–10–9.',
    );
    expect(fretboard().querySelectorAll('line[data-string]')).toHaveLength(6);
    expect(screen.getByRole('list', { name: 'Legend' })).toHaveTextContent('Root (ringed)');
  });

  it('updates every card and the fretboard when the root changes', async () => {
    const user = await openTriads();
    await user.selectOptions(panel().getByLabelText('Root note'), 'C');
    expect(screen.getByRole('heading', { name: 'C major' })).toBeInTheDocument();
    expect(panel().getByTestId('triad-notes')).toHaveTextContent('C–E–G');
    expect(cards()).toEqual([
      { bass: 'C in the bass', degrees: 'R → 3 → 5', notes: 'C → E → G', frets: '5–5–3' },
      { bass: 'E in the bass', degrees: '3 → 5 → R', notes: 'E → G → C', frets: '9–8–8' },
      { bass: 'G in the bass', degrees: '5 → R → 3', notes: 'G → C → E', frets: '0–1–0' },
    ]);
    expect(
      screen.getByRole('img', { name: 'C major, second inversion on strings 3, 2, 1' }),
    ).toBeInTheDocument();
    expect(fretboard()).toHaveAttribute(
      'aria-description',
      expect.stringContaining('second inversion at frets 0–1–0'),
    );
  });

  it('switches between the four triad qualities', async () => {
    const user = await openTriads();
    await user.click(screen.getByRole('button', { name: 'Minor' }));
    expect(screen.getByRole('button', { name: 'Minor' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'A minor' })).toBeInTheDocument();
    expect(panel().getByTestId('triad-formula')).toHaveTextContent('1–♭3–5');
    expect(panel().getByTestId('triad-notes')).toHaveTextContent('A–C–E');
    expect(cards()).toEqual([
      { bass: 'A in the bass', degrees: 'R → ♭3 → 5', notes: 'A → C → E', frets: '2–1–0' },
      { bass: 'C in the bass', degrees: '♭3 → 5 → R', notes: 'C → E → A', frets: '5–5–5' },
      { bass: 'E in the bass', degrees: '5 → R → ♭3', notes: 'E → A → C', frets: '9–10–8' },
    ]);

    await user.selectOptions(panel().getByLabelText('Root note'), 'B');
    await user.click(screen.getByRole('button', { name: 'Diminished' }));
    expect(screen.getByRole('heading', { name: 'B diminished' })).toBeInTheDocument();
    expect(cards()[0]).toEqual({
      bass: 'B in the bass',
      degrees: 'R → ♭3 → ♭5',
      notes: 'B → D → F',
      frets: '4–3–1',
    });

    await user.selectOptions(panel().getByLabelText('Root note'), 'Eflat');
    await user.click(screen.getByRole('button', { name: 'Augmented' }));
    expect(screen.getByRole('heading', { name: 'E♭ augmented' })).toBeInTheDocument();
    expect(cards()).toEqual([
      { bass: 'E♭ in the bass', degrees: 'R → 3 → ♯5', notes: 'E♭ → G → B', frets: '8–8–7' },
      { bass: 'G in the bass', degrees: '3 → ♯5 → R', notes: 'G → B → E♭', frets: '12–12–11' },
      { bass: 'B in the bass', degrees: '♯5 → R → 3', notes: 'B → E♭ → G', frets: '4–4–3' },
    ]);
    expect(markerLabels(screen.getByRole('img', { name: /E♭ augmented, root position/ }))).toEqual([
      'R',
      '3',
      '♯5',
    ]);

    await user.click(screen.getByRole('button', { name: 'Major' }));
    expect(screen.getByRole('heading', { name: 'E♭ major' })).toBeInTheDocument();
  });

  it('changes the string set and shows its low-to-high order', async () => {
    const user = await openTriads();
    const sets = within(panel().getByRole('group', { name: 'String set' }));
    expect(sets.getAllByRole('button').map((button) => button.textContent)).toEqual([
      '1–2–3 · Treble3–2–1 · G–B–e',
      '2–3–44–3–2 · D–G–B',
      '3–4–55–4–3 · A–D–G',
      '4–5–6 · Bass6–5–4 · E–A–D',
    ]);

    await user.click(sets.getByRole('button', { name: /^3–4–5/ }));
    expect(cards()).toEqual([
      { bass: 'A in the bass', degrees: 'R → 3 → 5', notes: 'A → C♯ → E', frets: '12–11–9' },
      { bass: 'C♯ in the bass', degrees: '3 → 5 → R', notes: 'C♯ → E → A', frets: '4–2–2' },
      { bass: 'E in the bass', degrees: '5 → R → 3', notes: 'E → A → C♯', frets: '7–7–6' },
    ]);
    const rootPosition = screen.getByRole('img', {
      name: 'A major, root position on strings 5, 4, 3',
    });
    expect(rootPosition.querySelectorAll('line[data-string]')).toHaveLength(6);
    expect(
      Array.from(rootPosition.querySelectorAll('line[data-active="true"]')).map((line) =>
        line.getAttribute('data-string'),
      ),
    ).toEqual(['5', '4', '3']); // drawn low E first
    expect(fretboard()).toHaveAccessibleName(
      'A major across the fretboard on strings 5–4–3 · A–D–G',
    );

    await user.click(sets.getByRole('button', { name: /^4–5–6/ }));
    expect(cards()[0].frets).toBe('5–4–2');
    expect(
      screen.getByRole('img', { name: 'A major, root position on strings 6, 5, 4' }),
    ).toBeInTheDocument();
  });

  it('shows degree over note by default and switches to degrees or notes only', async () => {
    const user = await openTriads();
    const firstInversion = () =>
      screen.getByRole('img', { name: 'A major, first inversion on strings 3, 2, 1' });
    expect(screen.getByRole('button', { name: 'Degree + note' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(markerLabels(firstInversion())).toEqual(['3', '5', 'R']);
    expect(markerSublabels(firstInversion())).toEqual(['C♯', 'E', 'A']);

    await user.click(screen.getByRole('button', { name: 'Notes' }));
    expect(markerLabels(firstInversion())).toEqual(['C♯', 'E', 'A']);
    expect(markerSublabels(firstInversion())).toEqual([null, null, null]);
    expect(markerLabels(fretboard())).toEqual(['A', 'C♯', 'E', 'C♯', 'E', 'A', 'E', 'A', 'C♯']);

    await user.click(screen.getByRole('button', { name: 'Degrees' }));
    expect(markerLabels(firstInversion())).toEqual(['3', '5', 'R']);
    expect(markerSublabels(firstInversion())).toEqual([null, null, null]);

    await user.click(screen.getByRole('button', { name: 'Degree + note' }));
    expect(markerSublabels(firstInversion())).toEqual(['C♯', 'E', 'A']);
  });

  it('keeps its selections, and the other tabs theirs, when switching tabs', async () => {
    const user = await openTriads();
    await user.selectOptions(panel().getByLabelText('Root note'), 'Eflat');
    await user.click(screen.getByRole('button', { name: 'Minor' }));
    await user.click(screen.getByRole('button', { name: /^2–3–4/ }));
    await user.click(screen.getByRole('button', { name: 'Notes' }));
    expect(screen.getByRole('heading', { name: 'E♭ minor' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Explore chords' }));
    await user.selectOptions(panel().getByLabelText('Root note'), 'G');
    await user.click(screen.getByRole('button', { name: 'Generate chords' }));
    expect(screen.getByRole('heading', { name: 'G major' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Learn triads' }));
    expect(screen.getByRole('heading', { name: 'E♭ minor' })).toBeInTheDocument();
    expect(panel().getByLabelText('Root note')).toHaveValue('Eflat');
    expect(screen.getByRole('button', { name: 'Minor' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^2–3–4/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Notes' })).toHaveAttribute('aria-pressed', 'true');
    expect(panel().getByTestId('triad-notes')).toHaveTextContent('E♭–G♭–B♭');

    await user.click(screen.getByRole('tab', { name: 'Explore chords' }));
    expect(screen.getByRole('heading', { name: 'G major' })).toBeInTheDocument();
  });
});

describe('chords in a key', () => {
  async function openKeys() {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: 'Chords in a key' }));
    return user;
  }

  const chordCards = () => within(screen.getByRole('group', { name: 'Chords in this key' }));
  const stringSets = () => within(screen.getByRole('group', { name: 'String set' }));
  const scaleTypes = () => within(screen.getByRole('group', { name: 'Scale type' }));
  const dotLabels = () => within(screen.getByRole('group', { name: 'Fretboard dot labels' }));
  const cardTexts = () =>
    chordCards()
      .getAllByRole('button')
      .map((button) => button.textContent);
  const scaleTiles = () =>
    within(screen.getByRole('list', { name: /^Notes in / }))
      .getAllByRole('listitem')
      .map((item) => ({
        text: item.textContent?.replace(/,.*$/, ''),
        highlighted: item.getAttribute('data-highlighted') === 'true',
      }));
  const cards = () =>
    (['root', 'first', 'second'] as const).map((inversion) => ({
      bass: panel().getByTestId(`${inversion}-bass`).textContent,
      notes: panel().getByTestId(`${inversion}-notes`).textContent,
      frets: panel().getByTestId(`${inversion}-frets`).textContent,
    }));
  const fretboard = () => screen.getByRole('img', { name: /scale on the fretboard/ });
  const fretboardTones = (tone: string) =>
    [
      ...new Set(
        Array.from(fretboard().querySelectorAll(`.note-marker[data-tone="${tone}"]`)).map(
          (marker) => marker.getAttribute('data-label'),
        ),
      ),
    ].sort();
  const keyRootLabels = () => [
    ...new Set(
      Array.from(fretboard().querySelectorAll('.note-marker[data-key-root="true"]')).map((marker) =>
        marker.getAttribute('data-label'),
      ),
    ),
  ];
  const legend = () =>
    within(screen.getByRole('list', { name: 'Fretboard legend' }))
      .getAllByRole('listitem')
      .map((item) => item.querySelector('span')?.textContent);
  const fretboardToggle = () => screen.getByRole('button', { name: /fretboard$/ });
  const highlight = () => screen.getByRole('button', { name: 'Highlight selected chord' });

  it('opens on C major with its notes, seven chords, the I chord and its triads', async () => {
    await openKeys();
    expect(panel().getByLabelText('Root note')).toHaveValue('C');
    expect(scaleTypes().getByRole('button', { name: 'Major' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'Notes in C major' })).toBeInTheDocument();
    expect(scaleTiles()).toEqual([
      { text: 'C1', highlighted: true },
      { text: 'D2', highlighted: false },
      { text: 'E3', highlighted: true },
      { text: 'F4', highlighted: false },
      { text: 'G5', highlighted: true },
      { text: 'A6', highlighted: false },
      { text: 'B7', highlighted: false },
    ]);
    expect(cardTexts()).toEqual([
      'ICMajor',
      'iiDmMinor',
      'iiiEmMinor',
      'IVFMajor',
      'VGMajor',
      'viAmMinor',
      'vii°BdimDiminished',
    ]);
    expect(chordCards().getByRole('button', { name: /^C, I, C major/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(panel().getByTestId('key-chord-name')).toHaveTextContent('C major');
    expect(panel().getByTestId('key-chord-tones')).toHaveTextContent('C (R) · E (3) · G (5)');
    expect(panel().getByTestId('key-chord-role')).toHaveTextContent('I in C major');
    expect(screen.getByRole('heading', { name: 'C major on the fretboard' })).toBeInTheDocument();
    expect(screen.getByText('C major highlighted')).toBeInTheDocument();
    expect(fretboard()).toHaveAccessibleName('C major scale on the fretboard, C major highlighted');
    expect(fretboardTones('root')).toEqual(['1']);
    expect(fretboardTones('chord')).toEqual(['3', '5']);
    expect(fretboardTones('scale')).toEqual(['2', '4', '6', '7']);
    expect(legend()).toEqual([
      'Key root',
      'Selected chord root',
      'Selected chord tone',
      'Other scale note',
    ]);
    expect(screen.getByRole('list', { name: 'Inversions of C major' })).toBeInTheDocument();
    expect(cards()).toEqual([
      { bass: 'C in the bass', notes: 'C → E → G', frets: '5–5–3' },
      { bass: 'E in the bass', notes: 'E → G → C', frets: '9–8–8' },
      { bass: 'G in the bass', notes: 'G → C → E', frets: '0–1–0' },
    ]);
    expect(screen.getByRole('button', { name: 'Practise all C major triads' })).toBeInTheDocument();
  });

  it('selecting a chord highlights its notes, the fretboard, the summary, the triads and the action', async () => {
    const user = await openKeys();
    await user.click(chordCards().getByRole('button', { name: /^Dm, ii, D minor/ }));
    expect(chordCards().getByRole('button', { name: /^Dm, ii/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(chordCards().getByRole('button', { name: /^C, I/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(
      scaleTiles()
        .filter((tile) => tile.highlighted)
        .map((tile) => tile.text),
    ).toEqual(['D2', 'F4', 'A6']);
    expect(panel().getByTestId('key-chord-name')).toHaveTextContent('D minor');
    expect(panel().getByTestId('key-chord-tones')).toHaveTextContent('D (R) · F (♭3) · A (5)');
    expect(panel().getByTestId('key-chord-role')).toHaveTextContent('ii in C major');
    expect(screen.getByRole('heading', { name: 'C major on the fretboard' })).toBeInTheDocument();
    expect(screen.getByText('D minor highlighted')).toBeInTheDocument();
    expect(fretboard()).toHaveAccessibleName('C major scale on the fretboard, D minor highlighted');
    // Fretboard dots keep the degrees of the key, not chord-tone roles.
    expect(fretboardTones('root')).toEqual(['2']);
    expect(fretboardTones('chord')).toEqual(['4', '6']);
    expect(fretboardTones('scale')).toEqual(['1', '3', '5', '7']);
    expect(keyRootLabels()).toEqual(['1']);
    expect(cards()).toEqual([
      { bass: 'D in the bass', notes: 'D → F → A', frets: '7–6–5' },
      { bass: 'F in the bass', notes: 'F → A → D', frets: '10–10–10' },
      { bass: 'A in the bass', notes: 'A → D → F', frets: '2–3–1' },
    ]);
    expect(
      screen.getByRole('img', { name: 'D minor, root position on strings 3, 2, 1' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Practise all D minor triads' })).toBeInTheDocument();

    await user.click(chordCards().getByRole('button', { name: /^Bdim, vii°, B diminished/ }));
    expect(panel().getByTestId('key-chord-tones')).toHaveTextContent('B (R) · D (♭3) · F (♭5)');
    expect(cards()[0]).toEqual({ bass: 'B in the bass', notes: 'B → D → F', frets: '4–3–1' });
    expect(
      Array.from(
        screen
          .getByRole('img', { name: 'B diminished, root position on strings 3, 2, 1' })
          .querySelectorAll('.note-marker'),
      ).map((marker) => marker.getAttribute('data-degree')),
    ).toEqual(expect.arrayContaining(['R', '♭3', '♭5']));
  });

  it('changing the scale type updates the notes, every chord card and the fretboard, keeping the degree', async () => {
    const user = await openKeys();
    await user.click(chordCards().getByRole('button', { name: /^Em, iii/ }));

    await user.click(scaleTypes().getByRole('button', { name: 'Natural minor' }));
    expect(screen.getByRole('heading', { name: 'Notes in C natural minor' })).toBeInTheDocument();
    expect(scaleTiles().map((tile) => tile.text)).toEqual([
      'C1',
      'D2',
      'E♭♭3',
      'F4',
      'G5',
      'A♭♭6',
      'B♭♭7',
    ]);
    expect(cardTexts()).toEqual([
      'iCmMinor',
      'ii°DdimDiminished',
      'IIIE♭Major',
      'ivFmMinor',
      'vGmMinor',
      'VIA♭Major',
      'VIIB♭Major',
    ]);
    expect(panel().getByTestId('key-chord-name')).toHaveTextContent('E♭ major');
    expect(panel().getByTestId('key-chord-role')).toHaveTextContent('III in C natural minor');
    expect(
      screen.getByRole('heading', { name: 'C natural minor on the fretboard' }),
    ).toBeInTheDocument();

    await user.click(chordCards().getByRole('button', { name: /^Fm, iv/ }));
    expect(screen.getByText('F minor highlighted')).toBeInTheDocument();
    expect(fretboard()).toHaveAccessibleName(
      'C natural minor scale on the fretboard, F minor highlighted',
    );
    expect(fretboardTones('root')).toEqual(['4']);
    expect(fretboardTones('chord')).toEqual(['1', '♭6']);
    expect(fretboardTones('scale')).toEqual(['2', '5', '♭3', '♭7']);
    expect(keyRootLabels()).toEqual(['1']);

    await user.click(scaleTypes().getByRole('button', { name: 'Harmonic minor' }));
    expect(scaleTiles().map((tile) => tile.text)).toEqual([
      'C1',
      'D2',
      'E♭♭3',
      'F4',
      'G5',
      'A♭♭6',
      'B7',
    ]);
    expect(cardTexts()).toEqual([
      'iCmMinor',
      'ii°DdimDiminished',
      'III+E♭augAugmented',
      'ivFmMinor',
      'VGMajor',
      'VIA♭Major',
      'vii°BdimDiminished',
    ]);
    await user.click(chordCards().getByRole('button', { name: /^G, V/ }));
    expect(fretboardTones('root')).toEqual(['5']);
    expect(fretboardTones('chord')).toEqual(['2', '7']);

    await user.click(chordCards().getByRole('button', { name: /^E♭aug, III\+/ }));
    expect(panel().getByTestId('key-chord-name')).toHaveTextContent('E♭ augmented');
    expect(panel().getByTestId('key-chord-tones')).toHaveTextContent('E♭ (R) · G (3) · B (♯5)');
    expect(cards()).toEqual([
      { bass: 'E♭ in the bass', notes: 'E♭ → G → B', frets: '8–8–7' },
      { bass: 'G in the bass', notes: 'G → B → E♭', frets: '12–12–11' },
      { bass: 'B in the bass', notes: 'B → E♭ → G', frets: '4–4–3' },
    ]);
    expect(fretboardTones('root')).toEqual(['♭3']);
    expect(fretboardTones('chord')).toEqual(['5', '7']);

    await user.click(scaleTypes().getByRole('button', { name: 'Melodic minor' }));
    expect(scaleTiles().map((tile) => tile.text)).toEqual([
      'C1',
      'D2',
      'E♭♭3',
      'F4',
      'G5',
      'A6',
      'B7',
    ]);
    expect(cardTexts()).toEqual([
      'iCmMinor',
      'iiDmMinor',
      'III+E♭augAugmented',
      'IVFMajor',
      'VGMajor',
      'vi°AdimDiminished',
      'vii°BdimDiminished',
    ]);
    expect(fretboard()).toHaveAccessibleName(
      'C melodic minor scale on the fretboard, E flat augmented highlighted',
    );
    expect(fretboardTones('scale')).toEqual(['1', '2', '4', '6']);
  });

  it('switches fretboard dot labels and shares the choice with Explore chords', async () => {
    const user = await openKeys();
    await user.click(chordCards().getByRole('button', { name: /^Dm, ii/ }));
    await user.click(dotLabels().getByRole('button', { name: 'Notes' }));
    expect(fretboardTones('root')).toEqual(['D']);
    expect(fretboardTones('chord')).toEqual(['A', 'F']);
    expect(fretboardTones('scale')).toEqual(['B', 'C', 'E', 'G']);
    await user.click(dotLabels().getByRole('button', { name: 'Both' }));
    expect(fretboardTones('root')).toEqual(['2/D']);
    expect(fretboardTones('chord')).toEqual(['4/F', '6/A']);

    await user.click(screen.getByRole('tab', { name: 'Explore chords' }));
    await user.selectOptions(panel().getByLabelText('Root note'), 'A');
    await user.click(screen.getByRole('button', { name: 'Generate chords' }));
    expect(dotLabels().getByRole('button', { name: 'Both' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      Array.from(
        screen
          .getByRole('img', { name: /A major scale on the fretboard/ })
          .querySelectorAll('.note-marker[data-tone="root"]'),
      ).map((marker) => marker.getAttribute('data-label')),
    ).toContain('1/A');
    await user.click(dotLabels().getByRole('button', { name: 'Degrees' }));

    await user.click(screen.getByRole('tab', { name: 'Chords in a key' }));
    expect(dotLabels().getByRole('button', { name: 'Degrees' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(fretboardTones('root')).toEqual(['2']);
  });

  it('toggles chord highlighting locally and keeps the preference across chord changes', async () => {
    const user = await openKeys();
    await user.click(chordCards().getByRole('button', { name: /^Dm, ii/ }));
    expect(highlight()).toHaveAttribute('aria-pressed', 'true');

    await user.click(highlight());
    expect(highlight()).toHaveAttribute('aria-pressed', 'false');
    expect(fretboard()).toHaveAccessibleName('C major scale on the fretboard');
    expect(fretboardTones('root')).toEqual([]);
    expect(fretboardTones('chord')).toEqual([]);
    expect(fretboardTones('scale')).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    expect(keyRootLabels()).toEqual(['1']);
    expect(legend()).toEqual(['Key root', 'Other scale note']);
    expect(screen.queryByText('D minor highlighted')).toBeNull();
    expect(panel().getByTestId('key-chord-name')).toHaveTextContent('D minor');

    await user.click(chordCards().getByRole('button', { name: /^G, V/ }));
    expect(highlight()).toHaveAttribute('aria-pressed', 'false');
    await user.click(highlight());
    expect(fretboardTones('root')).toEqual(['5']);
    expect(fretboardTones('chord')).toEqual(['2', '7']);
  });

  it('hides and shows its fretboard without touching the Explore chords fretboard', async () => {
    const user = await openKeys();
    await user.click(chordCards().getByRole('button', { name: /^Am, vi/ }));
    expect(fretboardToggle()).toHaveTextContent('Hide fretboard');
    expect(fretboardToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(fretboardToggle()).toHaveAttribute('aria-controls', 'key-fretboard-panel');

    await user.click(fretboardToggle());
    expect(fretboardToggle()).toHaveTextContent('Show fretboard');
    expect(fretboardToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('img', { name: /scale on the fretboard/ })).toBeNull();
    expect(panel().getByTestId('key-chord-name')).toHaveTextContent('A minor');

    await user.click(screen.getByRole('tab', { name: 'Explore chords' }));
    await user.selectOptions(panel().getByLabelText('Root note'), 'A');
    await user.click(screen.getByRole('button', { name: 'Generate chords' }));
    expect(fretboardToggle()).toHaveTextContent('Hide fretboard');
    expect(fretboardToggle()).toHaveAttribute('aria-controls', 'explore-fretboard-panel');
    expect(screen.getByRole('img', { name: /A major scale on the fretboard/ })).toBeInTheDocument();
    await user.click(fretboardToggle());
    expect(fretboardToggle()).toHaveTextContent('Show fretboard');

    await user.click(screen.getByRole('tab', { name: 'Chords in a key' }));
    expect(fretboardToggle()).toHaveTextContent('Show fretboard');
    await user.click(fretboardToggle());
    expect(fretboard()).toHaveAccessibleName('C major scale on the fretboard, A minor highlighted');

    await user.click(screen.getByRole('tab', { name: 'Explore chords' }));
    expect(fretboardToggle()).toHaveTextContent('Show fretboard');
  });

  it('keeps the chosen chord when the string set changes, and the string set when the chord changes', async () => {
    const user = await openKeys();
    await user.click(chordCards().getByRole('button', { name: /^Dm, ii/ }));
    await user.click(stringSets().getByRole('button', { name: /^2–3–4/ }));
    expect(panel().getByTestId('key-chord-name')).toHaveTextContent('D minor');
    expect(stringSets().getByRole('button', { name: /^2–3–4/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(cards()).toEqual([
      { bass: 'D in the bass', notes: 'D → F → A', frets: '12–10–10' },
      { bass: 'F in the bass', notes: 'F → A → D', frets: '3–2–3' },
      { bass: 'A in the bass', notes: 'A → D → F', frets: '7–7–6' },
    ]);
    expect(
      screen.getByRole('img', { name: 'D minor, root position on strings 4, 3, 2' }),
    ).toBeInTheDocument();

    await user.click(chordCards().getByRole('button', { name: /^G, V/ }));
    expect(panel().getByTestId('key-chord-name')).toHaveTextContent('G major');
    expect(stringSets().getByRole('button', { name: /^2–3–4/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('img', { name: 'G major, root position on strings 4, 3, 2' }),
    ).toBeInTheDocument();
  });

  it('sends the chord and string set to Learn triads with "Practise all … triads"', async () => {
    const user = await openKeys();
    await user.click(chordCards().getByRole('button', { name: /^Dm, ii/ }));
    await user.click(stringSets().getByRole('button', { name: /^3–4–5/ }));
    await user.click(screen.getByRole('button', { name: 'Practise all D minor triads' }));

    expect(screen.getByRole('tab', { name: 'Learn triads' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'D minor' })).toBeInTheDocument();
    expect(panel().getByLabelText('Root note')).toHaveValue('D');
    expect(screen.getByRole('button', { name: 'Minor' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^3–4–5/ })).toHaveAttribute('aria-pressed', 'true');
    expect(panel().getByTestId('triad-notes')).toHaveTextContent('D–F–A');
    expect(
      screen.getByRole('img', { name: /D minor across the fretboard on strings 5–4–3/ }),
    ).toBeInTheDocument();

    // The key tab itself keeps its own selections.
    await user.click(screen.getByRole('tab', { name: 'Chords in a key' }));
    expect(panel().getByTestId('key-chord-name')).toHaveTextContent('D minor');
    expect(stringSets().getByRole('button', { name: /^3–4–5/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('spells sharp-key chords as the key does and still finds a root to practise', async () => {
    const user = await openKeys();
    await user.selectOptions(panel().getByLabelText('Root note'), 'Fsharp');
    expect(scaleTiles().map((tile) => tile.text)).toEqual([
      'F♯1',
      'G♯2',
      'A♯3',
      'B4',
      'C♯5',
      'D♯6',
      'E♯7',
    ]);
    await user.click(chordCards().getByRole('button', { name: /vii°, E sharp diminished/ }));
    expect(panel().getByTestId('key-chord-tones')).toHaveTextContent('E♯ (R) · G♯ (♭3) · B (♭5)');
    expect(cards()[0].notes).toBe('E♯ → G♯ → B');
    await user.click(dotLabels().getByRole('button', { name: 'Notes' }));
    expect(fretboardTones('root')).toEqual(['E♯']);

    await user.click(screen.getByRole('button', { name: 'Practise all E♯ diminished triads' }));
    expect(screen.getByRole('tab', { name: 'Learn triads' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'F diminished' })).toBeInTheDocument();
  });
});

describe('chords in a key: every root, spelled as chosen', () => {
  async function openKeys() {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: 'Chords in a key' }));
    return user;
  }

  const rootSelect = () => panel().getByLabelText('Root note') as HTMLSelectElement;
  const rootOptions = () =>
    Array.from(rootSelect().options).map((option) => ({
      value: option.value,
      text: option.textContent,
      spoken: option.getAttribute('aria-label'),
    }));
  const chordCards = () => within(screen.getByRole('group', { name: 'Chords in this key' }));
  const cardTexts = () =>
    chordCards()
      .getAllByRole('button')
      .map((button) => button.textContent);
  const scaleTiles = () =>
    within(screen.getByRole('list', { name: /^Notes in / }))
      .getAllByRole('listitem')
      .map((item) => item.textContent?.replace(/,.*$/, ''));
  const scaleTypes = () => within(screen.getByRole('group', { name: 'Scale type' }));
  const dotLabels = () => within(screen.getByRole('group', { name: 'Fretboard dot labels' }));
  const fretboard = () => screen.getByRole('img', { name: /scale on the fretboard/ });
  const fretboardTones = (tone: string) =>
    [
      ...new Set(
        Array.from(fretboard().querySelectorAll(`.note-marker[data-tone="${tone}"]`)).map(
          (marker) => marker.getAttribute('data-label'),
        ),
      ),
    ].sort();
  const cardNotes = (inversion: 'root' | 'first' | 'second') =>
    panel().getByTestId(`${inversion}-notes`).textContent;

  it('offers the same seventeen roots as Explore chords, in the same order, with spoken names', async () => {
    await openKeys();
    const options = rootOptions();
    expect(options.map((option) => option.text)).toEqual([
      'C',
      'C♯',
      'D♭',
      'D',
      'D♯',
      'E♭',
      'E',
      'F',
      'F♯',
      'G♭',
      'G',
      'G♯',
      'A♭',
      'A',
      'A♯',
      'B♭',
      'B',
    ]);
    expect(options.find((option) => option.value === 'Csharp')?.spoken).toBe('C sharp');
    expect(options.find((option) => option.value === 'Gflat')?.spoken).toBe('G flat');

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Explore chords' }));
    const explorerOptions = Array.from(
      (panel().getByLabelText('Root note') as HTMLSelectElement).options,
    ).map((option) => option.value);
    expect(options.map((option) => option.value)).toEqual(explorerOptions);
  });

  it('C♯ major keeps E♯ and B♯ in the scale, the chords, the fretboard and the triads', async () => {
    const user = await openKeys();
    await user.selectOptions(rootSelect(), 'Csharp');
    expect(rootSelect()).toHaveValue('Csharp');
    expect(screen.getByRole('heading', { name: 'Notes in C♯ major' })).toBeInTheDocument();
    expect(scaleTiles()).toEqual(['C♯1', 'D♯2', 'E♯3', 'F♯4', 'G♯5', 'A♯6', 'B♯7']);
    expect(cardTexts()).toEqual([
      'IC♯Major',
      'iiD♯mMinor',
      'iiiE♯mMinor',
      'IVF♯Major',
      'VG♯Major',
      'viA♯mMinor',
      'vii°B♯dimDiminished',
    ]);
    expect(chordCards().getByRole('button', { name: 'C♯, I, C sharp major' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(panel().getByTestId('key-chord-tones')).toHaveTextContent('C♯ (R) · E♯ (3) · G♯ (5)');
    expect(panel().getByTestId('key-chord-role')).toHaveTextContent('I in C♯ major');
    expect(screen.queryByTestId('enharmonic-note')).toBeNull();

    expect(fretboard()).toHaveAccessibleName(
      'C sharp major scale on the fretboard, C sharp major highlighted',
    );
    expect(fretboard()).toHaveAttribute(
      'aria-description',
      expect.stringContaining(
        'Scale notes are C sharp, D sharp, E sharp, F sharp, G sharp, A sharp and B sharp.',
      ),
    );
    await user.click(dotLabels().getByRole('button', { name: 'Notes' }));
    expect(fretboardTones('root')).toEqual(['C♯']);
    expect(fretboardTones('chord')).toEqual(['E♯', 'G♯']);
    expect(fretboardTones('scale')).toEqual(['A♯', 'B♯', 'D♯', 'F♯']);
    await user.click(dotLabels().getByRole('button', { name: 'Both' }));
    expect(fretboardTones('chord')).toEqual(['3/E♯', '5/G♯']);

    expect(cardNotes('root')).toBe('C♯ → E♯ → G♯');
    expect(cardNotes('first')).toBe('E♯ → G♯ → C♯');
    expect(
      screen.getByRole('img', { name: 'C♯ major, root position on strings 3, 2, 1' }),
    ).toHaveAttribute('aria-description', expect.stringContaining('E♯ (3)'));
    expect(
      screen.getByRole('button', { name: 'Practise all C♯ major triads' }),
    ).toBeInTheDocument();
  });

  it('C♯ harmonic minor spells its vii° as B♯ diminished with B♯, D♯, F♯', async () => {
    const user = await openKeys();
    await user.selectOptions(rootSelect(), 'Csharp');
    await user.click(scaleTypes().getByRole('button', { name: 'Harmonic minor' }));
    expect(rootSelect()).toHaveValue('Csharp');
    expect(scaleTiles()).toEqual(['C♯1', 'D♯2', 'E♭3', 'F♯4', 'G♯5', 'A♭6', 'B♯7']);
    expect(cardTexts()).toEqual([
      'iC♯mMinor',
      'ii°D♯dimDiminished',
      'III+EaugAugmented',
      'ivF♯mMinor',
      'VG♯Major',
      'VIAMajor',
      'vii°B♯dimDiminished',
    ]);
    await user.click(chordCards().getByRole('button', { name: /^B♯dim, vii°/ }));
    expect(panel().getByTestId('key-chord-tones')).toHaveTextContent('B♯ (R) · D♯ (♭3) · F♯ (♭5)');
    expect(cardNotes('root')).toBe('B♯ → D♯ → F♯');
    expect(cardNotes('second')).toBe('F♯ → B♯ → D♯');
    expect(panel().getByTestId('root-frets')).toHaveTextContent('5–4–2');
    await user.click(dotLabels().getByRole('button', { name: 'Notes' }));
    expect(fretboardTones('root')).toEqual(['B♯']);

    await user.click(scaleTypes().getByRole('button', { name: 'Natural minor' }));
    expect(cardTexts()).toEqual([
      'iC♯mMinor',
      'ii°D♯dimDiminished',
      'IIIEMajor',
      'ivF♯mMinor',
      'vG♯mMinor',
      'VIAMajor',
      'VIIBMajor',
    ]);
    await user.click(scaleTypes().getByRole('button', { name: 'Melodic minor' }));
    expect(cardTexts()).toEqual([
      'iC♯mMinor',
      'iiD♯mMinor',
      'III+EaugAugmented',
      'IVF♯Major',
      'VG♯Major',
      'vi°A♯dimDiminished',
      'vii°B♯dimDiminished',
    ]);
  });

  it('D♯ and A♯ major keep their double sharps and only mention the common spelling', async () => {
    const user = await openKeys();
    await user.selectOptions(rootSelect(), 'Dsharp');
    expect(rootSelect()).toHaveValue('Dsharp');
    expect(scaleTiles()).toEqual(['D♯1', 'E♯2', 'F𝄪3', 'G♯4', 'A♯5', 'B♯6', 'C𝄪7']);
    expect(cardTexts()).toEqual([
      'ID♯Major',
      'iiE♯mMinor',
      'iiiF𝄪mMinor',
      'IVG♯Major',
      'VA♯Major',
      'viB♯mMinor',
      'vii°C𝄪dimDiminished',
    ]);
    expect(panel().getByTestId('enharmonic-note')).toHaveTextContent(
      'D♯ major uses double sharps. E♭ major is its more commonly written enharmonic equivalent.',
    );
    await user.click(chordCards().getByRole('button', { name: 'F𝄪m, iii, F double sharp minor' }));
    expect(panel().getByTestId('key-chord-tones')).toHaveTextContent('F𝄪 (R) · A♯ (♭3) · C𝄪 (5)');
    expect(cardNotes('root')).toBe('F𝄪 → A♯ → C𝄪');
    await user.click(dotLabels().getByRole('button', { name: 'Notes' }));
    expect(fretboardTones('root')).toEqual(['F𝄪']);
    expect(fretboardTones('chord')).toEqual(['A♯', 'C𝄪']);
    expect(rootSelect()).toHaveValue('Dsharp');

    await user.selectOptions(rootSelect(), 'Asharp');
    expect(scaleTiles()).toEqual(['A♯1', 'B♯2', 'C𝄪3', 'D♯4', 'E♯5', 'F𝄪6', 'G𝄪7']);
    expect(cardTexts()[6]).toBe('vii°G𝄪dimDiminished');
    expect(panel().getByTestId('enharmonic-note')).toHaveTextContent('B♭ major is its more');

    await user.selectOptions(rootSelect(), 'Gsharp');
    await user.click(scaleTypes().getByRole('button', { name: 'Natural minor' }));
    expect(scaleTiles()).toEqual(['G♯1', 'A♯2', 'B♭3', 'C♯4', 'D♯5', 'E♭6', 'F♯♭7']);
    expect(cardTexts()).toEqual([
      'iG♯mMinor',
      'ii°A♯dimDiminished',
      'IIIBMajor',
      'ivC♯mMinor',
      'vD♯mMinor',
      'VIEMajor',
      'VIIF♯Major',
    ]);
    expect(screen.queryByTestId('enharmonic-note')).toBeNull();
  });

  it('keeps a flat spelling when the scale type changes, using double flats where needed', async () => {
    const user = await openKeys();
    await user.selectOptions(rootSelect(), 'Dflat');
    await user.click(scaleTypes().getByRole('button', { name: 'Natural minor' }));
    expect(rootSelect()).toHaveValue('Dflat');
    expect(screen.getByRole('heading', { name: 'Notes in D♭ natural minor' })).toBeInTheDocument();
    expect(scaleTiles()).toEqual(['D♭1', 'E♭2', 'F♭♭3', 'G♭4', 'A♭5', 'B𝄫♭6', 'C♭♭7']);
    expect(panel().getByTestId('enharmonic-note')).toHaveTextContent(
      'D♭ natural minor uses double flats. C♯ natural minor is its more commonly written enharmonic equivalent.',
    );
    expect(cardTexts()[5]).toBe('VIB𝄫Major');

    await user.selectOptions(rootSelect(), 'Gflat');
    await user.click(scaleTypes().getByRole('button', { name: 'Harmonic minor' }));
    expect(scaleTiles()).toEqual(['G♭1', 'A♭2', 'B𝄫♭3', 'C♭4', 'D♭5', 'E𝄫♭6', 'F7']);
    await user.click(dotLabels().getByRole('button', { name: 'Notes' }));
    expect(fretboardTones('scale')).toEqual(['A♭', 'C♭', 'E𝄫', 'F']);

    await user.selectOptions(rootSelect(), 'Eflat');
    await user.click(scaleTypes().getByRole('button', { name: 'Major' }));
    expect(rootSelect()).toHaveValue('Eflat');
    expect(scaleTiles()[0]).toBe('E♭1');
  });

  it('sends a sharp root to Learn triads with its spelling intact', async () => {
    const user = await openKeys();
    await user.selectOptions(rootSelect(), 'Csharp');
    await user.click(chordCards().getByRole('button', { name: /^G♯, V/ }));
    await user.click(screen.getByRole('button', { name: 'Practise all G♯ major triads' }));
    expect(screen.getByRole('tab', { name: 'Learn triads' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(panel().getByLabelText('Root note')).toHaveValue('Gsharp');
    expect(screen.getByRole('heading', { name: 'G♯ major' })).toBeInTheDocument();
    expect(panel().getByTestId('triad-notes')).toHaveTextContent('G♯–B♯–D♯');
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
