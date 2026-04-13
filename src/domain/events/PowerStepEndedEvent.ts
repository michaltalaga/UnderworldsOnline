import type { Phase, TurnStep } from "../values/enums";
import type { GameState } from "../state/GameState";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export class PowerStepEndedEvent extends GameEvent {
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
    super(roundNumber, player, null, null, null);
    this.player = player;
    this.completedPlayerTurnNumber = completedPlayerTurnNumber;
    this.completedRoundTurnNumber = completedRoundTurnNumber;
    this.nextStateKind = nextStateKind;
    this.nextPhase = nextPhase;
    this.nextTurnStep = nextTurnStep;
    this.nextActivePlayer = nextActivePlayer;
    this.roundEnded = roundEnded;
  }
}
