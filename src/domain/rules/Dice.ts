import { AttackDieFace, SaveDieFace } from "../values/enums";

// The single source of truth for the physical dice used in Warhammer
// Underworlds. Both dice are 6-sided. Any code that rolls or samples dice
// should import from this module so the composition is defined once.

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

function pickRandomFace<T>(faces: readonly T[]): T {
  const randomIndex = Math.floor(Math.random() * faces.length);
  const face = faces[randomIndex];
  if (face === undefined) {
    throw new Error("Expected a die face.");
  }
  return face;
}
