import { Game } from "../state/Game";
import { EndPhaseStep, Phase } from "../values/enums";
import { EndPhaseAction } from "./EndPhaseAction";
import { ResolveScoreObjectivesAction } from "./ResolveScoreObjectivesAction";

export class EndPhaseActionService {
  public getLegalActions(game: Game): EndPhaseAction[] {
    if (game.phase !== Phase.End || game.endPhaseStep === null) {
      return [];
    }

    switch (game.endPhaseStep) {
      case EndPhaseStep.ScoreObjectives:
        return [new ResolveScoreObjectivesAction()];
      case EndPhaseStep.EquipUpgrades:
      case EndPhaseStep.DiscardCards:
      case EndPhaseStep.DrawObjectives:
      case EndPhaseStep.DrawPowerCards:
      case EndPhaseStep.Cleanup:
        return [];
      default: {
        const exhaustiveStep: never = game.endPhaseStep;
        throw new Error(`Unsupported end phase step ${exhaustiveStep}.`);
      }
    }
  }
}
