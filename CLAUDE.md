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
- Features store selections and derive everything during render. No effects that copy derived values into state. Shape preference is stored as a shape _definition id_ so the choice survives changing root or key.

## Curated data

- `src/data/shapes.ts` is hand-verified data, not generated. Do not add a shape because its notes fit; add shapes a guitarist actually plays, and set `playability: 'unverified'` unless the fingering has been played. The UI hides finger numbers for unverified shapes.
- The validator (`assertValidShapeLibrary`) runs in `src/data/data.test.ts` and lazily on first `shapeLibrary()` call. Its error names the failing shape id; read it before guessing.
- See CONTRIBUTING.md for the worked examples of adding a chord type, shape, or progression.
