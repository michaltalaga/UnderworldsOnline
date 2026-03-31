import { EndPhaseActionKind } from "../values/enums";
import { EndPhaseAction } from "./EndPhaseAction";

export class ResolveCleanupAction extends EndPhaseAction {
  public constructor() {
    super(EndPhaseActionKind.ResolveCleanup);
  }
}
