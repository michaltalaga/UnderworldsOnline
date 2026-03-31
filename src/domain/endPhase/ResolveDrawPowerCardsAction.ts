import { EndPhaseActionKind } from "../values/enums";
import { EndPhaseAction } from "./EndPhaseAction";

export class ResolveDrawPowerCardsAction extends EndPhaseAction {
  public constructor() {
    super(EndPhaseActionKind.ResolveDrawPowerCards);
  }
}
