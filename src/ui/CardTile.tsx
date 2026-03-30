import type { Card } from "../engine/model";
import { cardGloryValue, cardIsObjective, cardName, cardObjectiveType, cardPowerType } from "../engine/state";
import type { GameState } from "../engine/types";

type CardTileProps = {
  state: GameState;
  card: Card;
  compact?: boolean;
};

function formatCardFamily(state: GameState, card: Card): string {
  if (cardIsObjective(state, card)) {
    return "Objective";
  }

  return "Power";
}

function formatCardRule(state: GameState, card: Card): string {
  const objectiveType = cardObjectiveType(state, card);
  if (objectiveType) {
    return objectiveType.replaceAll("-", " ");
  }

  const powerType = cardPowerType(state, card);
  return powerType ? powerType.replaceAll("-", " ") : "utility";
}

export function CardTile({ state, card, compact = false }: CardTileProps) {
  const objective = cardIsObjective(state, card);
  const glory = objective ? cardGloryValue(state, card) : null;

  return (
    <article className={`card-tile ${objective ? "objective" : "power"} ${compact ? "compact" : ""}`}>
      <div className="card-tile-top">
        <span className="card-tile-kind">{formatCardFamily(state, card)}</span>
        {glory !== null && <span className="card-tile-glory">{glory} glory</span>}
      </div>
      <strong className="card-tile-name">{cardName(state, card)}</strong>
      <p className="card-tile-rule">{formatCardRule(state, card)}</p>
    </article>
  );
}
