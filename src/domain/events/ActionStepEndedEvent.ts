import type { Phase, TurnStep } from "../values/enums";
import type { GameState } from "../state/GameState";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export class ActionStepEndedEvent extends GameEvent {
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
    super(roundNumber, player, null, null, null);
    this.player = player;
    this.playerTurnNumber = playerTurnNumber;
    this.roundTurnNumber = roundTurnNumber;
    this.nextStateKind = nextStateKind;
    this.nextPhase = nextPhase;
    this.nextTurnStep = nextTurnStep;
    this.nextActivePlayer = nextActivePlayer;
  }
}
