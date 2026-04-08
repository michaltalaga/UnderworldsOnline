import { AttackDieFace } from "../values/enums";
import type { PlayerId } from "../values/ids";
import { getAttackDieFaceRank } from "./Dice";
import { RollOffContext } from "./RollOffContext";
import { RollOffResult } from "./RollOffResult";
import { RollOffRound, type RollOffRoundInput } from "./RollOffRound";

export class RollOffResolver {
  public resolve(
    context: RollOffContext,
    rounds: readonly RollOffRoundInput[],
  ): RollOffResult {
    if (rounds.length === 0) {
      throw new Error("A roll-off requires at least one round of dice results.");
    }

    if (
      context.tieWinnerPlayerId !== null &&
      context.tieWinnerPlayerId !== context.playerOneId &&
      context.tieWinnerPlayerId !== context.playerTwoId
    ) {
      throw new Error("The tie winner must be one of the roll-off participants.");
    }

    const resolvedRounds: RollOffRound[] = [];

    for (const roundInput of rounds) {
      const round = new RollOffRound(
        context.playerOneId,
        roundInput.firstFace,
        context.playerTwoId,
        roundInput.secondFace,
      );
      resolvedRounds.push(round);

      const comparison = this.compareFaces(round.playerOneFace, round.playerTwoFace);
      if (comparison > 0) {
        return new RollOffResult(
          context,
          resolvedRounds,
          round,
          context.playerOneId,
          context.playerTwoId,
          false,
        );
      }

      if (comparison < 0) {
        return new RollOffResult(
          context,
          resolvedRounds,
          round,
          context.playerTwoId,
          context.playerOneId,
          false,
        );
      }

      if (context.tieWinnerPlayerId !== null) {
        return new RollOffResult(
          context,
          resolvedRounds,
          round,
          context.tieWinnerPlayerId,
          this.getOtherPlayerId(context, context.tieWinnerPlayerId),
          true,
        );
      }
    }

    throw new Error("The supplied roll-off rounds never produced a winner.");
  }

  private compareFaces(left: AttackDieFace, right: AttackDieFace): number {
    return getAttackDieFaceRank(left) - getAttackDieFaceRank(right);
  }

  private getOtherPlayerId(context: RollOffContext, playerId: PlayerId): PlayerId {
    return context.playerOneId === playerId ? context.playerTwoId : context.playerOneId;
  }
}
