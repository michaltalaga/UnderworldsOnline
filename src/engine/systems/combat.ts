import { hexDistance, neighbors } from "../hex";
import { rollD6 } from "../rng";
import { isAlive, objectiveOccupancy, occupiedBy } from "../state";
import type { FighterEntity, GameState, TeamId } from "../types";

function adjacentAlliesExcluding(
  state: GameState,
  center: FighterEntity,
  team: TeamId,
  excludeId: string,
): number {
  return neighbors(center.pos)
    .map((h) => occupiedBy(state, h.q, h.r))
    .filter((id) => id && id !== excludeId)
    .map((id) => state.components.fighters[id as string])
    .filter((f) => isAlive(f) && f.team === team).length;
}

function countSuccesses(dice: number, rngState: number): { rngState: number; successes: number; crits: number } {
  let state = rngState;
  let successes = 0;
  let crits = 0;
  for (let i = 0; i < dice; i += 1) {
    const roll = rollD6(state);
    state = roll.state;
    if (roll.value >= 4) successes += 1;
    if (roll.value === 6) crits += 1;
  }
  return { rngState: state, successes, crits };
}

function driveBack(state: GameState, attackerId: string, targetId: string): void {
  const attacker = state.components.fighters[attackerId];
  const target = state.components.fighters[targetId];
  const opts = neighbors(target.pos)
    .filter((h) => hexDistance(h, attacker.pos) > hexDistance(target.pos, attacker.pos))
    .filter((h) => occupiedBy(state, h.q, h.r) === null)
    .filter((h) => {
      const s = -h.q - h.r;
      return Math.max(Math.abs(h.q), Math.abs(h.r), Math.abs(s)) <= state.boardRadius;
    });
  if (opts.length > 0) {
    target.pos = opts[0];
  }
}

export function resolveAttack(state: GameState, attackerId: string, targetId: string): void {
  const attacker = state.components.fighters[attackerId];
  const target = state.components.fighters[targetId];
  if (!isAlive(attacker) || !isAlive(target)) return;

  const atkTeam = attacker.team;
  const defTeam = target.team;

  const flankAtk = adjacentAlliesExcluding(state, target, atkTeam, attackerId);
  const flankDef = adjacentAlliesExcluding(state, attacker, defTeam, targetId);

  const atkDice = attacker.stats.attackDice + Math.min(flankAtk, 2);
  const defDice = target.stats.saveDice + (target.guard ? 1 : 0) + Math.min(flankDef, 1);

  const atkRoll = countSuccesses(atkDice, state.rngState);
  const defRoll = countSuccesses(defDice, atkRoll.rngState);
  state.rngState = defRoll.rngState;

  const atkTotal = atkRoll.successes + atkRoll.crits;
  const defTotal = defRoll.successes + defRoll.crits;

  state.log.push({
    turn: state.turnInRound,
    text: `${attacker.name} attacks ${target.name} (${atkTotal} vs ${defTotal})`,
  });

  if (atkTotal > defTotal) {
    const damage = attacker.stats.attackDamage + attacker.nextAttackBonusDamage;
    attacker.nextAttackBonusDamage = 0;
    target.hp -= damage;
    state.teams[atkTeam].roundSuccessfulAttacks += 1;
    state.log.push({ turn: state.turnInRound, text: `Hit for ${damage} damage` });
    if (target.hp <= 0) {
      state.teams[atkTeam].roundTakedowns += 1;
      state.log.push({ turn: state.turnInRound, text: `${target.name} is taken down` });
    } else {
      driveBack(state, attackerId, targetId);
    }
  } else if (atkTotal === defTotal) {
    driveBack(state, attackerId, targetId);
    attacker.nextAttackBonusDamage = 0;
    state.log.push({ turn: state.turnInRound, text: "Drawn attack" });
  } else {
    attacker.nextAttackBonusDamage = 0;
    state.log.push({ turn: state.turnInRound, text: "Attack failed" });
  }

  state.occupiedObjectives = objectiveOccupancy(state);
}
