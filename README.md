# Chord Compass

A guitar learning web app for exploring chord types, understanding their formulas and notes,
seeing verified guitar shapes, learning triad inversions across the neck, and practising common
chord progressions. Runs entirely in the
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
    guitar/         tuning, shape types, movable-shape transposition, voicing, validation,
                    three-string sets, generated triad voicings
    progressions/   progression templates instantiated in a key
  data/             curated chord types, root options, verified shapes, progression templates
  features/
    chord-explorer/        "Explore chords" tab: state and orchestration
    triad-learning/        "Learn triads" tab: state, view models for the triad diagrams
    progression-practice/ "Practise progressions" tab: state and orchestration
  components/       reusable presentation: ChordDiagram, TriadDiagram, TriadFretboard, Tabs, ...
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
- **Curated shapes vs. generated triad voicings.** Six-string chord shapes are hand-verified
  data. Triad inversions are derived instead: three strings, one chord tone per string, and the
  most compact fret for each (see "Learn triads" below). Tabs keep their panels mounted, so each
  feature keeps its selections when you switch tabs.
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

## Learn triads

The "Learn triads" tab teaches how one triad appears in root position, first inversion and
second inversion on three adjacent strings, and how those three shapes line up along the neck.
Each step is shown explicitly: chord formula → chord notes → inversion order → fret positions.

- **Qualities**: major (`1–3–5`) and minor (`1–♭3–5`). The quality is a chord type whose
  formula has degrees 1, 3 and 5, so diminished and augmented can be added without new logic.
- **String sets**: strings 1–2–3, 2–3–4 and 3–4–5 (guitar numbering, 1 = high E).
- **String ordering**: internally every set is a low-to-high list of string indexes, like
  every other fret list in the app. The interface writes each set low to high next to its name
  so the two conventions never clash: strings 1–2–3 are `3–2–1 · G–B–e`, strings 2–3–4 are
  `4–3–2 · D–G–B`, strings 3–4–5 are `5–4–3 · A–D–G`. The inversion cards draw the lowest
  string on the left; the fretboard view draws the highest string on top, as tablature does.
- **Inversion order** (low to high): root position `1–3–5`, first inversion `3–5–1`,
  second inversion `5–1–3`, with `♭3` for minor.
- **How shapes are calculated** (`domain/guitar/triadVoicing.ts`): each string of the set
  is assigned the tone the inversion puts in that voice. Every fret from 0 to 15 where the
  string sounds that pitch class is a candidate (an open-string note is also available at
  fret 12). Of all combinations, the one with the smallest fret span wins; ties go to the
  lower position. Nothing is hard-coded per root.
- **Playability rule**: span is the distance between the lowest and highest fret with open
  strings counted as fret 0, so `0–11–9` is a stretch of 11 and `12–11–9` wins for A major
  on strings 3–4–5. A voicing whose most compact occurrence still spans more than
  `MAX_FRET_SPAN` (4 frets) is flagged `playable: false` and the UI says so; with standard
  tuning and the current sets no generated shape needs that flag (tested).
- **Beyond fret 12**: shapes that straddle the octave (C minor, second inversion on G–B–e is
  `12–13–11`) reach fret 13, so the fretboard view, normally frets 0–12, extends as far as the
  highest fret in use.

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
