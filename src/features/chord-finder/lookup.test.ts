import { describe, expect, it } from 'vitest';
import { lookupChord } from './lookup';
import { SHAPE_LIBRARY } from '../../data';

describe('chord lookup', () => {
  it('returns the verified shapes for a known chord, recommended first', () => {
    const result = lookupChord('C/B');
    expect(result.status).toBe('found');
    if (result.status !== 'found') return;
    expect(result.chord.symbol).toBe('C/B');
    expect(result.shapes.map((shape) => shape.definition.id)).toEqual([
      'C-over-B-open',
      'major-over-7-low-E',
    ]);
  });

  it('explains invalid notation', () => {
    const result = lookupChord('Cmaj9');
    expect(result.status).toBe('invalid');
    if (result.status !== 'invalid') return;
    expect(result.message).toContain('“maj9” is not a chord type');
  });

  it('tells a chord with no shape apart from one whose only shapes are unverified', () => {
    const none = lookupChord('C/F');
    expect(none.status).toBe('no-shape');
    if (none.status !== 'no-shape') return;
    expect(none.message).toBe('C/F is a valid chord, but there is no verified shape for it yet.');
    expect(none.suggestion).toBe('Try C without the bass note, or one of the examples.');

    const onlyUnverified = SHAPE_LIBRARY.filter((shape) => shape.id === 'E-sus2-open');
    const pending = lookupChord('Esus2', onlyUnverified);
    expect(pending.status).toBe('no-shape');
    if (pending.status !== 'no-shape') return;
    expect(pending.message).toBe(
      'Esus2 is in the library, but its fingering has not been verified by a player yet.',
    );
    expect(pending.suggestion).toBe('The Explore chords tab shows it without finger numbers.');
  });
});
