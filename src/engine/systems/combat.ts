import type { Fighter } from "../model";
import { hexDistance, neighbors } from "../hex";
import { rollD6 } from "../rng";
import {
  fighterWeapon,
  fighterHealth,
  fighterName,
  fighterPos,
  hasStatus,
  fighterTeam,
  isAlive,
  isBoardHex,
  objectiveOccupancy,
  occupiedBy,
} from "../state";
import type { AttackDieFace, DiceFace, GameState, SaveDieFace, TeamId } from "../types";

function adjacentAlliesExcluding(
  state: GameState,
  centerFighter: Fighter,
  team: TeamId,
  excludeFighter: Fighter,
): number {
  return neighbors(fighterPos(state, centerFighter))
    .map((h) => occupiedBy(state, h.q, h.r))
    .filter((fighter): fighter is Fighter => Boolean(fighter) && fighter !== excludeFighter)
    .filter((fighter) => isAlive(state, fighter) && fighterTeam(state, fighter) === team).length;
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

function driveBack(state: GameState, attacker: Fighter, target: Fighter): void {
  const attackerPos = fighterPos(state, attacker);
  const targetPos = fighterPos(state, target);

  const opts = neighbors(targetPos)
    .filter((h) => hexDistance(h, attackerPos) > hexDistance(targetPos, attackerPos))
    .filter((h) => occupiedBy(state, h.q, h.r) === null)
    .filter((h) => isBoardHex(state, h.q, h.r));

  if (opts.length > 0) {
    fighterPos(state, target).q = opts[0].q;
    fighterPos(state, target).r = opts[0].r;
  }
}

export function resolveAttack(state: GameState, attacker: Fighter, target: Fighter): void {
  if (!isAlive(state, attacker) || !isAlive(state, target)) return;

  const atkTeam = fighterTeam(state, attacker);
  const defTeam = fighterTeam(state, target);

  const flankAtk = adjacentAlliesExcluding(state, target, atkTeam, attacker);
  const flankDef = adjacentAlliesExcluding(state, attacker, defTeam, target);

  const targetFlanked = flankAtk >= 1;
  const targetSurrounded = flankAtk >= 2;
  const attackerFlanked = flankDef >= 1;
  const attackerSurrounded = flankDef >= 2;

  const attackerWeapon = fighterWeapon(state, attacker);
  const targetWeapon = fighterWeapon(state, target);
  const targetHasGuard = hasStatus(state, target, "guard");

  const atkRoll = countAttackSuccesses(
    attackerWeapon.attackDice,
    state.rngState,
    attackerWeapon.attackTrait,
    targetFlanked,
    targetSurrounded,
  );

  const defRoll = countSaveSuccesses(
    targetWeapon.saveDice,
    atkRoll.rngState,
    targetWeapon.saveTrait,
    attackerFlanked,
    attackerSurrounded,
    targetHasGuard,
  );

  state.rngState = defRoll.rngState;
  state.diceRollEvent = {
    turn: state.turnInRound,
    attackerName: fighterName(state, attacker),
    defenderName: fighterName(state, target),
    attackFaces: atkRoll.faces,
    defenseFaces: defRoll.faces,
  };

  const atkTotal = atkRoll.successes;
  const defTotal = defRoll.successes;

  state.log.push({
    turn: state.turnInRound,
    text: `${fighterName(state, attacker)} attacks ${fighterName(state, target)} (${atkTotal} vs ${defTotal})`,
  });

  if (atkTotal > defTotal) {
    const damage = attackerWeapon.attackDamage + attackerWeapon.nextAttackBonusDamage;
    attackerWeapon.nextAttackBonusDamage = 0;

    const targetHealth = fighterHealth(state, target);
    targetHealth.hp -= damage;

    state.teams[atkTeam].roundSuccessfulAttacks += 1;
    state.log.push({ turn: state.turnInRound, text: `Hit for ${damage} damage` });

    if (targetHealth.hp <= 0) {
      state.teams[atkTeam].roundTakedowns += 1;
      state.log.push({ turn: state.turnInRound, text: `${fighterName(state, target)} is taken down` });
    } else if (!targetHasGuard) {
      driveBack(state, attacker, target);
    }
  } else if (atkTotal === defTotal) {
    if (!targetHasGuard) driveBack(state, attacker, target);
    attackerWeapon.nextAttackBonusDamage = 0;
    state.log.push({ turn: state.turnInRound, text: "Drawn attack" });
  } else {
    attackerWeapon.nextAttackBonusDamage = 0;
    state.log.push({ turn: state.turnInRound, text: "Attack failed" });
  }

  state.occupiedObjectives = objectiveOccupancy(state);
}
