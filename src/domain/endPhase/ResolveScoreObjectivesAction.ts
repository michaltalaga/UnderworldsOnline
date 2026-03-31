import { EndPhaseActionKind } from "../values/enums";
import { EndPhaseAction } from "./EndPhaseAction";

export class ResolveScoreObjectivesAction extends EndPhaseAction {
  public constructor() {
    super(EndPhaseActionKind.ResolveScoreObjectives);
  }
}
