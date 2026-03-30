import { DeckKind } from "../values/enums";
import { CardInstance } from "./CardInstance";

export class DeckState {
  public readonly kind: DeckKind;
  public drawPile: CardInstance[];
  public discardPile: CardInstance[];

  public constructor(kind: DeckKind, drawPile: CardInstance[] = [], discardPile: CardInstance[] = []) {
    this.kind = kind;
    this.drawPile = drawPile;
    this.discardPile = discardPile;
  }
}
