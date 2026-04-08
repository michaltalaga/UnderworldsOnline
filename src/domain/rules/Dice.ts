import { AttackDieFace, SaveDieFace } from "../values/enums";
import type { RollOffRoundInput } from "./RollOffRound";

// The single source of truth for the physical dice used in Warhammer
// Underworlds. Both dice are 6-sided. Any code that rolls, samples, ranks,
// or fakes dice should import from this module so the composition is
// defined once.

// Attack die: 1 Critical, 2 Hammer, 1 X Swords, 1 Support, 1 Double Support.
export const attackDieFaces: readonly AttackDieFace[] = [
  AttackDieFace.Critical,
  AttackDieFace.Hammer,
  AttackDieFace.Hammer,
  AttackDieFace.Sword,
  AttackDieFace.Support,
  AttackDieFace.DoubleSupport,
];

// Save die: 1 Critical, 2 Shield, 1 Dodge, 1 Support, 1 Double Support.
export const saveDieFaces: readonly SaveDieFace[] = [
  SaveDieFace.Critical,
  SaveDieFace.Shield,
  SaveDieFace.Shield,
  SaveDieFace.Dodge,
  SaveDieFace.Support,
  SaveDieFace.DoubleSupport,
];

export function rollAttackDie(): AttackDieFace {
  return pickRandomFace(attackDieFaces);
}

export function rollSaveDie(): SaveDieFace {
  return pickRandomFace(saveDieFaces);
}

// Roll-off ranking per the rulebook: Critical > Hammer/Swords > Support,
// with Support and Double Support tied at rank 1. Blank is defensive only
// (never rolled, but still a valid enum member).
export function getAttackDieFaceRank(face: AttackDieFace): number {
  switch (face) {
    case AttackDieFace.Critical:
      return 3;
    case AttackDieFace.Hammer:
    case AttackDieFace.Sword:
      return 2;
    case AttackDieFace.Support:
    case AttackDieFace.DoubleSupport:
      return 1;
    case AttackDieFace.Blank:
      return 0;
    default: {
      const exhaustive: never = face;
      throw new Error(`Unsupported attack die face ${exhaustive}.`);
    }
  }
}

// Deterministic roll-off round used by test fixtures and auto-setup flows
// to force the first player to win without rolling random dice. Hammer beats
// Support, so the "first" (Player One) side wins.
export const deterministicFirstPlayerRollOff: RollOffRoundInput = {
  firstFace: AttackDieFace.Hammer,
  secondFace: AttackDieFace.Support,
};

function pickRandomFace<T>(faces: readonly T[]): T {
  const randomIndex = Math.floor(Math.random() * faces.length);
  const face = faces[randomIndex];
  if (face === undefined) {
    throw new Error("Expected a die face.");
  }
  return face;
}
