import type { GameActionKind } from "../values/enums";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export class FighterGuardedEvent extends GameEvent {
  public readonly player: Player;
  public readonly fighter: Fighter;

  public constructor(
    roundNumber: number,
    player: Player,
    fighter: Fighter,
    actionKind: GameActionKind,
  ) {
    super(roundNumber, player, fighter, null, actionKind);
    this.player = player;
    this.fighter = fighter;
  }
}
