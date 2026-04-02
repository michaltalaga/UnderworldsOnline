import type { Phase, TurnStep } from "../values/enums";
import type { PlayerId } from "../values/ids";
import type { GameState } from "../state/GameState";

export class TurnEndedResolution {
  public readonly roundNumber: number;
  public readonly playerId: PlayerId;
  public readonly playerName: string;
  public readonly completedPlayerTurnNumber: number;
  public readonly completedRoundTurnNumber: number;
  public readonly nextStateKind: GameState["kind"];
  public readonly nextPhase: Phase;
  public readonly nextTurnStep: TurnStep | null;
  public readonly nextActivePlayerId: PlayerId | null;
  public readonly nextActivePlayerName: string | null;
  public readonly roundEnded: boolean;

  public constructor(
    roundNumber: number,
    playerId: PlayerId,
    playerName: string,
    completedPlayerTurnNumber: number,
    completedRoundTurnNumber: number,
    nextStateKind: GameState["kind"],
    nextPhase: Phase,
    nextTurnStep: TurnStep | null,
    nextActivePlayerId: PlayerId | null,
    nextActivePlayerName: string | null,
    roundEnded: boolean,
  ) {
    this.roundNumber = roundNumber;
    this.playerId = playerId;
    this.playerName = playerName;
    this.completedPlayerTurnNumber = completedPlayerTurnNumber;
    this.completedRoundTurnNumber = completedRoundTurnNumber;
    this.nextStateKind = nextStateKind;
    this.nextPhase = nextPhase;
    this.nextTurnStep = nextTurnStep;
    this.nextActivePlayerId = nextActivePlayerId;
    this.nextActivePlayerName = nextActivePlayerName;
    this.roundEnded = roundEnded;
  }
}
