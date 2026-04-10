import "./WarbandSelectScreen.css";
import { type DeckDefinition, type DeckDefinitionId } from "./domain";

type DeckSelectChoice = {
  id: DeckDefinitionId | null;
  name: string;
  summary: string;
  deck: DeckDefinition | null;
};

type DeckSelectScreenProps = {
  warbandName: string;
  choices: readonly DeckSelectChoice[];
  onSelect: (deck: DeckDefinition | null) => void;
};

export default function DeckSelectScreen({ warbandName, choices, onSelect }: DeckSelectScreenProps) {
  return (
    <main className="warband-select-shell">
      <header className="warband-select-hero">
        <h1>Choose your deck</h1>
        <p>Pick a deck to take into the practice battlefield with {warbandName}.</p>
      </header>
      <ul className="warband-select-list">
        {choices.map((choice) => {
          const objectiveCount = choice.deck?.objectiveCards.length ?? 12;
          const powerCount = choice.deck?.powerCards.length ?? 20;
          return (
            <li key={choice.id ?? "warband-default"}>
              <button
                type="button"
                className="warband-select-card"
                onClick={() => onSelect(choice.deck)}
              >
                <h2>{choice.name}</h2>
                <p className="warband-select-leader">{choice.summary}</p>
                <dl className="warband-select-stats">
                  <div>
                    <dt>Objectives</dt>
                    <dd>{objectiveCount}</dd>
                  </div>
                  <div>
                    <dt>Power Cards</dt>
                    <dd>{powerCount}</dd>
                  </div>
                </dl>
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
