import { PowerCard } from "../model";
import { cardsInZone, moveCardToZone, objectiveOccupancy } from "../state";
import type { GameState, PlayPowerCardAction } from "../types";

function removeCardFromHand(state: GameState, team: "red" | "blue", card: PowerCard) {
  const handCard = cardsInZone(state, team, "power-hand").find(
    (candidate) => candidate instanceof PowerCard && candidate.sameDefinition(card),
  ) as PowerCard | undefined;
  if (!handCard) return null;

  moveCardToZone(state, handCard, "power-discard");
  return handCard;
}

export function resolvePowerCard(state: GameState, action: PlayPowerCardAction): void {
  if (!(action.card instanceof PowerCard)) return;

  const team = action.actorTeam;
  const playedCard = removeCardFromHand(state, team, action.card);
  if (!playedCard) return;
  playedCard.play(state, { ...action, card: playedCard });

  state.occupiedObjectives = objectiveOccupancy(state);
}
