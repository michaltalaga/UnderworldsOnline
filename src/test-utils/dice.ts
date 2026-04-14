import { AttackDieFace, SaveDieFace } from "../domain";

/**
 * Dice helpers — construct deterministic rolls by face.
 *
 * Actions accept attack/save rolls as parameters, so "mocking" dice
 * means passing an explicit array. These helpers are for readability
 * only; any fixed-length array of faces works.
 *
 * Never use Math.random() in tests. Always pass scripted dice.
 */

export function attackDice(...faces: AttackDieFace[]): AttackDieFace[] {
  return faces;
}

export function saveDice(...faces: SaveDieFace[]): SaveDieFace[] {
  return faces;
}

/** N blank attack dice — a guaranteed miss. */
export function attackBlanks(n: number): AttackDieFace[] {
  return Array.from({ length: n }, () => AttackDieFace.Blank);
}

/** N critical attack dice — the maximum successful roll. */
export function attackCrits(n: number): AttackDieFace[] {
  return Array.from({ length: n }, () => AttackDieFace.Critical);
}

/** N blank save dice — a guaranteed missed save. */
export function saveBlanks(n: number): SaveDieFace[] {
  return Array.from({ length: n }, () => SaveDieFace.Blank);
}

/** N critical save dice — the maximum successful save. */
export function saveCrits(n: number): SaveDieFace[] {
  return Array.from({ length: n }, () => SaveDieFace.Critical);
}

/** N shield save dice — a clean save for Shield-symbol fighters. */
export function saveShields(n: number): SaveDieFace[] {
  return Array.from({ length: n }, () => SaveDieFace.Shield);
}
