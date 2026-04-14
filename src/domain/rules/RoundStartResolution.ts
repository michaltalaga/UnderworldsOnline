import type { FeatureTokenSide } from "../values/enums";
import type {
  FeatureTokenId,
  FighterId,
  HexId,
  PlayerId,
} from "../values/ids";
import type { Player } from "../state/Player";

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
  public readonly firstPlayer: Player;
  public readonly featureTokens: readonly RoundStartFeatureTokenResolution[];

  public constructor(
    roundNumber: number,
    firstPlayer: Player,
    featureTokens: readonly RoundStartFeatureTokenResolution[],
  ) {
    this.roundNumber = roundNumber;
    this.firstPlayer = firstPlayer;
    this.featureTokens = featureTokens;
  }

  public get firstPlayerId(): PlayerId { return this.firstPlayer.id; }
}
