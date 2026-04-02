import type { CardDefinitionId } from "../values/ids";
import { CardKind } from "../values/enums";
import type { ObjectiveCondition } from "./ObjectiveCondition";
import type { PloyEffect } from "./PloyEffect";

export class CardDefinition {
  public readonly id: CardDefinitionId;
  public readonly kind: CardKind;
  public readonly name: string;
  public readonly text: string;
  public readonly gloryValue: number;
  public readonly ployEffects: readonly PloyEffect[];
  public readonly objectiveConditions: readonly ObjectiveCondition[];

  public constructor(
    id: CardDefinitionId,
    kind: CardKind,
    name: string,
    text: string,
    gloryValue: number = 0,
    ployEffects: readonly PloyEffect[] = [],
    objectiveConditions: readonly ObjectiveCondition[] = [],
  ) {
    this.id = id;
    this.kind = kind;
    this.name = name;
    this.text = text;
    this.gloryValue = gloryValue;
    this.ployEffects = ployEffects;
    this.objectiveConditions = objectiveConditions;
  }
}
