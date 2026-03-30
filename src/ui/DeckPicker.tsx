import type { RivalsDeckId, RivalsDeckOption } from "../engine/data/starterData";

type DeckPickerProps = {
  options: RivalsDeckOption[];
  selectedId: RivalsDeckId;
  onSelect: (id: RivalsDeckId) => void;
  onStart: () => void;
};

export function DeckPicker({ options, selectedId, onSelect, onStart }: DeckPickerProps) {
  return (
    <section className="panel picker-panel">
      <h3>Step 2: Pick Your Rivals Deck</h3>
      <p className="muted">Choose one of four rivals decks. Each includes objective and power cards.</p>

      <div className="picker-grid">
        {options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <button
              type="button"
              key={option.id}
              className={`warband-card ${selected ? "selected" : ""}`}
              onClick={() => onSelect(option.id)}
            >
              <strong>{option.name}</strong>
              <p>{option.summary}</p>
            </button>
          );
        })}
      </div>

      <button type="button" className="start-btn" onClick={onStart}>
        Start Match
      </button>
    </section>
  );
}
