import type { Phase, TurnStep } from "../values/enums";
import type { PlayerId } from "../values/ids";
import type { GameState } from "../state/GameState";
import type { Player } from "../state/Player";

export class TurnEndedResolution {
  public readonly roundNumber: number;
  public readonly player: Player;
  public readonly completedPlayerTurnNumber: number;
  public readonly completedRoundTurnNumber: number;
  public readonly nextStateKind: GameState["kind"];
  public readonly nextPhase: Phase;
  public readonly nextTurnStep: TurnStep | null;
  public readonly nextActivePlayer: Player | null;
  public readonly roundEnded: boolean;

  public constructor(
    roundNumber: number,
    player: Player,
    completedPlayerTurnNumber: number,
    completedRoundTurnNumber: number,
    nextStateKind: GameState["kind"],
    nextPhase: Phase,
    nextTurnStep: TurnStep | null,
    nextActivePlayer: Player | null,
    roundEnded: boolean,
  ) {
    this.roundNumber = roundNumber;
    this.player = player;
    this.completedPlayerTurnNumber = completedPlayerTurnNumber;
    this.completedRoundTurnNumber = completedRoundTurnNumber;
    this.nextStateKind = nextStateKind;
    this.nextPhase = nextPhase;
    this.nextTurnStep = nextTurnStep;
    this.nextActivePlayer = nextActivePlayer;
    this.roundEnded = roundEnded;
  }

  public get playerId(): PlayerId { return this.player.id; }
  public get playerName(): string { return this.player.name; }
  public get nextActivePlayerId(): PlayerId | null { return this.nextActivePlayer?.id ?? null; }
  public get nextActivePlayerName(): string | null { return this.nextActivePlayer?.name ?? null; }
}
