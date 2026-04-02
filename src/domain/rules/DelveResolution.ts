import type { FeatureTokenSide } from "../values/enums";
import type { FeatureTokenId, FighterId, HexId, PlayerId } from "../values/ids";

export class DelveResolution {
  public readonly roundNumber: number;
  public readonly playerId: PlayerId;
  public readonly playerName: string;
  public readonly fighterId: FighterId;
  public readonly fighterName: string;
  public readonly featureTokenId: FeatureTokenId;
  public readonly featureTokenHexId: HexId;
  public readonly sideBeforeDelve: FeatureTokenSide;
  public readonly sideAfterDelve: FeatureTokenSide;
  public readonly staggerApplied: boolean;
  public readonly holderAfterFighterId: FighterId | null;
  public readonly holderAfterFighterName: string | null;

  public constructor(
    roundNumber: number,
    playerId: PlayerId,
    playerName: string,
    fighterId: FighterId,
    fighterName: string,
    featureTokenId: FeatureTokenId,
    featureTokenHexId: HexId,
    sideBeforeDelve: FeatureTokenSide,
    sideAfterDelve: FeatureTokenSide,
    staggerApplied: boolean,
    holderAfterFighterId: FighterId | null,
    holderAfterFighterName: string | null,
  ) {
    this.roundNumber = roundNumber;
    this.playerId = playerId;
    this.playerName = playerName;
    this.fighterId = fighterId;
    this.fighterName = fighterName;
    this.featureTokenId = featureTokenId;
    this.featureTokenHexId = featureTokenHexId;
    this.sideBeforeDelve = sideBeforeDelve;
    this.sideAfterDelve = sideAfterDelve;
    this.staggerApplied = staggerApplied;
    this.holderAfterFighterId = holderAfterFighterId;
    this.holderAfterFighterName = holderAfterFighterName;
  }
}
