import { hexDistance, neighbors } from "../hex";
import { rollD6 } from "../rng";
import {
  fighterCombat,
  fighterHealth,
  fighterName,
  fighterPos,
  fighterStatus,
  fighterTeam,
  isAlive,
  isBoardHex,
  objectiveOccupancy,
  occupiedBy,
} from "../state";
import type { AttackDieFace, DiceFace, EntityId, GameState, SaveDieFace, TeamId } from "../types";

function adjacentAlliesExcluding(
  state: GameState,
  centerId: EntityId,
  team: TeamId,
  excludeId: EntityId,
): number {
  return neighbors(fighterPos(state, centerId))
    .map((h) => occupiedBy(state, h.q, h.r))
    .filter((id): id is EntityId => Boolean(id) && id !== excludeId)
    .filter((id) => isAlive(state, id) && fighterTeam(state, id) === team).length;
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
  attackTrait: "hammer" | "sword",
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
  saveTrait: "shield" | "dodge",
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

function driveBack(state: GameState, attackerId: EntityId, targetId: EntityId): void {
  const attackerPos = fighterPos(state, attackerId);
  const targetPos = fighterPos(state, targetId);

  const opts = neighbors(targetPos)
    .filter((h) => hexDistance(h, attackerPos) > hexDistance(targetPos, attackerPos))
    .filter((h) => occupiedBy(state, h.q, h.r) === null)
    .filter((h) => isBoardHex(state, h.q, h.r));

  if (opts.length > 0) {
    fighterPos(state, targetId).q = opts[0].q;
    fighterPos(state, targetId).r = opts[0].r;
  }
}

export function resolveAttack(state: GameState, attackerId: EntityId, targetId: EntityId): void {
  if (!isAlive(state, attackerId) || !isAlive(state, targetId)) return;

  const atkTeam = fighterTeam(state, attackerId);
  const defTeam = fighterTeam(state, targetId);

  const flankAtk = adjacentAlliesExcluding(state, targetId, atkTeam, attackerId);
  const flankDef = adjacentAlliesExcluding(state, attackerId, defTeam, targetId);

  const targetFlanked = flankAtk >= 1;
  const targetSurrounded = flankAtk >= 2;
  const attackerFlanked = flankDef >= 1;
  const attackerSurrounded = flankDef >= 2;

  const attackerCombat = fighterCombat(state, attackerId);
  const targetCombat = fighterCombat(state, targetId);
  const targetStatus = fighterStatus(state, targetId);

  const atkRoll = countAttackSuccesses(
    attackerCombat.attackDice,
    state.rngState,
    attackerCombat.attackTrait,
    targetFlanked,
    targetSurrounded,
  );

  const defRoll = countSaveSuccesses(
    targetCombat.saveDice,
    atkRoll.rngState,
    targetCombat.saveTrait,
    attackerFlanked,
    attackerSurrounded,
    targetStatus.guard,
  );

  state.rngState = defRoll.rngState;
  state.diceRollEvent = {
    turn: state.turnInRound,
    attackerName: fighterName(state, attackerId),
    defenderName: fighterName(state, targetId),
    attackFaces: atkRoll.faces,
    defenseFaces: defRoll.faces,
  };

  const atkTotal = atkRoll.successes;
  const defTotal = defRoll.successes;

  state.log.push({
    turn: state.turnInRound,
    text: `${fighterName(state, attackerId)} attacks ${fighterName(state, targetId)} (${atkTotal} vs ${defTotal})`,
  });

  if (atkTotal > defTotal) {
    const damage = attackerCombat.attackDamage + attackerCombat.nextAttackBonusDamage;
    attackerCombat.nextAttackBonusDamage = 0;

    const targetHealth = fighterHealth(state, targetId);
    targetHealth.hp -= damage;

    state.teams[atkTeam].roundSuccessfulAttacks += 1;
    state.log.push({ turn: state.turnInRound, text: `Hit for ${damage} damage` });

    if (targetHealth.hp <= 0) {
      state.teams[atkTeam].roundTakedowns += 1;
      state.log.push({ turn: state.turnInRound, text: `${fighterName(state, targetId)} is taken down` });
    } else if (!targetStatus.guard) {
      driveBack(state, attackerId, targetId);
    }
  } else if (atkTotal === defTotal) {
    if (!targetStatus.guard) driveBack(state, attackerId, targetId);
    attackerCombat.nextAttackBonusDamage = 0;
    state.log.push({ turn: state.turnInRound, text: "Drawn attack" });
  } else {
    attackerCombat.nextAttackBonusDamage = 0;
    state.log.push({ turn: state.turnInRound, text: "Attack failed" });
  }

  state.occupiedObjectives = objectiveOccupancy(state);
}
