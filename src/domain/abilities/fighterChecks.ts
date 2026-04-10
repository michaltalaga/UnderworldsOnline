import type { FighterState } from "../state/FighterState";
import type { HexCell } from "../state/HexCell";
import { HexKind } from "../values/enums";
import type { HexId } from "../values/ids";

/** Fighter is alive and on the board. Narrows currentHexId to non-null. */
export function canFighterAct(
  fighter: FighterState,
): fighter is FighterState & { currentHexId: HexId } {
  return !fighter.isSlain && fighter.currentHexId !== null;
}

/** Fighter can move or charge (no move/charge tokens). */
export function canFighterMove(
  fighter: FighterState,
): fighter is FighterState & { currentHexId: HexId } {
  return canFighterAct(fighter) && !fighter.hasMoveToken && !fighter.hasChargeToken;
}

/** Fighter can guard (can move + no guard token). */
export function canFighterGuard(fighter: FighterState): boolean {
  return canFighterMove(fighter) && !fighter.hasGuardToken;
}

/** Fighter can attack (alive, on board, no charge token). */
export function canFighterAttack(
  fighter: FighterState,
): fighter is FighterState & { currentHexId: HexId } {
  return canFighterAct(fighter) && !fighter.hasChargeToken;
}

/** Hex is not blocked and has no occupant — can be moved through/into. */
export function isTraversableMoveHex(hex: HexCell): boolean {
  return hex.kind !== HexKind.Blocked && hex.occupantFighterId === null;
}
