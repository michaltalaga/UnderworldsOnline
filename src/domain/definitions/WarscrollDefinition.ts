import type { WarscrollDefinitionId } from "../values/ids";
import { WarscrollAbilityDefinition } from "./WarscrollAbilityDefinition";

export class WarscrollDefinition {
  public readonly id: WarscrollDefinitionId;
  public readonly name: string;
  public readonly setupInstructions: readonly string[];
  public readonly abilityTexts: readonly string[];
  public readonly startingTokens: Readonly<Record<string, number>>;
  public readonly abilities: readonly WarscrollAbilityDefinition[];

  public constructor(
    id: WarscrollDefinitionId,
    name: string,
    setupInstructions: readonly string[] = [],
    abilityTexts: readonly string[] = [],
    startingTokens: Readonly<Record<string, number>> = {},
    abilities: readonly WarscrollAbilityDefinition[] = [],
  ) {
    this.id = id;
    this.name = name;
    this.setupInstructions = setupInstructions;
    this.abilityTexts = abilityTexts.length > 0 ? abilityTexts : abilities.map((ability) => ability.text);
    this.startingTokens = startingTokens;
    this.abilities = abilities;
  }

  public getAbility(abilityIndex: number): WarscrollAbilityDefinition | undefined {
    return this.abilities[abilityIndex];
  }
}
