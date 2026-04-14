import type { Phase, TurnStep } from "../values/enums";
import type { PlayerId } from "../values/ids";
import type { GameState } from "../state/GameState";
import type { Player } from "../state/Player";

export class ActionStepEndedResolution {
  public readonly roundNumber: number;
  public readonly player: Player;
  public readonly playerTurnNumber: number;
  public readonly roundTurnNumber: number;
  public readonly nextStateKind: GameState["kind"];
  public readonly nextPhase: Phase;
  public readonly nextTurnStep: TurnStep | null;
  public readonly nextActivePlayer: Player | null;

  public constructor(
    roundNumber: number,
    player: Player,
    playerTurnNumber: number,
    roundTurnNumber: number,
    nextStateKind: GameState["kind"],
    nextPhase: Phase,
    nextTurnStep: TurnStep | null,
    nextActivePlayer: Player | null,
  ) {
    this.roundNumber = roundNumber;
    this.player = player;
    this.playerTurnNumber = playerTurnNumber;
    this.roundTurnNumber = roundTurnNumber;
    this.nextStateKind = nextStateKind;
    this.nextPhase = nextPhase;
    this.nextTurnStep = nextTurnStep;
    this.nextActivePlayer = nextActivePlayer;
  }

  public get playerId(): PlayerId { return this.player.id; }
  public get playerName(): string { return this.player.name; }
  public get nextActivePlayerId(): PlayerId | null { return this.nextActivePlayer?.id ?? null; }
  public get nextActivePlayerName(): string | null { return this.nextActivePlayer?.name ?? null; }
}
