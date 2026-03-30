import type { FeatureTokenId, FighterId, PlayerId } from "../values/ids";
import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";

export class DelveAction extends GameAction {
  public readonly fighterId: FighterId;
  public readonly featureTokenId: FeatureTokenId;

  public constructor(playerId: PlayerId, fighterId: FighterId, featureTokenId: FeatureTokenId) {
    super(GameActionKind.Delve, playerId);
    this.fighterId = fighterId;
    this.featureTokenId = featureTokenId;
  }
}
