import type { PlayerId } from "../values/ids";

export class ActionStepStartedResolution {
  public readonly roundNumber: number;
  public readonly playerId: PlayerId;
  public readonly playerName: string;
  public readonly playerTurnNumber: number;
  public readonly roundTurnNumber: number;
  public readonly isFirstActionStepOfRound: boolean;

  public constructor(
    roundNumber: number,
    playerId: PlayerId,
    playerName: string,
    playerTurnNumber: number,
    roundTurnNumber: number,
    isFirstActionStepOfRound: boolean,
  ) {
    this.roundNumber = roundNumber;
    this.playerId = playerId;
    this.playerName = playerName;
    this.playerTurnNumber = playerTurnNumber;
    this.roundTurnNumber = roundTurnNumber;
    this.isFirstActionStepOfRound = isFirstActionStepOfRound;
  }
}
