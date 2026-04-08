import { useState } from "react";
import "./PlayerHandDock.css";
import type { CardDefinition, CardId, PlayerState } from "./domain";

type PlayerHandDockProps = {
  player: PlayerState;
};

type DockCard = {
  cardId: CardId;
  definition: CardDefinition | null;
  fallbackName: string;
};

export default function PlayerHandDock({ player }: PlayerHandDockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const objectiveCards: DockCard[] = player.objectiveHand.map((card) => ({
    cardId: card.id,
    definition: player.getCardDefinition(card.id) ?? null,
    fallbackName: card.definitionId,
  }));
  const powerCards: DockCard[] = player.powerHand.map((card) => ({
    cardId: card.id,
    definition: player.getCardDefinition(card.id) ?? null,
    fallbackName: card.definitionId,
  }));
  const totalCards = objectiveCards.length + powerCards.length;

  return (
    <aside
      className={[
        "player-hand-dock",
        isExpanded ? "player-hand-dock-expanded" : "player-hand-dock-collapsed",
      ].join(" ")}
    >
      <header className="player-hand-dock-header">
        <div className="player-hand-dock-title">
          <p className="player-hand-dock-eyebrow">{player.name}&apos;s Hand</p>
          <strong>
            {objectiveCards.length} objective{objectiveCards.length === 1 ? "" : "s"} ·{" "}
            {powerCards.length} power
          </strong>
        </div>
        <button
          type="button"
          className="player-hand-dock-toggle"
          onClick={() => setIsExpanded((value) => !value)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </header>

      {totalCards === 0 ? (
        <p className="player-hand-dock-empty">No cards in hand.</p>
      ) : (
        <div className="player-hand-dock-sections">
          <PlayerHandDockSection
            label="Objectives"
            cards={objectiveCards}
            isExpanded={isExpanded}
            tone="objective"
          />
          <PlayerHandDockSection
            label="Power"
            cards={powerCards}
            isExpanded={isExpanded}
            tone="power"
          />
        </div>
      )}
    </aside>
  );
}

function PlayerHandDockSection({
  label,
  cards,
  isExpanded,
  tone,
}: {
  label: string;
  cards: DockCard[];
  isExpanded: boolean;
  tone: "objective" | "power";
}) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section className={`player-hand-dock-section player-hand-dock-section-${tone}`}>
      <p className="player-hand-dock-section-label">{label}</p>
      <ul className="player-hand-dock-card-list">
        {cards.map((card) => {
          const name = card.definition?.name ?? card.fallbackName;
          const text = card.definition?.text ?? "";
          const glory = card.definition?.gloryValue ?? 0;
          return (
            <li
              key={card.cardId}
              className="player-hand-dock-card"
              title={!isExpanded ? text : undefined}
            >
              <div className="player-hand-dock-card-title-row">
                <span className="player-hand-dock-card-name">{name}</span>
                {glory > 0 ? (
                  <span className="player-hand-dock-card-glory">{glory} glory</span>
                ) : null}
              </div>
              {isExpanded && text !== "" ? (
                <p className="player-hand-dock-card-text">{text}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
