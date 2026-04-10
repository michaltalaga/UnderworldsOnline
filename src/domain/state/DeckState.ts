import { DeckKind } from "../values/enums";
import type { Card } from "../cards/Card";

export class DeckState {
  public readonly kind: DeckKind;
  public drawPile: Card[];
  public discardPile: Card[];

  public constructor(kind: DeckKind, drawPile: Card[] = [], discardPile: Card[] = []) {
    this.kind = kind;
    this.drawPile = drawPile;
    this.discardPile = discardPile;
  }
}
