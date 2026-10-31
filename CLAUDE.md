# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run check` runs exactly what CI runs: format check, lint, typecheck, tests, build. Run it before declaring work done.
- `npx vitest run src/domain/guitar` runs one test directory; `npx vitest run -t "name"` runs one test by name.
- `npm run format` before committing; CI fails on Prettier differences.

## Architecture rules that the code cannot tell you

- Dependency direction is UI → domain and data, enforced by ESLint (`eslint.config.js`). Never import React, the DOM, or anything from `features/`, `components/`, `styles/` inside `src/domain` or `src/data`. `domain/progressions` deliberately takes a `ChordTypeCatalog` parameter instead of importing `data`.
- Pitch class (what sounds) and `NoteSpelling` (what is written) are separate on purpose. Chord tones are spelled from the scale degree's letter, never from a chromatic sharp array. Guitar code compares pitch classes, then displays the chord's spelling. Do not "simplify" E♯ to F.
- A chord type (major, m7) is a formula; a shape/voicing is one way to play a chord; a progression belongs to a key. Am is not a voicing of A. Keep these words straight in UI copy and names.
- Frets are always low E → high E: `null` muted, `0` open, `n` fretted. Movable shapes must contain no open strings; transposition never shifts `0` or `null`.
- Triad voicings (`domain/guitar/triadVoicing.ts`) are generated, not curated: one tone per string, most compact frets, open strings counting as fret 0 for the span. A `StringSet` is low-to-high indexes internally; the UI prints guitar numbering ("1–2–3 · Treble") plus the low-to-high form ("3–2–1 · G–B–e").
- Triad diagrams (`components/triads/`) are shared by Learn triads and "Chords in this key"; do not fork them. They are drawn in tab orientation (string 1 on top, nut left, fret numbers above) with all six strings, and only the rendering is flipped: voicing positions, tone orders and `frets` stay low string → high string. Markers label the root `R` (`chordToneLabel`); formulas keep `1`. The Learn triads selections are owned by `App` so "Practise all … triads" (Chords in a key tab) can set them and switch tabs.
- Scales are formulas in `domain/music/keys.ts` (`SCALE_FORMULAS`, four types); `Key`/`Mode` (major, minor = natural minor) used by progressions delegates to them. Chord qualities are always classified from sounding intervals (`classifyTriad`), never looked up per scale type. The key fretboard (`features/key-chords/keyFretboardViewModel.ts`) maps the key's own scale, unlike the explorer fretboard, which maps the chord root's major scale.
- Slash chords: `Chord.bass` is the required lowest note; shapes declare `bassPitchClass` and only match chords with the same bass relationship (plain shapes never answer a slash search). The validator requires the bass on the lowest sounding string. The chord finder shows only `playability: 'verified'` shapes and never generates fingerings from pitch classes.
- The scale fretboard (`domain/guitar/fretboardMap.ts`) always maps the chord root's _major_ scale and overlays the chord; an altered chord tone (Am's C) is a separate marker with its formula degree (♭3), never relabelled as a scale degree. Fretboard preferences (labels, highlight, collapsed) live in `ScaleFretboardSection` state and must not reset when the chord changes.
- Tabs keep inactive panels mounted so feature state survives switching; integration tests scope queries to the visible tabpanel.
- Features store selections and derive everything during render. No effects that copy derived values into state. Shape preference is stored as a shape _definition id_ so the choice survives changing root or key.

## Theming

- Two explicit themes via `data-theme` on `<html>`; never use `prefers-color-scheme` media queries or `light-dark()` in component CSS. Use semantic token pairs from `src/styles/tokens.css` (surface with its foreground partner). No hex colours outside that file.
- The inline script in `index.html` and `src/theme/themeResolution.ts` must agree on the storage key `chord-compass-theme` and the values `light`/`dark`.

## Curated data

- `src/data/shapes.ts` is hand-verified data, not generated. Do not add a shape because its notes fit; add shapes a guitarist actually plays, and set `playability: 'unverified'` unless the fingering has been played. The UI hides finger numbers for unverified shapes.
- The validator (`assertValidShapeLibrary`) runs in `src/data/data.test.ts` and lazily on first `shapeLibrary()` call. Its error names the failing shape id; read it before guessing.
- See CONTRIBUTING.md for the worked examples of adding a chord type, shape, or progression.
