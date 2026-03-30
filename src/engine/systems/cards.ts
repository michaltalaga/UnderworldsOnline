import { hexDistance } from "../hex";
import { objectiveOccupancy, occupiedBy } from "../state";
import type { GameState, PlayPowerCardAction } from "../types";

function removeCardFromHand(state: GameState, team: "red" | "blue", cardId: string) {
  const idx = state.teams[team].powerHand.findIndex((c) => c.id === cardId);
  if (idx < 0) return null;
  const [card] = state.teams[team].powerHand.splice(idx, 1);
  state.teams[team].discardPower.push(card);
  return card;
}

export function resolvePowerCard(state: GameState, action: PlayPowerCardAction): void {
  const team = action.actorTeam;
  const card = removeCardFromHand(state, team, action.cardId);
  if (!card) return;

  if (card.type === "ferocious-strike" && action.fighterId) {
    const fighter = state.components.fighters[action.fighterId];
    if (fighter && fighter.team === team && fighter.hp > 0) {
      fighter.nextAttackBonusDamage += 1;
      state.log.push({ turn: state.turnInRound, text: `${fighter.name} gains +1 damage on next attack` });
    }
  }

  if (card.type === "healing-potion" && action.fighterId) {
    const fighter = state.components.fighters[action.fighterId];
    if (fighter && fighter.team === team && fighter.hp > 0) {
      fighter.hp = Math.min(fighter.stats.maxHp, fighter.hp + 1);
      state.log.push({ turn: state.turnInRound, text: `${fighter.name} heals 1` });
    }
  }

  if (card.type === "sidestep" && action.fighterId && action.targetHex) {
    const fighter = state.components.fighters[action.fighterId];
    if (fighter && fighter.team === team && fighter.hp > 0) {
      const occupied = occupiedBy(state, action.targetHex.q, action.targetHex.r);
      const dist = hexDistance(fighter.pos, action.targetHex);
      if (dist === 1 && occupied === null) {
        fighter.pos = action.targetHex;
        state.log.push({ turn: state.turnInRound, text: `${fighter.name} sidesteps` });
      }
    }
  }

  state.occupiedObjectives = objectiveOccupancy(state);
}
