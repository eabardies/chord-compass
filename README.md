# Chord Compass

A guitar learning web app for exploring chord types, understanding their formulas and notes,
seeing verified guitar shapes, looking up how to play a chord symbol such as C/B, learning triad
inversions across the neck, and practising common chord progressions. Runs entirely in the
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
    music/          notes, intervals, chord construction (incl. slash basses), chord-symbol
                    parsing, scales, keys, harmonization
    guitar/         tuning, shape types, movable-shape transposition, voicing, validation,
                    three-string sets, generated triad voicings, chord-finder lookup and
                    recommendation, play instructions
    progressions/   progression templates instantiated in a key
  data/             curated chord types, root options, verified shapes, progression templates
  features/
    chord-explorer/        "Explore chords" tab: state and orchestration
    chord-finder/          "Chord finder" tab: search state, lookup, result and instructions
    triad-learning/        "Learn triads" tab: state, view models for the triad diagrams
    progression-practice/ "Practise progressions" tab: state and orchestration
  components/       reusable presentation: ChordDiagram, TriadDiagram, TriadFretboard, Tabs, ...
  styles/           design tokens (explicit light and dark themes) and base styles
  theme/            ThemeProvider, useTheme, ThemeToggle, resolution and storage helpers
```

Key ideas:

- **Selections are state, results are derived.** Features store what the user picked (root,
  chord type, key, preferred shape id) and compute chords, voicings and progressions during
  render. There are no effects copying values around.
- **The major scale is the reference, on paper and on the neck.** The scale reference and the
  scale fretboard both show the chord root's major scale and mark the chord's altered tones
  against it. See "Scale fretboard" below.
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

## Theming

The app has explicit light and dark themes, switched from the toggle in the header.

- **Preference**: `system` until the user toggles, then `light` or `dark`. While it is
  `system` the app follows the operating system live; an explicit choice is never
  overridden by an OS change. The choice is stored in `localStorage` under
  `chord-compass-theme` (values `light` or `dark`; anything else means `system`).
  Storage that is missing, blocked or malformed degrades to `system`.
- **No flash**: a few lines of inline script in `index.html` read the same key and set
  `data-theme` on `<html>` before the bundle loads. `ThemeProvider` (in `src/theme`)
  owns the preference afterwards and keeps the attribute in step. The script and
  `themeResolution.ts` must agree on the key and values; a test checks this.
- **Tokens** (`src/styles/tokens.css`): both themes define the same semantic tokens under
  `[data-theme="light"]` and `[data-theme="dark"]`. Every surface has a paired foreground,
  and components must use the pair, never a surface with an inherited colour:

  | Surface                                                                      | Foreground                                       |
  | ---------------------------------------------------------------------------- | ------------------------------------------------ |
  | `--color-background`, `--color-surface`, `--color-surface-muted`             | `--color-text-primary`, `--color-text-secondary` |
  | `--color-accent` (buttons)                                                   | `--color-text-on-accent`                         |
  | `--color-selected-surface` (pressed/selected controls)                       | `--color-selected-text`                          |
  | `--color-chord-tone`, `--color-scale-tone`, `--color-altered-tone` (markers) | the matching `--color-*-tone-text`               |
  | `--color-error-surface`                                                      | `--color-error`                                  |

  Short aliases (`--color-text`, `--color-dot`, ...) exist for older stylesheets and always
  point at a semantic token. Add a new colour by defining it in both theme blocks with its
  foreground partner, checking the pair against the real surface it sits on (WCAG AA: 4.5:1
  text, 3:1 control boundaries), and never with `light-dark()` or a media query.

- **SVGs** use classes whose `fill`/`stroke` reference the tokens (`NoteMarker.css`,
  `ChordDiagram.css`, the fretboards), so a theme change re-colours them without a redraw.
  Icons use `currentColor`. No hex values live outside `tokens.css`.
- **Transitions**: background, text, border, fill and stroke ease over 150 ms on a theme
  change only; `prefers-reduced-motion: reduce` disables them.

## Musical conventions

- Formulas are intervals relative to the root's major scale: `1 ♭3 5`, `1 3 5 ♭7`.
- Frets are listed low E → high E. `null` = muted, `0` = open, `n` = fret n.
- String numbers in descriptions follow guitar convention: 6 = low E, 1 = high E. Diagrams show
  low E on the left. Shape codes read the same way: `x2x010` is low E muted, A at fret 2, D
  muted, G open, B at fret 1, high e open (`8-10-10-9-8-8` once a fret reaches 10).
- Finger numbers: 1 = index, 2 = middle, 3 = ring, 4 = little. Open and muted strings have none.
- Slash chords (`C/B`) name the lowest sounding note. It may be a chord tone (C/E) or an extra
  note (C/B); either way every shape for the chord must put it on the lowest sounding string.
- Roman numerals: uppercase major, lowercase minor, `°` diminished, `+` augmented, `7` for a
  dominant seventh override (blues).
- "Minor" means natural minor throughout.
- Chord roots offer both common spellings for black keys (C♯ and D♭). Keys are limited to those
  with at most seven sharps or flats.

## Scale fretboard

Below the major-scale reference, the explorer shows the selected root's **major scale across
the fretboard** with the selected chord overlaid. It is a map of the reference scale, not of the
chord's own scale: with Am selected it still shows A major, and marks Am's C as an altered
tone on top of it.

- **Orientation**: horizontal neck, high e at the top and low E at the bottom, as in
  tablature; each string is labelled with its number and name. Frets 0 (open) to 12, nut
  between 0 and 1, single inlays at 3, 5, 7 and 9, a double inlay at 12. Fret 12 repeats the
  open strings an octave up, so it carries the same degree and spelling.
- **Markers**: the root is filled with an extra ring; a selected chord tone is filled; another
  scale note is a quiet outlined pill; an altered chord tone (♭3, ♭7, ♯5) is a dashed pill.
  Shape, fill and text differ, so colour is never the only cue, and a legend repeats the
  styles. Non-scale positions stay empty.
- **Labels**: degrees (default), notes, or both ("3/C♯"). Scale tones print their major-scale
  degree; altered chord tones print their chord-formula degree ("♭3/C"), never a wrong
  scale degree.
- **Highlight selected chord** (on by default) marks chord tones inside the scale and adds the
  altered ones. Off, the fretboard shows the root and the scale only; the scale positions do
  not move. **Hide fretboard** collapses the section. These three preferences survive changing
  the root or chord; changing the shape of the same chord does not touch the fretboard.
- **Spelling** follows the chord root's spelling by degree: B♭ major shows E♭, C♯ major shows
  E♯ and B♯, A augmented shows E♯, A minor's third is C.
- **Where it is computed**: `buildFretboardMap` in `domain/guitar/fretboardMap.ts` turns
  open-string note + fret into a pitch class, then into scale degree, chord degree and spelled
  note for every position. `features/chord-explorer/scaleFretboardViewModel.ts` turns those
  into marker labels and styles; `components/ScaleFretboard.tsx` only draws. To support
  another tuning, pass a different `GuitarTuning`; to show another scale, replace the
  `scaleNotes({ mode: 'major' })` call with the scale's notes. No alternate-tuning or mode
  controls are exposed yet.

## Chord finder

The "Chord finder" tab answers "how do I play X?" for a typed chord symbol, without the theory.
It shows the recommended verified shape at once: diagram with finger numbers, shape code,
starting string, strumming and muting instructions, a string-by-string table, and the other
verified shapes.

**Supported notation** (`domain/music/chordSymbol.ts`): a root letter A–G with an optional
`#`/`b` or `♯`/`♭`, one of the chord types below, and an optional slash bass. Spaces are
ignored and the root and bass letters may be lowercase. Suffix case matters only where it
changes the meaning (`CM7` is a major seventh, `Cm7` a minor seventh); otherwise it is
ignored (`cMAJ7`).

| Chord type       | Written as        | Also accepted                 |
| ---------------- | ----------------- | ----------------------------- |
| Major            | `C`               | `Cmaj`, `Cmajor`, `CM`        |
| Minor            | `Cm`              | `Cmin`, `Cminor`, `C-`        |
| Dominant seventh | `C7`              | `Cdom7`                       |
| Major seventh    | `Cmaj7`           | `CM7`, `Cmajor7`, `CΔ7`, `CΔ` |
| Minor seventh    | `Cm7`             | `Cmin7`, `Cminor7`, `C-7`     |
| Suspended second | `Csus2`           |                               |
| Suspended fourth | `Csus4`           | `Csus`                        |
| Diminished       | `Cdim`            | `C°`, `Co`                    |
| Augmented        | `Caug`            | `C+`                          |
| Slash chord      | `C/E`, `B♭maj7/D` | `Bbmaj7/D`                    |

**How shapes are selected and ranked** (`domain/guitar/finder.ts`): the finder uses the same
curated library as the explorer, restricted to fingerings marked `playability: 'verified'`.
It never searches the fretboard for note collections. Shapes are ranked by an explicit
`priority` if a definition sets one, then verified before unverified, open before fretted-only,
lower position, smaller stretch between the lowest and highest fretted note, and fewer barres.
The first shape is the recommendation; the user can pick any other.

**Slash-chord shapes** carry a `bassPitchClass`. They only match chords with the same bass
relationship (fixed shapes by exact pitch class, movable shapes by bass-to-root distance), and
plain shapes never match a slash chord, so `C/B` is never answered with an open C. The
validator additionally requires the bass to be the lowest sounding string.

**Known coverage limitations**: every plain chord type parses and has at least one verified
shape on every root, usually several (open, CAGED forms and barres). Fingerings marked
unverified (some open sus2, sus4 and augmented shapes) are hidden from the finder, which then
says so ("in the library, but not verified yet") rather than "no shape"; the explorer shows
them without finger numbers. Slash chords covered: a major triad over its major seventh (C/B,
movable, any root), a major seventh over its third (B♭maj7/D, movable, any root), and the
fixed C/E, C/G, D/F♯, G/B, G/D, Am/G, Am/C, F/A, E/G♯, Em/B, A/C♯, D/A and D/C. Any other
slash chord parses but reports "no verified shape".

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
  seventh and sus4; an A-shape barre for sus2; CAGED C, D and G forms (see below).
- Common slash chords, fixed and movable (see "Chord finder").
- Four-string movable shapes for diminished and augmented triads (root on the A or D string).

Known gaps:

- Fingerings marked `playability: 'unverified'` in `src/data/shapes.ts` (some sus2/sus4 open
  shapes, open E and A augmented, and the D-string augmented shape) have correct notes but have
  not been checked by a player; the UI hides their finger numbers.
- CAGED coverage is the forms players use: major C, D and G; minor D; dominant seventh C
  and D; major seventh C and D; minor seventh D; sus2 and sus4 D. The C and G forms of minor,
  sevenths and sus chords are not included.
- No audio, alternate tunings, capo support, or accounts in this version.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add chord types, shapes and progressions.
