import type { WarscrollAbilityEffect } from "../definitions/WarscrollAbilityEffect";
import type { PlayerId } from "../values/ids";
import type { Player } from "../state/Player";

export class WarscrollAbilityResolution {
  public readonly player: Player;
  public readonly warscrollName: string;
  public readonly abilityIndex: number;
  public readonly abilityName: string;
  public readonly tokenCostsPaid: Readonly<Record<string, number>>;
  public readonly effectsResolved: readonly WarscrollAbilityEffect[];
  public readonly effectSummaries: readonly string[];

  public constructor(
    player: Player,
    warscrollName: string,
    abilityIndex: number,
    abilityName: string,
    tokenCostsPaid: Readonly<Record<string, number>>,
    effectsResolved: readonly WarscrollAbilityEffect[],
    effectSummaries: readonly string[],
  ) {
    this.player = player;
    this.warscrollName = warscrollName;
    this.abilityIndex = abilityIndex;
    this.abilityName = abilityName;
    this.tokenCostsPaid = tokenCostsPaid;
    this.effectsResolved = effectsResolved;
    this.effectSummaries = effectSummaries;
  }

  public get playerId(): PlayerId { return this.player.id; }
}
