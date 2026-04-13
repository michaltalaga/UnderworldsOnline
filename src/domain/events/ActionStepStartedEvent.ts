import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export class ActionStepStartedEvent extends GameEvent {
  public readonly player: Player;
  public readonly playerTurnNumber: number;
  public readonly roundTurnNumber: number;
  public readonly isFirstActionStepOfRound: boolean;

  public constructor(
    roundNumber: number,
    player: Player,
    playerTurnNumber: number,
    roundTurnNumber: number,
    isFirstActionStepOfRound: boolean,
  ) {
    super(roundNumber, player, null, null, null);
    this.player = player;
    this.playerTurnNumber = playerTurnNumber;
    this.roundTurnNumber = roundTurnNumber;
    this.isFirstActionStepOfRound = isFirstActionStepOfRound;
  }
}
