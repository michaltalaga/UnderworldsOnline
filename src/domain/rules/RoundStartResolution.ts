import type { FeatureTokenSide } from "../values/enums";
import type {
  FeatureTokenId,
  FighterId,
  HexId,
  PlayerId,
} from "../values/ids";

export type RoundStartFeatureTokenResolution = {
  featureTokenId: FeatureTokenId;
  featureTokenHexId: HexId;
  side: FeatureTokenSide;
  heldByFighterId: FighterId | null;
  heldByFighterName: string | null;
  holderOwnerPlayerId: PlayerId | null;
};

export class RoundStartResolution {
  public readonly roundNumber: number;
  public readonly firstPlayerId: PlayerId;
  public readonly featureTokens: readonly RoundStartFeatureTokenResolution[];

  public constructor(
    roundNumber: number,
    firstPlayerId: PlayerId,
    featureTokens: readonly RoundStartFeatureTokenResolution[],
  ) {
    this.roundNumber = roundNumber;
    this.firstPlayerId = firstPlayerId;
    this.featureTokens = featureTokens;
  }
}
