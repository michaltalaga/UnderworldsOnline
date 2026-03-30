import type { PlayerId } from "../values/ids";
import { RollOffContext } from "./RollOffContext";
import { RollOffRound } from "./RollOffRound";

export class RollOffResult {
  public readonly context: RollOffContext;
  public readonly rounds: readonly RollOffRound[];
  public readonly decisiveRound: RollOffRound;
  public readonly winnerPlayerId: PlayerId;
  public readonly loserPlayerId: PlayerId;
  public readonly resolvedByTieBreaker: boolean;

  public constructor(
    context: RollOffContext,
    rounds: readonly RollOffRound[],
    decisiveRound: RollOffRound,
    winnerPlayerId: PlayerId,
    loserPlayerId: PlayerId,
    resolvedByTieBreaker: boolean,
  ) {
    this.context = context;
    this.rounds = rounds;
    this.decisiveRound = decisiveRound;
    this.winnerPlayerId = winnerPlayerId;
    this.loserPlayerId = loserPlayerId;
    this.resolvedByTieBreaker = resolvedByTieBreaker;
  }
}
