import type { FeatureTokenSide } from "../values/enums";
import type { FeatureTokenId, HexId } from "../values/ids";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export type RoundStartedFeatureTokenSnapshot = {
  readonly featureTokenId: FeatureTokenId;
  readonly featureTokenHexId: HexId;
  readonly side: FeatureTokenSide;
  readonly heldByFighter: Fighter | null;
  readonly holderOwnerPlayer: Player | null;
};

export class RoundStartedEvent extends GameEvent {
  public readonly firstPlayer: Player;
  public readonly featureTokens: readonly RoundStartedFeatureTokenSnapshot[];

  public constructor(
    roundNumber: number,
    firstPlayer: Player,
    featureTokens: readonly RoundStartedFeatureTokenSnapshot[],
  ) {
    super(roundNumber, null, null, null, null);
    this.firstPlayer = firstPlayer;
    this.featureTokens = featureTokens;
  }
}
