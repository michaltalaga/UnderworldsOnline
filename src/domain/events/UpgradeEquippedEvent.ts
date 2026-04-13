import type { GameActionKind } from "../values/enums";
import type { Card } from "../cards/Card";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export class UpgradeEquippedEvent extends GameEvent {
  public readonly player: Player;
  public readonly card: Card;
  public readonly fighter: Fighter;
  public readonly gloryPaid: number;

  public constructor(
    roundNumber: number,
    player: Player,
    card: Card,
    fighter: Fighter,
    gloryPaid: number,
    actionKind: GameActionKind,
  ) {
    super(roundNumber, player, fighter, card, actionKind);
    this.player = player;
    this.card = card;
    this.fighter = fighter;
    this.gloryPaid = gloryPaid;
  }
}
