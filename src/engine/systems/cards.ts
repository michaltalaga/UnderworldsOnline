import { hexDistance } from "../hex";
import {
  cardById,
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
  const card = cardById(state, cardId);
  if (!card) return null;
  if (card.owner !== team || card.zone !== "power-hand") return null;

  moveCardEntityToZone(state, cardId, "power-discard");
  return card;
}

export function resolvePowerCard(state: GameState, action: PlayPowerCardAction): void {
  const team = action.actorTeam;
  const card = removeCardFromHand(state, team, action.cardId);
  if (!card || card.kind !== "power" || !card.powerType) return;

  if (card.powerType === "ferocious-strike" && action.fighterId) {
    const fighterId = action.fighterId;
    if (fighterTeam(state, fighterId) === team && isAlive(state, fighterId)) {
      fighterCombat(state, fighterId).nextAttackBonusDamage += 1;
      state.log.push({ turn: state.turnInRound, text: `${fighterName(state, fighterId)} gains +1 damage on next attack` });
    }
  }

  if (card.powerType === "healing-potion" && action.fighterId) {
    const fighterId = action.fighterId;
    if (fighterTeam(state, fighterId) === team && isAlive(state, fighterId)) {
      const health = fighterHealth(state, fighterId);
      health.hp = Math.min(health.maxHp, health.hp + 1);
      state.log.push({ turn: state.turnInRound, text: `${fighterName(state, fighterId)} heals 1` });
    }
  }

  if (card.powerType === "sidestep" && action.fighterId && action.targetHex) {
    const fighterId = action.fighterId;
    if (fighterTeam(state, fighterId) === team && isAlive(state, fighterId)) {
      const occupied = occupiedBy(state, action.targetHex.q, action.targetHex.r);
      const dist = hexDistance(fighterPos(state, fighterId), action.targetHex);
      if (dist === 1 && occupied === null) {
        fighterPos(state, fighterId).q = action.targetHex.q;
        fighterPos(state, fighterId).r = action.targetHex.r;
        state.log.push({ turn: state.turnInRound, text: `${fighterName(state, fighterId)} sidesteps` });
      }
    }
  }

  state.occupiedObjectives = objectiveOccupancy(state);
}
