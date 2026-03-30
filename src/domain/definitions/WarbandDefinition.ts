import type { WarbandDefinitionId } from "../values/ids";
import { CardDefinition } from "./CardDefinition";
import { FighterDefinition } from "./FighterDefinition";
import { WarscrollDefinition } from "./WarscrollDefinition";

export class WarbandDefinition {
  public readonly id: WarbandDefinitionId;
  public readonly name: string;
  public readonly fighters: readonly FighterDefinition[];
  public readonly warscroll: WarscrollDefinition;
  public readonly objectiveCards: readonly CardDefinition[];
  public readonly powerCards: readonly CardDefinition[];

  public constructor(
    id: WarbandDefinitionId,
    name: string,
    fighters: readonly FighterDefinition[],
    warscroll: WarscrollDefinition,
    objectiveCards: readonly CardDefinition[],
    powerCards: readonly CardDefinition[],
  ) {
    this.id = id;
    this.name = name;
    this.fighters = fighters;
    this.warscroll = warscroll;
    this.objectiveCards = objectiveCards;
    this.powerCards = powerCards;
  }
}
