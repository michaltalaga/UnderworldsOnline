import type { CardId, PlayerId } from "../values/ids";
import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";

export class FocusAction extends GameAction {
  public readonly objectiveCardIds: CardId[];
  public readonly powerCardIds: CardId[];

  public constructor(playerId: PlayerId, objectiveCardIds: CardId[] = [], powerCardIds: CardId[] = []) {
    super(GameActionKind.Focus, playerId);
    this.objectiveCardIds = objectiveCardIds;
    this.powerCardIds = powerCardIds;
  }
}
