import { hexDistance } from "../hex";
import {
  cardEntityIdsInZone,
  cardName,
  cardPowerType,
  fighterCombat,
  fighterHealth,
  fighterName,
  fighterPos,
  fighterTeam,
  isAlive,
  moveCardEntityToZone,
  objectiveOccupancy,
  occupiedBy,
} from "../state";
import type { GameState, PlayPowerCardAction } from "../types";

function removeCardFromHand(state: GameState, team: "red" | "blue", cardId: string) {
  const inHand = cardEntityIdsInZone(state, team, "power-hand").includes(cardId);
  if (!inHand) return null;

  moveCardEntityToZone(state, cardId, "power-discard");
  return cardId;
}

export function resolvePowerCard(state: GameState, action: PlayPowerCardAction): void {
  const team = action.actorTeam;
  const cardId = removeCardFromHand(state, team, action.cardId);
  if (!cardId) return;

  const powerType = cardPowerType(state, cardId);
  if (!powerType) return;

  if (powerType === "ferocious-strike" && action.fighterId) {
    const fighterId = action.fighterId;
    if (fighterTeam(state, fighterId) === team && isAlive(state, fighterId)) {
      fighterCombat(state, fighterId).nextAttackBonusDamage += 1;
      state.log.push({ turn: state.turnInRound, text: `${fighterName(state, fighterId)} gains +1 damage on next attack` });
    }
  }

  if (powerType === "healing-potion" && action.fighterId) {
    const fighterId = action.fighterId;
    if (fighterTeam(state, fighterId) === team && isAlive(state, fighterId)) {
      const health = fighterHealth(state, fighterId);
      health.hp = Math.min(health.maxHp, health.hp + 1);
      state.log.push({ turn: state.turnInRound, text: `${fighterName(state, fighterId)} heals 1` });
    }
  }

  if (powerType === "sidestep" && action.fighterId && action.targetHex) {
    const fighterId = action.fighterId;
    if (fighterTeam(state, fighterId) === team && isAlive(state, fighterId)) {
      const occupied = occupiedBy(state, action.targetHex.q, action.targetHex.r);
      const dist = hexDistance(fighterPos(state, fighterId), action.targetHex);
      if (dist === 1 && occupied === null) {
        fighterPos(state, fighterId).q = action.targetHex.q;
        fighterPos(state, fighterId).r = action.targetHex.r;
        state.log.push({ turn: state.turnInRound, text: `${fighterName(state, fighterId)} uses ${cardName(state, cardId)}` });
      }
    }
  }

  state.occupiedObjectives = objectiveOccupancy(state);
}
