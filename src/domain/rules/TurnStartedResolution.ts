import type { PlayerId } from "../values/ids";

export class TurnStartedResolution {
  public readonly roundNumber: number;
  public readonly playerId: PlayerId;
  public readonly playerName: string;
  public readonly playerTurnNumber: number;
  public readonly roundTurnNumber: number;
  public readonly isFirstTurnOfRound: boolean;

  public constructor(
    roundNumber: number,
    playerId: PlayerId,
    playerName: string,
    playerTurnNumber: number,
    roundTurnNumber: number,
    isFirstTurnOfRound: boolean,
  ) {
    this.roundNumber = roundNumber;
    this.playerId = playerId;
    this.playerName = playerName;
    this.playerTurnNumber = playerTurnNumber;
    this.roundTurnNumber = roundTurnNumber;
    this.isFirstTurnOfRound = isFirstTurnOfRound;
  }
}
