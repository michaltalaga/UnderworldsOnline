import type { CardFactory } from "../cards/Card";
import type { DeckDefinitionId } from "../values/ids";

export class DeckDefinition {
  public readonly id: DeckDefinitionId;
  public readonly name: string;
  public readonly objectiveCards: readonly CardFactory[];
  public readonly powerCards: readonly CardFactory[];

  public constructor(
    id: DeckDefinitionId,
    name: string,
    objectiveCards: readonly CardFactory[],
    powerCards: readonly CardFactory[],
  ) {
    this.id = id;
    this.name = name;
    this.objectiveCards = objectiveCards;
    this.powerCards = powerCards;
  }
}
