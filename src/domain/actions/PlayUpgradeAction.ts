import type { CardId, FighterId, PlayerId } from "../values/ids";
import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";

export class PlayUpgradeAction extends GameAction {
  public readonly cardId: CardId;
  public readonly fighterId: FighterId;

  public constructor(playerId: PlayerId, cardId: CardId, fighterId: FighterId) {
    super(GameActionKind.PlayUpgrade, playerId);
    this.cardId = cardId;
    this.fighterId = fighterId;
  }
}
