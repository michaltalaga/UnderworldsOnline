import type { Phase, TurnStep } from "../values/enums";
import type { PlayerId } from "../values/ids";
import type { GameState } from "../state/GameState";

export class ActionStepEndedResolution {
  public readonly roundNumber: number;
  public readonly playerId: PlayerId;
  public readonly playerName: string;
  public readonly playerTurnNumber: number;
  public readonly roundTurnNumber: number;
  public readonly nextStateKind: GameState["kind"];
  public readonly nextPhase: Phase;
  public readonly nextTurnStep: TurnStep | null;
  public readonly nextActivePlayerId: PlayerId | null;
  public readonly nextActivePlayerName: string | null;

  public constructor(
    roundNumber: number,
    playerId: PlayerId,
    playerName: string,
    playerTurnNumber: number,
    roundTurnNumber: number,
    nextStateKind: GameState["kind"],
    nextPhase: Phase,
    nextTurnStep: TurnStep | null,
    nextActivePlayerId: PlayerId | null,
    nextActivePlayerName: string | null,
  ) {
    this.roundNumber = roundNumber;
    this.playerId = playerId;
    this.playerName = playerName;
    this.playerTurnNumber = playerTurnNumber;
    this.roundTurnNumber = roundTurnNumber;
    this.nextStateKind = nextStateKind;
    this.nextPhase = nextPhase;
    this.nextTurnStep = nextTurnStep;
    this.nextActivePlayerId = nextActivePlayerId;
    this.nextActivePlayerName = nextActivePlayerName;
  }
}
