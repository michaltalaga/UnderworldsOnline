import { type DeckDefinition, type DeckDefinitionId } from "./domain";
import { PanelButton } from "./ui";

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
    <main className="max-w-[1100px] mx-auto px-6 pt-16 pb-20 grid gap-8 text-ink">
      <header className="text-center grid gap-2">
        <h1 className="m-0 font-heading text-[clamp(2.2rem,4vw,3.6rem)] tracking-[0.01em]">
          Choose your deck
        </h1>
        <p className="m-0 text-ink-soft text-[1.05rem]">
          Pick a deck to take into the practice battlefield with {warbandName}.
        </p>
      </header>
      <ul className="list-none m-0 p-0 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        {choices.map((choice) => {
          const objectiveCount = choice.deck?.objectiveCards.length ?? 12;
          const powerCount = choice.deck?.powerCards.length ?? 20;
          return (
            <li key={choice.id ?? "warband-default"}>
              <PanelButton onClick={() => onSelect(choice.deck)}>
                <h2 className="m-0 font-heading text-[1.55rem]">{choice.name}</h2>
                <p className="m-0 text-ink-soft italic">{choice.summary}</p>
                <dl className="m-0 grid grid-cols-3 gap-3">
                  <div className="bg-surface-inner rounded-button p-2.5 px-3 grid gap-0.5 text-center">
                    <dt className="text-[0.72rem] uppercase tracking-[0.06em] text-ink-muted">Objectives</dt>
                    <dd className="m-0 font-heading text-[1.35rem]">{objectiveCount}</dd>
                  </div>
                  <div className="bg-surface-inner rounded-button p-2.5 px-3 grid gap-0.5 text-center">
                    <dt className="text-[0.72rem] uppercase tracking-[0.06em] text-ink-muted">Power Cards</dt>
                    <dd className="m-0 font-heading text-[1.35rem]">{powerCount}</dd>
                  </div>
                </dl>
              </PanelButton>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
