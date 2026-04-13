import type { FeatureTokenSide, GameActionKind } from "../values/enums";
import type { FeatureTokenId, HexId } from "../values/ids";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export class FighterDelvedEvent extends GameEvent {
  public readonly player: Player;
  public readonly fighter: Fighter;
  public readonly featureTokenId: FeatureTokenId;
  public readonly featureTokenHexId: HexId;
  public readonly sideBeforeDelve: FeatureTokenSide;
  public readonly sideAfterDelve: FeatureTokenSide;
  public readonly staggerApplied: boolean;
  public readonly holderAfterFighter: Fighter | null;

  public constructor(
    roundNumber: number,
    player: Player,
    fighter: Fighter,
    featureTokenId: FeatureTokenId,
    featureTokenHexId: HexId,
    sideBeforeDelve: FeatureTokenSide,
    sideAfterDelve: FeatureTokenSide,
    staggerApplied: boolean,
    holderAfterFighter: Fighter | null,
    actionKind: GameActionKind,
  ) {
    super(roundNumber, player, fighter, null, actionKind);
    this.player = player;
    this.fighter = fighter;
    this.featureTokenId = featureTokenId;
    this.featureTokenHexId = featureTokenHexId;
    this.sideBeforeDelve = sideBeforeDelve;
    this.sideAfterDelve = sideAfterDelve;
    this.staggerApplied = staggerApplied;
    this.holderAfterFighter = holderAfterFighter;
  }
}
