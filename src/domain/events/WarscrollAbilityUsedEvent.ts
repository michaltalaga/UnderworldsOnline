import type { GameActionKind } from "../values/enums";
import type { WarscrollAbilityEffect } from "../definitions/WarscrollAbilityEffect";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export class WarscrollAbilityUsedEvent extends GameEvent {
  public readonly player: Player;
  public readonly warscrollName: string;
  public readonly abilityIndex: number;
  public readonly abilityName: string;
  public readonly tokenCostsPaid: Readonly<Record<string, number>>;
  public readonly effectsResolved: readonly WarscrollAbilityEffect[];
  public readonly effectSummaries: readonly string[];

  public constructor(
    roundNumber: number,
    player: Player,
    warscrollName: string,
    abilityIndex: number,
    abilityName: string,
    tokenCostsPaid: Readonly<Record<string, number>>,
    effectsResolved: readonly WarscrollAbilityEffect[],
    effectSummaries: readonly string[],
    actionKind: GameActionKind,
  ) {
    super(roundNumber, player, null, null, actionKind);
    this.player = player;
    this.warscrollName = warscrollName;
    this.abilityIndex = abilityIndex;
    this.abilityName = abilityName;
    this.tokenCostsPaid = tokenCostsPaid;
    this.effectsResolved = effectsResolved;
    this.effectSummaries = effectSummaries;
  }
}
