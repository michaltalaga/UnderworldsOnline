import { GameRecordKind } from "../../state/GameRecord";
import { ObjectiveConditionTiming } from "../../values/enums";
import type { PlayerId } from "../../values/ids";
import type { Game } from "../../state/Game";
import { ObjectiveRule } from "./ObjectiveRule";

export class PracticeObjective01Rule extends ObjectiveRule {
  public constructor() {
    super("card-def:setup-practice:objective:01", ObjectiveConditionTiming.Immediate);
  }

  public override canScore(game: Game, playerId: PlayerId): boolean {
    const latestCombat = game.getLatestRecord(GameRecordKind.Combat);
    if (latestCombat === null || latestCombat.context.attackerPlayerId !== playerId) {
      return false;
    }

    return latestCombat.attackRoll.length > 0 && latestCombat.attackSuccesses === latestCombat.attackRoll.length;
  }
}
