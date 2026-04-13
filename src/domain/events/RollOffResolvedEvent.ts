import type { RollOffKind } from "../values/enums";
import type { RollOffRound } from "../rules/RollOffRound";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export class RollOffResolvedEvent extends GameEvent {
  public readonly kind: RollOffKind;
  public readonly playerOne: Player;
  public readonly playerTwo: Player;
  public readonly rounds: readonly RollOffRound[];
  public readonly decisiveRound: RollOffRound;
  public readonly winner: Player;
  public readonly loser: Player;
  public readonly resolvedByTieBreaker: boolean;

  public constructor(
    roundNumber: number,
    rollOffKind: RollOffKind,
    playerOne: Player,
    playerTwo: Player,
    rounds: readonly RollOffRound[],
    decisiveRound: RollOffRound,
    winner: Player,
    loser: Player,
    resolvedByTieBreaker: boolean,
  ) {
    super(roundNumber, null, null, null, null);
    this.kind = rollOffKind;
    this.playerOne = playerOne;
    this.playerTwo = playerTwo;
    this.rounds = rounds;
    this.decisiveRound = decisiveRound;
    this.winner = winner;
    this.loser = loser;
    this.resolvedByTieBreaker = resolvedByTieBreaker;
  }
}
