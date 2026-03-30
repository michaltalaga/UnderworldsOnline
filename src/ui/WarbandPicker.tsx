import type { WarbandId, WarbandOption } from "../engine/data/starterData";

type WarbandPickerProps = {
  options: WarbandOption[];
  selectedId: WarbandId;
  onSelect: (id: WarbandId) => void;
};

export function WarbandPicker({ options, selectedId, onSelect }: WarbandPickerProps) {
  return (
    <section className="panel picker-panel">
      <h3>Step 1: Pick Your Warband</h3>
      <p className="muted">Two starter warbands are available for now.</p>

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
              <ul>
                {option.fighterNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </section>
  );
}
