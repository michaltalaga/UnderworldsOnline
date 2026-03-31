import { EndPhaseActionKind } from "../values/enums";
import { EndPhaseAction } from "./EndPhaseAction";

export class ResolveEquipUpgradesAction extends EndPhaseAction {
  public constructor() {
    super(EndPhaseActionKind.ResolveEquipUpgrades);
  }
}
