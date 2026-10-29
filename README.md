# Chord Compass

A guitar learning web app for exploring chord types, understanding their formulas and notes,
seeing verified guitar shapes, and practising common chord progressions. Runs entirely in the
browser: no accounts, backend, or paid APIs. Standard tuning (E A D G B E) only.

## Setup

Requires Node 22 or newer (see `.nvmrc`). Dependencies are pinned in `package-lock.json`.

```sh
npm ci
npm run dev        # start the dev server (http://localhost:5173)
```

## Deployment

The site is static and is published to GitHub Pages by the `deploy` job in
`.github/workflows/ci.yml` on every push to `main`, after the checks pass. One-time setup in the
GitHub repository: Settings → Pages → Source → "GitHub Actions".

Project sites are served under `/<repository name>/`, so the workflow builds with
`BASE_PATH=/<repository name>/`. Local builds and the dev server use the root path.

## Commands

| Command                 | What it does                                                   |
| ----------------------- | -------------------------------------------------------------- |
| `npm run dev`           | Vite dev server with hot reload                                |
| `npm test`              | Run all unit and integration tests once (Vitest)               |
| `npm run test:watch`    | Tests in watch mode                                            |
| `npx vitest run <path>` | Run a single test file, e.g. `npx vitest run src/domain/music` |
| `npm run typecheck`     | TypeScript, app and config                                     |
| `npm run lint`          | ESLint, including the dependency-direction rules               |
| `npm run format`        | Prettier, write                                                |
| `npm run format:check`  | Prettier, check only (CI)                                      |
| `npm run build`         | Typecheck and produce a production build in `dist/`            |
| `npm run check`         | Everything CI runs: format, lint, typecheck, test, build       |

CI (`.github/workflows/ci.yml`) runs `npm run check` on every push and pull request.

## Architecture

Feature-oriented layout with independent domain modules. The dependency direction is
**UI (features, components) → domain and data**, enforced by ESLint: nothing under
`src/domain` or `src/data` may import React, the DOM, browser storage, or UI modules.

```
src/
  domain/
    music/          notes, intervals, chord construction, scales, keys, harmonization
    guitar/         tuning, shape types, movable-shape transposition, voicing, validation
    progressions/   progression templates instantiated in a key
  data/             curated chord types, root options, verified shapes, progression templates
  features/
    chord-explorer/        "Explore chords" tab: state and orchestration
    progression-practice/ "Practise progressions" tab: state and orchestration
  components/       reusable presentation: ChordDiagram, ShapeViewer, NoteList, Tabs, ...
  styles/           design tokens and base styles (plain CSS, light and dark themes)
```

Key ideas:

- **Selections are state, results are derived.** Features store what the user picked (root,
  chord type, key, preferred shape id) and compute chords, voicings and progressions during
  render. There are no effects copying values around.
- **Pitch class vs. spelling.** `PitchClass` (0–11) is what you hear; `NoteSpelling` (letter +
  accidental) is what you write. Chord tones are spelled by scale degree, so A augmented is
  A C♯ E♯ and C minor is C E♭ G. Guitar shapes compare pitch classes, then display the chord's
  spelling.
- **Chord type vs. shape vs. progression.** A chord type (major, minor seventh, ...) is a
  formula. A shape or voicing is one way to play a chord on the neck. A progression belongs to
  a key and is instantiated from Roman numeral degrees. Am is a different chord from A, not a
  voicing of it.
- **Curated shapes, verified transposition.** Fixed shapes live at one position and may use
  open strings. Movable shapes contain no open strings and are written at their lowest
  position; `shapesForChord` transposes them to the requested root, never shifting open or
  muted strings, and refuses positions outside frets 1–15. Every shape is validated for chord
  membership, required tones, declared omissions, barre and finger consistency
  (`assertValidShapeLibrary`), and the library is validated once on first use.
- **Musical validation vs. human verification.** Validation proves the notes are right.
  `playability: 'verified'` records that a person confirmed the fingering is comfortable;
  unverified fingerings render without finger numbers and say so.

## Musical conventions

- Formulas are intervals relative to the root's major scale: `1 ♭3 5`, `1 3 5 ♭7`.
- Frets are listed low E → high E. `null` = muted, `0` = open, `n` = fret n.
- String numbers in descriptions follow guitar convention: 6 = low E, 1 = high E. Diagrams show
  low E on the left.
- Roman numerals: uppercase major, lowercase minor, `°` diminished, `+` augmented, `7` for a
  dominant seventh override (blues).
- "Minor" means natural minor throughout.
- Chord roots offer both common spellings for black keys (C♯ and D♭). Keys are limited to those
  with at most seven sharps or flats.

## Shape coverage and limitations

Every chord type has at least one shape for every root (tested). Coverage:

- Open shapes for the common major, minor, seventh, major seventh, minor seventh, sus2, sus4 and
  augmented chords. Open C7 deliberately omits the fifth and says so.
- E-shape and A-shape barre chords for major, minor, dominant seventh, major seventh, minor
  seventh and sus4; an A-shape barre for sus2.
- Four-string movable shapes for diminished and augmented triads (root on the A or D string).

Known gaps:

- Fingerings marked `playability: 'unverified'` in `src/data/shapes.ts` (some sus2/sus4 open
  shapes, open E and A augmented, and the D-string augmented shape) have correct notes but have
  not been checked by a player; the UI hides their finger numbers.
- No C-shape, D-shape or G-shape (CAGED) movable voicings yet, so some chords only have barre
  shapes above the 7th fret.
- No audio, alternate tunings, capo support, or accounts in this version.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add chord types, shapes and progressions.
