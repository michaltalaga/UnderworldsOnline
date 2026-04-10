import type { CardFactory } from "../cards/Card";
import type { WarbandDefinitionId } from "../values/ids";
import { FighterDefinition } from "./FighterDefinition";
import { WarscrollDefinition } from "./WarscrollDefinition";

export class WarbandDefinition {
  public readonly id: WarbandDefinitionId;
  public readonly name: string;
  public readonly fighters: readonly FighterDefinition[];
  public readonly warscroll: WarscrollDefinition;
  public readonly objectiveCards: readonly CardFactory[];
  public readonly powerCards: readonly CardFactory[];

  public constructor(
    id: WarbandDefinitionId,
    name: string,
    fighters: readonly FighterDefinition[],
    warscroll: WarscrollDefinition,
    objectiveCards: readonly CardFactory[],
    powerCards: readonly CardFactory[],
  ) {
    this.id = id;
    this.name = name;
    this.fighters = fighters;
    this.warscroll = warscroll;
    this.objectiveCards = objectiveCards;
    this.powerCards = powerCards;
  }
}
