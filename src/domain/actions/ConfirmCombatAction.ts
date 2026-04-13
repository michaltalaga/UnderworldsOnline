import type { PlayerId } from "../values/ids";
import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";

/** Confirms a pending combat — resolves dice rolls into damage/effects. */
export class ConfirmCombatAction extends GameAction {
  public constructor(playerId: PlayerId) {
    super(GameActionKind.ConfirmCombat, playerId);
  }
}
