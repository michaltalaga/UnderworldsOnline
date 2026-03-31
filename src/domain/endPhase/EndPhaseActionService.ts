import { Game } from "../state/Game";
import { EndPhaseStep, Phase } from "../values/enums";
import { EndPhaseAction } from "./EndPhaseAction";
import { ResolveDiscardCardsAction } from "./ResolveDiscardCardsAction";
import { ResolveDrawObjectivesAction } from "./ResolveDrawObjectivesAction";
import { ResolveDrawPowerCardsAction } from "./ResolveDrawPowerCardsAction";
import { ResolveEquipUpgradesAction } from "./ResolveEquipUpgradesAction";
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
        return [new ResolveEquipUpgradesAction()];
      case EndPhaseStep.DiscardCards:
        return [new ResolveDiscardCardsAction()];
      case EndPhaseStep.DrawObjectives:
        return [new ResolveDrawObjectivesAction()];
      case EndPhaseStep.DrawPowerCards:
        return [new ResolveDrawPowerCardsAction()];
      case EndPhaseStep.Cleanup:
        return [];
      default: {
        const exhaustiveStep: never = game.endPhaseStep;
        throw new Error(`Unsupported end phase step ${exhaustiveStep}.`);
      }
    }
  }
}
