import { useState } from 'react';
import { Tabs } from './components/Tabs';
import { STANDARD_TUNING } from './domain/guitar';
import { noteName } from './domain/music';
import { ChordExplorer } from './features/chord-explorer/ChordExplorer';
import { ChordFinder } from './features/chord-finder/ChordFinder';
import { KeyChords } from './features/key-chords/KeyChords';
import { ProgressionPractice } from './features/progression-practice/ProgressionPractice';
import { TriadLearning } from './features/triad-learning/TriadLearning';
import {
  useTriadLearningState,
  type TriadPracticeRequest,
} from './features/triad-learning/useTriadLearningState';
import { ThemeProvider } from './theme/ThemeProvider';
import { ThemeToggle } from './theme/ThemeToggle';

type TabId = 'explore' | 'finder' | 'keys' | 'triads' | 'practise';

export function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

function AppShell() {
  const [tab, setTab] = useState<TabId>('explore');
  // The Learn triads selections live here so "Practise all … triads" in another tab can set them.
  const triads = useTriadLearningState();
  const tuningNotes = STANDARD_TUNING.strings.map(noteName).join(' ');

  const practiseTriads = (request: TriadPracticeRequest) => {
    triads.practise(request);
    setTab('triads');
  };

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__logo" aria-hidden="true">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 5l2.5 7L12 19l-2.5-7z" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <div className="app__identity">
          <h1 className="app__title">Chord Compass</h1>
          <p className="app__tagline">Find the shape. Understand the sound.</p>
        </div>
        <ThemeToggle />
      </header>

      <main className="app__main">
        <Tabs<TabId>
          label="Sections"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'explore', label: 'Explore chords', content: <ChordExplorer /> },
            { id: 'finder', label: 'Chord finder', content: <ChordFinder /> },
            {
              id: 'keys',
              label: 'Chords in a key',
              content: <KeyChords onPractiseTriads={practiseTriads} />,
            },
            { id: 'triads', label: 'Learn triads', content: <TriadLearning state={triads} /> },
            { id: 'practise', label: 'Practise progressions', content: <ProgressionPractice /> },
          ]}
        />
      </main>

      <footer className="app__footer">
        {STANDARD_TUNING.name} · {tuningNotes} · × muted string · ○ open string · low E on the left
      </footer>
    </div>
  );
}
