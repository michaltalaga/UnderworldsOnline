import { TurnStep } from "../values/enums";
import type { WarscrollAbilityEffect } from "./WarscrollAbilityEffect";

export class WarscrollAbilityDefinition {
  public readonly name: string;
  public readonly text: string;
  public readonly timing: TurnStep;
  public readonly tokenCosts: Readonly<Record<string, number>>;
  public readonly effects: readonly WarscrollAbilityEffect[];

  public constructor(
    name: string,
    text: string,
    timing: TurnStep,
    tokenCosts: Readonly<Record<string, number>> = {},
    effects: readonly WarscrollAbilityEffect[] = [],
  ) {
    this.name = name;
    this.text = text;
    this.timing = timing;
    this.tokenCosts = tokenCosts;
    this.effects = effects;
  }
}
