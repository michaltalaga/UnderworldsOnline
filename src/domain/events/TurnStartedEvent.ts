import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export class TurnStartedEvent extends GameEvent {
  public readonly player: Player;
  public readonly playerTurnNumber: number;
  public readonly roundTurnNumber: number;
  public readonly isFirstTurnOfRound: boolean;

  public constructor(
    roundNumber: number,
    player: Player,
    playerTurnNumber: number,
    roundTurnNumber: number,
    isFirstTurnOfRound: boolean,
  ) {
    super(roundNumber, player, null, null, null);
    this.player = player;
    this.playerTurnNumber = playerTurnNumber;
    this.roundTurnNumber = roundTurnNumber;
    this.isFirstTurnOfRound = isFirstTurnOfRound;
  }
}
