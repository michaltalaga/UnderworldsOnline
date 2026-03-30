import type { WarscrollDefinitionId } from "../values/ids";

export class WarscrollDefinition {
  public readonly id: WarscrollDefinitionId;
  public readonly name: string;
  public readonly setupInstructions: readonly string[];
  public readonly abilityTexts: readonly string[];

  public constructor(
    id: WarscrollDefinitionId,
    name: string,
    setupInstructions: readonly string[] = [],
    abilityTexts: readonly string[] = [],
  ) {
    this.id = id;
    this.name = name;
    this.setupInstructions = setupInstructions;
    this.abilityTexts = abilityTexts;
  }
}
