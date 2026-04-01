import type { CardId, FighterId, PlayerId } from "../values/ids";
import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";

export class PlayPloyAction extends GameAction {
  public readonly cardId: CardId;
  public readonly targetFighterId: FighterId | null;

  public constructor(playerId: PlayerId, cardId: CardId, targetFighterId: FighterId | null = null) {
    super(GameActionKind.PlayPloy, playerId);
    this.cardId = cardId;
    this.targetFighterId = targetFighterId;
  }
}
