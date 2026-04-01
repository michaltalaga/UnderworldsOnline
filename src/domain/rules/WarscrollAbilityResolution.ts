import type { WarscrollAbilityEffect } from "../definitions/WarscrollAbilityEffect";
import type { PlayerId } from "../values/ids";

export class WarscrollAbilityResolution {
  public readonly playerId: PlayerId;
  public readonly warscrollName: string;
  public readonly abilityIndex: number;
  public readonly abilityName: string;
  public readonly tokenCostsPaid: Readonly<Record<string, number>>;
  public readonly effectsResolved: readonly WarscrollAbilityEffect[];
  public readonly effectSummaries: readonly string[];

  public constructor(
    playerId: PlayerId,
    warscrollName: string,
    abilityIndex: number,
    abilityName: string,
    tokenCostsPaid: Readonly<Record<string, number>>,
    effectsResolved: readonly WarscrollAbilityEffect[],
    effectSummaries: readonly string[],
  ) {
    this.playerId = playerId;
    this.warscrollName = warscrollName;
    this.abilityIndex = abilityIndex;
    this.abilityName = abilityName;
    this.tokenCostsPaid = tokenCostsPaid;
    this.effectsResolved = effectsResolved;
    this.effectSummaries = effectSummaries;
  }
}
