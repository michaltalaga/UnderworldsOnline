import { EndPhaseActionKind } from "../values/enums";
import { EndPhaseAction } from "./EndPhaseAction";

export class ResolveDiscardCardsAction extends EndPhaseAction {
  public constructor() {
    super(EndPhaseActionKind.ResolveDiscardCards);
  }
}
