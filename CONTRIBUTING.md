# Contributing to Chord Compass

## Before you open a pull request

```sh
npm run check   # format, lint, typecheck, tests, build — the same steps CI runs
```

Keep the dependency direction: UI → domain and data. ESLint fails if anything under
`src/domain` or `src/data` imports React, the DOM, or UI modules. Prefer small pure functions
in the domain, and keep state inside the feature that owns it.

Comments should explain musical reasoning or unusual constraints, not narrate the code.

## Adding a chord type

1. Add the id to `CHORD_TYPE_IDS` and a `define(...)` entry in `src/data/chordTypes.ts`:

   ```ts
   define('minor6', 'Minor sixth', 'm6', '1 ♭3 5 6'),
   ```

   The formula is a space-separated list of degrees relative to the root's major scale, using
   `♭`/`b` and `♯`/`#` for alterations. The first degree must be `1`.

2. Add a spelling test to `src/domain/music/music.test.ts` for at least one tricky root
   (`expect(chordNotes('Eb', 'minor6')).toEqual(['E♭', 'G♭', 'B♭', 'C'])`).

3. Add at least one shape (next section). `guitar.test.ts` checks that every chord type has a
   shape on every root, so the test suite will tell you if coverage is missing.

The explorer picks up the new type automatically; it appears as a chip in the order of
`CHORD_TYPES`.

## Adding a verified shape

Shapes live in `src/data/shapes.ts`. Frets and fingers are six tokens, low E → high E.

```ts
// Open position Cadd9-style shape for G major (example of a fixed shape)
shape({
  id: 'G-major-open-rock',      // stable, unique, never shown to users
  type: 'major',
  root: PC.G,                   // pitch class of the chord root this shape plays
  kind: 'fixed',                // uses open strings, lives at one position
  label: 'Open (rock)',         // shown to users; "Open position" is the usual label
  frets: '3 2 0 0 3 3',
  fingers: '2 1 - - 3 4',
}),
```

For a movable shape, write it at its lowest usable position with no open strings and set
`root` to the pitch class it is written for:

```ts
shape({
  id: 'minor6-E-shape',
  type: 'minor6',
  root: PC.F,
  kind: 'movable',
  label: 'E-shape barre',
  frets: '1 3 3 1 3 1',
  fingers: '1 2 3 1 4 1',
  barres: ['1:0-5:1'],          // fret 1, strings 0–5 (low E to high E), finger 1
}),
```

Rules the validator enforces (run `npm test` and read the message, it names the entry):

- Every sounding note must belong to the chord.
- Every chord tone must be present unless listed in `omits: ['5']`. A declared omission must
  really be absent.
- Fretted strings need a finger; open and muted strings must not have one. A finger cannot press
  two different frets.
- Strings sharing a finger at one fret must be covered by a declared barre, and strings under a
  barre at the barre's fret must use the barre finger.
- Span between lowest and highest fretted note is at most 4 frets; frets stay within 1–15.
- Movable shapes cannot contain open strings.

`playability` defaults to `'verified'`. Set `playability: 'unverified'` if you have not played
the fingering yourself; the UI then hides finger numbers and says so. Please only mark a shape
verified after playing it.

Add a test to `src/domain/guitar/guitar.test.ts` when a shape has non-obvious behaviour (an
omission, an unusual position label, a spelling such as E♯).

## Adding a slash-chord shape

A slash chord (`C/B`) is an ordinary chord type plus a `bass` pitch class that must sound on
the lowest played string. Shapes with a `bass` only ever match slash chords; plain shapes never
do, so there is no risk of an open C answering a C/B search.

```ts
// C/B: the open C with B on the A string and the D string muted
shape({
  id: 'C-over-B-open',
  type: 'major',
  root: PC.C,
  bass: PC.B,                   // pitch class of the required lowest note
  kind: 'fixed',
  label: OPEN,
  frets: 'x 2 x 0 1 0',
  fingers: '- 2 - - 1 -',
}),
```

A movable slash shape keeps its bass-to-root distance wherever it sits, so one definition covers
every root: `major-over-7-low-E` (written as C/B at the 5th fret) also plays D/C♯ and G/F♯.

The validator checks, in addition to the usual rules, that the lowest sounding string plays the
bass. The sounding notes must be the chord tones plus the bass and nothing else. Add a lookup
expectation to `src/domain/guitar/finder.test.ts` (`codes('C', 'major', 'B')`) and, if the
shape should win over an existing one, set `priority` rather than reordering the file.

Only shapes with `playability: 'verified'` appear in the chord finder; an unverified shape is
still shown in the explorer without finger numbers.

## Adding a progression

Templates live in `src/data/progressions.ts`:

```ts
diatonic('major-1-6-4-5', 'major', [1, 6, 4, 5], 'The 1950s doo-wop progression.'),
```

Degrees are scale degrees of the mode; chord qualities and Roman numerals come from harmonizing
the key, so `[1, 6, 4, 5]` in major is named `I–vi–IV–V` automatically. To override the chord
type on a step (as the blues does with dominant sevenths), give the step a `chordTypeId`:

```ts
steps: [
  { degree: 2, chordTypeId: 'minor7' },
  { degree: 5, chordTypeId: 'dominant7' },
  { degree: 1, chordTypeId: 'major7' },
];
```

Only the `dominant7` override currently has a numeral spelling (`V7`); add a case to
`stepNumeral` in `src/domain/progressions/index.ts` for new overrides.

Add an expectation to `src/domain/progressions/progressions.test.ts` with the chord symbols in
at least one key.

## Adding a triad quality or string set

The "Learn triads" tab derives everything from a chord type, a string set and standard tuning;
there are no per-root shape tables to extend.

- **Quality**: append it to `LEARNABLE_TRIAD_QUALITIES` in `src/data/triads.ts`. The chord
  type of the same name must exist (`chordTypeForTriad`) and have a formula on degrees 1, 3
  and 5; `buildTriad` rejects anything else. Add its spellings to
  `src/domain/music/triads.test.ts`. The exhaustive voicing test in
  `src/domain/guitar/triadVoicing.test.ts` then checks every root on every set and fails if a
  shape exceeds the span limit, in which case decide whether to raise
  `GENERATED_MAX_FRET_SPAN` or document the gap.
- **String set**: add an `adjacentStrings(n)` entry to `TRIAD_STRING_SETS` in
  `src/domain/guitar/stringSets.ts`, where `n` is the highest (thinnest) string number of the
  group. The display name, the low-to-high description and the control button follow from it.
  Add the expected indexes and description to the string-set tests.

## Tests

- Domain tests (`src/domain/**/**.test.ts`) cover spelling, harmonization, transposition,
  validation, chord-symbol parsing, finder lookup and ranking, and generated triad voicings.
  They need no DOM.
- `src/data/data.test.ts` validates the curated data; it is the first thing to run when a shape
  looks wrong.
- `src/App.test.tsx` holds integration tests for the main user flows and queries by role and
  accessible name. Avoid asserting on class names or component internals.
