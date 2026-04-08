import "./WarbandSelectScreen.css";
import { CardKind, type DeckDefinition, type DeckDefinitionId } from "./domain";

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
          const ployCount =
            choice.deck?.powerCards.filter((card) => card.kind === CardKind.Ploy).length ?? 10;
          const upgradeCount =
            choice.deck?.powerCards.filter((card) => card.kind === CardKind.Upgrade).length ?? 10;
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
                    <dt>Ploys</dt>
                    <dd>{ployCount}</dd>
                  </div>
                  <div>
                    <dt>Upgrades</dt>
                    <dd>{upgradeCount}</dd>
                  </div>
                </dl>
                {choice.deck !== null && (
                  <ul className="warband-select-fighter-list">
                    {choice.deck.objectiveCards.slice(0, 4).map((card) => (
                      <li key={card.id}>
                        <span className="warband-select-fighter-name">{card.name}</span>
                        <span className="warband-select-fighter-meta">
                          {card.gloryValue} glory
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
