import { hexDistance, neighbors } from "../hex";
import { rollD6 } from "../rng";
import { isAlive, isBoardHex, objectiveOccupancy, occupiedBy } from "../state";
import type { AttackDieFace, DiceFace, FighterEntity, GameState, SaveDieFace, TeamId } from "../types";

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

function rollAttackFace(rngState: number): { state: number; face: AttackDieFace } {
  const roll = rollD6(rngState);
  if (roll.value === 6) return { state: roll.state, face: "crit-attack" };
  if (roll.value === 5) return { state: roll.state, face: "hammer" };
  if (roll.value === 4) return { state: roll.state, face: "sword" };
  if (roll.value === 3) return { state: roll.state, face: "double-support" };
  if (roll.value === 2) return { state: roll.state, face: "support" };
  return { state: roll.state, face: "blank" };
}

function rollSaveFace(rngState: number): { state: number; face: SaveDieFace } {
  const roll = rollD6(rngState);
  if (roll.value === 6) return { state: roll.state, face: "crit-save" };
  if (roll.value === 5) return { state: roll.state, face: "shield" };
  if (roll.value === 4) return { state: roll.state, face: "dodge" };
  if (roll.value === 3) return { state: roll.state, face: "double-support" };
  if (roll.value === 2) return { state: roll.state, face: "support" };
  return { state: roll.state, face: "blank" };
}

function countAttackSuccesses(
  dice: number,
  rngState: number,
  attackTrait: FighterEntity["stats"]["attackTrait"],
  supportEnabled: boolean,
  criticalSupportEnabled: boolean,
): { rngState: number; successes: number; crits: number; faces: DiceFace[] } {
  let state = rngState;
  let successes = 0;
  let crits = 0;
  const faces: DiceFace[] = [];
  for (let i = 0; i < dice; i += 1) {
    const roll = rollAttackFace(state);
    state = roll.state;

    const isCrit = roll.face === "crit-attack";
    const isMatch = roll.face === attackTrait;
    const isSupport = roll.face === "support" && supportEnabled;
    const isCritSupport = roll.face === "double-support" && criticalSupportEnabled;

    if (isCrit) {
      crits += 1;
      successes += 1;
    } else if (isMatch || isSupport || isCritSupport) {
      successes += 1;
    }

    faces.push({ face: roll.face, result: isCrit ? "crit" : isMatch || isSupport || isCritSupport ? "success" : "fail" });
  }
  return { rngState: state, successes, crits, faces };
}

function countSaveSuccesses(
  dice: number,
  rngState: number,
  saveTrait: FighterEntity["stats"]["saveTrait"],
  supportEnabled: boolean,
  criticalSupportEnabled: boolean,
  guardEnabled: boolean,
): { rngState: number; successes: number; crits: number; faces: DiceFace[] } {
  let state = rngState;
  let successes = 0;
  let crits = 0;
  const faces: DiceFace[] = [];

  for (let i = 0; i < dice; i += 1) {
    const roll = rollSaveFace(state);
    state = roll.state;

    const isCrit = roll.face === "crit-save";
    const isMatch = guardEnabled
      ? roll.face === "shield" || roll.face === "dodge"
      : roll.face === saveTrait;
    const isSupport = roll.face === "support" && supportEnabled;
    const isCritSupport = roll.face === "double-support" && criticalSupportEnabled;

    if (isCrit) {
      crits += 1;
      successes += 1;
    } else if (isMatch || isSupport || isCritSupport) {
      successes += 1;
    }

    faces.push({ face: roll.face, result: isCrit ? "crit" : isMatch || isSupport || isCritSupport ? "success" : "fail" });
  }

  return { rngState: state, successes, crits, faces };
}

function driveBack(state: GameState, attackerId: string, targetId: string): void {
  const attacker = state.components.fighters[attackerId];
  const target = state.components.fighters[targetId];
  const opts = neighbors(target.pos)
    .filter((h) => hexDistance(h, attacker.pos) > hexDistance(target.pos, attacker.pos))
    .filter((h) => occupiedBy(state, h.q, h.r) === null)
    .filter((h) => isBoardHex(state, h.q, h.r));
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

  const targetFlanked = flankAtk >= 1;
  const targetSurrounded = flankAtk >= 2;
  const attackerFlanked = flankDef >= 1;
  const attackerSurrounded = flankDef >= 2;

  const atkDice = attacker.stats.attackDice;
  const defDice = target.stats.saveDice;

  const atkRoll = countAttackSuccesses(
    atkDice,
    state.rngState,
    attacker.stats.attackTrait,
    targetFlanked,
    targetSurrounded,
  );
  const defRoll = countSaveSuccesses(
    defDice,
    atkRoll.rngState,
    target.stats.saveTrait,
    attackerFlanked,
    attackerSurrounded,
    target.guard,
  );
  state.rngState = defRoll.rngState;
  state.diceRollEvent = {
    turn: state.turnInRound,
    attackerName: attacker.name,
    defenderName: target.name,
    attackFaces: atkRoll.faces,
    defenseFaces: defRoll.faces,
  };

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
      if (!target.guard) driveBack(state, attackerId, targetId);
    }
  } else if (atkTotal === defTotal) {
    if (!target.guard) driveBack(state, attackerId, targetId);
    attacker.nextAttackBonusDamage = 0;
    state.log.push({ turn: state.turnInRound, text: "Drawn attack" });
  } else {
    attacker.nextAttackBonusDamage = 0;
    state.log.push({ turn: state.turnInRound, text: "Attack failed" });
  }

  state.occupiedObjectives = objectiveOccupancy(state);
}
