import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { chordTypeForTriad } from '../../data';
import { STANDARD_TUNING, stringSetById, voiceTriadInversion } from '../../domain/guitar';
import { buildTriad, parseNote, type TriadInversion, type TriadQuality } from '../../domain/music';
import { TriadDiagram } from './TriadDiagram';
import { inversionDiagramModel } from './triadViewModels';
import type { MarkerLabelMode } from './markerLabels';

function renderDiagram(
  root: string,
  quality: TriadQuality,
  inversion: TriadInversion,
  setId = 'strings-1-2-3',
  mode: MarkerLabelMode = 'both',
) {
  const stringSet = stringSetById(setId);
  if (!stringSet) throw new Error(`missing string set ${setId}`);
  const triad = buildTriad(parseNote(root), chordTypeForTriad(quality));
  const voicing = voiceTriadInversion(triad, inversion, stringSet, STANDARD_TUNING);
  const model = inversionDiagramModel(voicing, mode, STANDARD_TUNING);
  const { container } = render(<TriadDiagram model={model} />);
  const svg = container.querySelector('svg') as unknown as HTMLElement;
  return { svg, model, voicing };
}

/** String lines keyed by guitar string number, 1 = high e. */
const stringLines = (svg: HTMLElement) =>
  Array.from(svg.querySelectorAll<SVGLineElement>('line[data-string]')).map((line) => ({
    number: Number(line.dataset.string),
    active: line.dataset.active === 'true',
    y: Number(line.getAttribute('y1')),
  }));

const fretNumbers = (svg: HTMLElement) =>
  Array.from(svg.querySelectorAll<SVGTextElement>('text[data-fret-number]')).map((text) => ({
    fret: Number(text.dataset.fretNumber),
    x: Number(text.getAttribute('x')),
  }));

/** Markers ordered from the lowest-pitched string (string 6) to the highest (string 1). */
const markers = (svg: HTMLElement) =>
  Array.from(svg.querySelectorAll<SVGGElement>('.note-marker[data-string]'))
    .map((marker) => ({
      string: Number(marker.dataset.string),
      fret: Number(marker.dataset.fret),
      degree: marker.dataset.degree,
      note: marker.dataset.note,
      isRoot: marker.classList.contains('note-marker--root'),
      hasRing: marker.querySelector('.note-marker__ring') !== null,
      label: marker.querySelector('.note-marker__label')?.textContent,
      sublabel: marker.querySelector('.note-marker__sublabel')?.textContent ?? null,
    }))
    .sort((a, b) => b.string - a.string);

describe('TriadDiagram orientation', () => {
  it('draws string 1 (high e) at the top and string 6 (low E) at the bottom', () => {
    const { svg } = renderDiagram('C', 'major', 'root');
    const lines = stringLines(svg);
    expect(lines.map((line) => line.number).sort()).toEqual([1, 2, 3, 4, 5, 6]);
    const byNumber = (n: number) => lines.find((line) => line.number === n)!;
    expect(byNumber(1).y).toBeLessThan(byNumber(6).y);
    for (let n = 1; n < 6; n += 1) expect(byNumber(n).y).toBeLessThan(byNumber(n + 1).y);
  });

  it('labels all six strings, nut side first, with the high e in lowercase', () => {
    const { svg } = renderDiagram('C', 'major', 'root');
    const labels = Array.from(svg.querySelectorAll('text[data-string-label]')).map(
      (text) => text.textContent,
    );
    expect(labels).toEqual(
      expect.arrayContaining(['1 · e', '2 · B', '3 · G', '4 · D', '5 · A', '6 · E']),
    );
    expect(labels).toHaveLength(6);
  });

  it('numbers the frets above the neck, increasing left to right', () => {
    const { svg } = renderDiagram('C', 'major', 'root'); // 5–5–3: window 3 to 6
    const numbers = fretNumbers(svg);
    expect(numbers.map((n) => n.fret)).toEqual([3, 4, 5, 6]);
    for (let i = 1; i < numbers.length; i += 1)
      expect(numbers[i].x).toBeGreaterThan(numbers[i - 1].x);
    const boardTopY = Number(svg.querySelector('line[data-string="1"]')?.getAttribute('y1'));
    const numberY = Number(svg.querySelector('text[data-fret-number]')?.getAttribute('y'));
    expect(numberY).toBeLessThan(boardTopY);
  });

  it('draws a thick nut with an open column only when the window starts at fret 1', () => {
    const { svg: atNut } = renderDiagram('C', 'major', 'second'); // 0–1–0
    expect(atNut.querySelector('[data-testid="nut"]')).not.toBeNull();
    expect(fretNumbers(atNut).map((n) => n.fret)).toEqual([0, 1, 2, 3, 4]);
    expect(atNut).toHaveAttribute(
      'aria-description',
      expect.stringContaining('the nut on the left'),
    );

    const { svg: higher } = renderDiagram('A', 'major', 'second'); // 9–10–9
    expect(higher.querySelector('[data-testid="nut"]')).toBeNull();
    expect(fretNumbers(higher).map((n) => n.fret)).toEqual([9, 10, 11, 12]);
    expect(higher.querySelector('.triad-diagram__fret-number--start')?.textContent).toBe('9');
    expect(higher).toHaveAttribute('aria-description', expect.stringContaining('frets 9 to 12'));
  });

  it('spells out the orientation in text, not only in the drawing', () => {
    const { svg } = renderDiagram('C', 'major', 'root');
    expect(screen.getByText('Tab view · high e at top')).toBeInTheDocument();
    expect(screen.getByText('Nut ←')).toBeInTheDocument();
    expect(screen.getByText('→ Bridge')).toBeInTheDocument();
    expect(svg).toHaveAttribute(
      'aria-description',
      expect.stringContaining(
        'string 1, the high e, at the top; string 6, the low E, at the bottom',
      ),
    );
  });
});

describe('TriadDiagram string sets', () => {
  it.each([
    ['strings-1-2-3', [1, 2, 3]],
    ['strings-2-3-4', [2, 3, 4]],
    ['strings-3-4-5', [3, 4, 5]],
    ['strings-4-5-6', [4, 5, 6]],
  ])('on %s only those strings are active and carry markers', (setId, active) => {
    const { svg } = renderDiagram('C', 'major', 'root', setId);
    const lines = stringLines(svg);
    expect(lines).toHaveLength(6);
    expect(
      lines
        .filter((line) => line.active)
        .map((line) => line.number)
        .sort(),
    ).toEqual(active);
    expect(
      markers(svg)
        .map((marker) => marker.string)
        .sort(),
    ).toEqual(active);
    expect(svg.querySelector('[data-testid="active-band"]')).not.toBeNull();
  });
});

describe('TriadDiagram chord tones', () => {
  it.each([
    ['C', 'major', ['R', '3', '5'], ['C', 'E', 'G']],
    ['D', 'minor', ['R', '♭3', '5'], ['D', 'F', 'A']],
    ['B', 'diminished', ['R', '♭3', '♭5'], ['B', 'D', 'F']],
    ['Eb', 'augmented', ['R', '3', '♯5'], ['E♭', 'G', 'B']],
  ] as const)('labels %s %s root position low to high', (root, quality, degrees, notes) => {
    const { svg } = renderDiagram(root, quality, 'root');
    const found = markers(svg);
    expect(found.map((marker) => marker.degree)).toEqual(degrees);
    expect(found.map((marker) => marker.note)).toEqual(notes);
    expect(found.map((marker) => marker.label)).toEqual(degrees);
    expect(found.map((marker) => marker.sublabel)).toEqual(notes);
  });

  it('puts the third, then the fifth, then the root in a first inversion', () => {
    const { svg } = renderDiagram('D', 'minor', 'first', 'strings-2-3-4');
    expect(markers(svg).map((marker) => marker.degree)).toEqual(['♭3', '5', 'R']);
    expect(markers(svg).map((marker) => marker.note)).toEqual(['F', 'A', 'D']);
  });

  it('puts the fifth, then the root, then the third in a second inversion', () => {
    const { svg } = renderDiagram('B', 'diminished', 'second', 'strings-3-4-5');
    expect(markers(svg).map((marker) => marker.degree)).toEqual(['♭5', 'R', '♭3']);
    expect(markers(svg).map((marker) => marker.note)).toEqual(['F', 'B', 'D']);
  });

  it('rings the root marker so it is not identified by colour alone', () => {
    const { svg } = renderDiagram('Eb', 'augmented', 'second');
    const found = markers(svg);
    expect(found.filter((marker) => marker.isRoot)).toHaveLength(1);
    expect(found.find((marker) => marker.isRoot)).toMatchObject({
      hasRing: true,
      label: 'R',
      note: 'E♭',
    });
    expect(found.filter((marker) => !marker.isRoot).every((marker) => !marker.hasRing)).toBe(true);
  });

  it('keeps the note name available when markers show degrees only', () => {
    const { svg } = renderDiagram('C', 'major', 'root', 'strings-1-2-3', 'degrees');
    const found = markers(svg);
    expect(found.map((marker) => marker.label)).toEqual(['R', '3', '5']);
    expect(found.every((marker) => marker.sublabel === null)).toBe(true);
    expect(found.map((marker) => marker.note)).toEqual(['C', 'E', 'G']);
    expect(svg).toHaveAttribute(
      'aria-description',
      expect.stringContaining('string 3 5th fret C (R)'),
    );
  });
});
