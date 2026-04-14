import type { PlayerId } from "../values/ids";
import type { Player } from "../state/Player";

export class ActionStepStartedResolution {
  public readonly roundNumber: number;
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
    this.roundNumber = roundNumber;
    this.player = player;
    this.playerTurnNumber = playerTurnNumber;
    this.roundTurnNumber = roundTurnNumber;
    this.isFirstActionStepOfRound = isFirstActionStepOfRound;
  }

  public get playerId(): PlayerId { return this.player.id; }
  public get playerName(): string { return this.player.name; }
}
