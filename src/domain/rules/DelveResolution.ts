import type { FeatureTokenSide } from "../values/enums";
import type { FeatureTokenId, FighterId, HexId, PlayerId } from "../values/ids";
import type { FeatureToken } from "../state/FeatureToken";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";

export class DelveResolution {
  public readonly roundNumber: number;
  public readonly player: Player;
  public readonly fighter: Fighter;
  public readonly featureToken: FeatureToken;
  public readonly sideBeforeDelve: FeatureTokenSide;
  public readonly sideAfterDelve: FeatureTokenSide;
  public readonly staggerApplied: boolean;
  public readonly holderAfterFighter: Fighter | null;

  public constructor(
    roundNumber: number,
    player: Player,
    fighter: Fighter,
    featureToken: FeatureToken,
    sideBeforeDelve: FeatureTokenSide,
    sideAfterDelve: FeatureTokenSide,
    staggerApplied: boolean,
    holderAfterFighter: Fighter | null,
  ) {
    this.roundNumber = roundNumber;
    this.player = player;
    this.fighter = fighter;
    this.featureToken = featureToken;
    this.sideBeforeDelve = sideBeforeDelve;
    this.sideAfterDelve = sideAfterDelve;
    this.staggerApplied = staggerApplied;
    this.holderAfterFighter = holderAfterFighter;
  }

  public get playerId(): PlayerId { return this.player.id; }
  public get playerName(): string { return this.player.name; }
  public get fighterId(): FighterId { return this.fighter.id; }
  public get fighterName(): string { return this.fighter.definition.name; }
  public get featureTokenId(): FeatureTokenId { return this.featureToken.id; }
  public get featureTokenHexId(): HexId { return this.featureToken.hex.id; }
  public get holderAfterFighterId(): FighterId | null { return this.holderAfterFighter?.id ?? null; }
  public get holderAfterFighterName(): string | null {
    return this.holderAfterFighter?.definition.name ?? null;
  }
}
