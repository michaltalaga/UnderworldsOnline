import type { CardId, PlayerId } from "../values/ids";
import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";

export class PlayPloyAction extends GameAction {
  public readonly cardId: CardId;

  public constructor(playerId: PlayerId, cardId: CardId) {
    super(GameActionKind.PlayPloy, playerId);
    this.cardId = cardId;
  }
}
