import type { DeckDefinitionId } from "../values/ids";
import { CardDefinition } from "./CardDefinition";

export class DeckDefinition {
  public readonly id: DeckDefinitionId;
  public readonly name: string;
  public readonly objectiveCards: readonly CardDefinition[];
  public readonly powerCards: readonly CardDefinition[];

  public constructor(
    id: DeckDefinitionId,
    name: string,
    objectiveCards: readonly CardDefinition[],
    powerCards: readonly CardDefinition[],
  ) {
    this.id = id;
    this.name = name;
    this.objectiveCards = objectiveCards;
    this.powerCards = powerCards;
  }
}
