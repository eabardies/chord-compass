import { useId, type KeyboardEvent, type ReactNode } from 'react';
import './Tabs.css';

export interface TabDefinition<Id extends string> {
  id: Id;
  label: string;
  content: ReactNode;
}

interface TabsProps<Id extends string> {
  label: string;
  tabs: readonly TabDefinition<Id>[];
  value: Id;
  onChange: (id: Id) => void;
}

/**
 * WAI-ARIA tabs: arrow keys move between tabs, the panel is labelled by its tab. Inactive
 * panels stay mounted but hidden, so each feature keeps its selections when the user
 * switches tabs and comes back.
 */
export function Tabs<Id extends string>({ label, tabs, value, onChange }: TabsProps<Id>) {
  const baseId = useId();
  const activeIndex = tabs.findIndex((tab) => tab.id === value);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = tabs[(activeIndex + step + tabs.length) % tabs.length];
    onChange(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  };

  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              className="tabs__tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== value}
          className="tabs__panel"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
