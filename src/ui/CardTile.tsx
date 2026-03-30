import { cardGloryValue, cardIsObjective, cardName, cardObjectiveType, cardPowerType } from "../engine/state";
import type { GameState } from "../engine/types";

type CardTileProps = {
  state: GameState;
  cardId: string;
  compact?: boolean;
};

function formatCardFamily(state: GameState, cardId: string): string {
  if (cardIsObjective(state, cardId)) {
    return "Objective";
  }

  return "Power";
}

function formatCardRule(state: GameState, cardId: string): string {
  const objectiveType = cardObjectiveType(state, cardId);
  if (objectiveType) {
    return objectiveType.replaceAll("-", " ");
  }

  const powerType = cardPowerType(state, cardId);
  return powerType ? powerType.replaceAll("-", " ") : "utility";
}

export function CardTile({ state, cardId, compact = false }: CardTileProps) {
  const objective = cardIsObjective(state, cardId);
  const glory = objective ? cardGloryValue(state, cardId) : null;

  return (
    <article className={`card-tile ${objective ? "objective" : "power"} ${compact ? "compact" : ""}`}>
      <div className="card-tile-top">
        <span className="card-tile-kind">{formatCardFamily(state, cardId)}</span>
        {glory !== null && <span className="card-tile-glory">{glory} glory</span>}
      </div>
      <strong className="card-tile-name">{cardName(state, cardId)}</strong>
      <p className="card-tile-rule">{formatCardRule(state, cardId)}</p>
    </article>
  );
}
