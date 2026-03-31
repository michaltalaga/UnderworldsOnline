import { EndPhaseActionKind } from "../values/enums";
import { EndPhaseAction } from "./EndPhaseAction";

export class ResolveDrawObjectivesAction extends EndPhaseAction {
  public constructor() {
    super(EndPhaseActionKind.ResolveDrawObjectives);
  }
}
