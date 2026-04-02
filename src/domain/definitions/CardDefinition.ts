import type { CardDefinitionId } from "../values/ids";
import { CardKind } from "../values/enums";
import type { PloyEffect } from "./PloyEffect";
import type { ObjectiveRule } from "../rules/objectives/ObjectiveRule";

export class CardDefinition {
  public readonly id: CardDefinitionId;
  public readonly kind: CardKind;
  public readonly name: string;
  public readonly text: string;
  public readonly gloryValue: number;
  public readonly ployEffects: readonly PloyEffect[];
  public readonly objectiveRule: ObjectiveRule | null;

  public constructor(
    id: CardDefinitionId,
    kind: CardKind,
    name: string,
    text: string,
    gloryValue: number = 0,
    ployEffects: readonly PloyEffect[] = [],
    objectiveRule: ObjectiveRule | null = null,
  ) {
    this.id = id;
    this.kind = kind;
    this.name = name;
    this.text = text;
    this.gloryValue = gloryValue;
    this.ployEffects = ployEffects;
    this.objectiveRule = objectiveRule;
  }
}
