import type { Card } from "../model";
import { hexDistance } from "../hex";
import {
  cardsInZone,
  cardName,
  cardPowerType,
  fighterWeapon,
  fighterHealth,
  fighterName,
  fighterPos,
  fighterTeam,
  isAlive,
  moveCardToZone,
  objectiveOccupancy,
  occupiedBy,
} from "../state";
import type { GameState, PlayPowerCardAction } from "../types";

function removeCardFromHand(state: GameState, team: "red" | "blue", card: Card) {
  const inHand = cardsInZone(state, team, "power-hand").includes(card);
  if (!inHand) return null;

  moveCardToZone(state, card, "power-discard");
  return card;
}

export function resolvePowerCard(state: GameState, action: PlayPowerCardAction): void {
  const team = action.actorTeam;
  const playedCard = removeCardFromHand(state, team, action.card);
  if (!playedCard) return;

  const powerType = cardPowerType(state, playedCard);
  if (!powerType) return;

  if (powerType === "ferocious-strike" && action.fighter) {
    const fighter = action.fighter;
    if (fighterTeam(state, fighter) === team && isAlive(state, fighter)) {
      fighterWeapon(state, fighter).nextAttackBonusDamage += 1;
      state.log.push({ turn: state.turnInRound, text: `${fighterName(state, fighter)} gains +1 damage on next attack` });
    }
  }

  if (powerType === "healing-potion" && action.fighter) {
    const fighter = action.fighter;
    if (fighterTeam(state, fighter) === team && isAlive(state, fighter)) {
      const health = fighterHealth(state, fighter);
      health.hp = Math.min(health.maxHp, health.hp + 1);
      state.log.push({ turn: state.turnInRound, text: `${fighterName(state, fighter)} heals 1` });
    }
  }

  if (powerType === "sidestep" && action.fighter && action.targetHex) {
    const fighter = action.fighter;
    if (fighterTeam(state, fighter) === team && isAlive(state, fighter)) {
      const occupied = occupiedBy(state, action.targetHex.q, action.targetHex.r);
      const dist = hexDistance(fighterPos(state, fighter), action.targetHex);
      if (dist === 1 && occupied === null) {
        fighterPos(state, fighter).q = action.targetHex.q;
        fighterPos(state, fighter).r = action.targetHex.r;
        state.log.push({ turn: state.turnInRound, text: `${fighterName(state, fighter)} uses ${cardName(state, playedCard)}` });
      }
    }
  }

  state.occupiedObjectives = objectiveOccupancy(state);
}
