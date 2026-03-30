import type { CardDefinitionId } from "../values/ids";
import { CardKind } from "../values/enums";

export class CardDefinition {
  public readonly id: CardDefinitionId;
  public readonly kind: CardKind;
  public readonly name: string;
  public readonly text: string;
  public readonly gloryValue: number;

  public constructor(
    id: CardDefinitionId,
    kind: CardKind,
    name: string,
    text: string,
    gloryValue: number = 0,
  ) {
    this.id = id;
    this.kind = kind;
    this.name = name;
    this.text = text;
    this.gloryValue = gloryValue;
  }
}
