import { GameRecordKind } from "../../state/GameRecord";
import { ObjectiveConditionTiming } from "../../values/enums";
import type { PlayerId } from "../../values/ids";
import type { Game } from "../../state/Game";
import { ObjectiveRule } from "./ObjectiveRule";

export class PracticeObjective02Rule extends ObjectiveRule {
  public constructor() {
    super("card-def:setup-practice:objective:02", ObjectiveConditionTiming.Immediate);
  }

  public override canScore(game: Game, playerId: PlayerId): boolean {
    const latestCombat = game.getLatestRecord(GameRecordKind.Combat);
    if (
      latestCombat === null ||
      latestCombat.context.attackerPlayerId !== playerId ||
      !latestCombat.targetSlain
    ) {
      return false;
    }

    const attackerPlayer = game.getPlayer(latestCombat.context.attackerPlayerId);
    const defenderPlayer = game.getPlayer(latestCombat.context.defenderPlayerId);
    const attackerDefinition = attackerPlayer?.getFighterDefinition(latestCombat.context.attackerFighterId);
    const targetDefinition = defenderPlayer?.getFighterDefinition(latestCombat.context.targetFighterId);
    if (attackerDefinition === undefined || targetDefinition === undefined) {
      return false;
    }

    return targetDefinition.isLeader || targetDefinition.health >= attackerDefinition.health;
  }
}
