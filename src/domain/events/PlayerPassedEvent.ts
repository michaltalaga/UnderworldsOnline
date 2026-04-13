import type { GameActionKind, Phase, TurnStep } from "../values/enums";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export class PlayerPassedEvent extends GameEvent {
  public readonly player: Player;
  public readonly stepPassed: TurnStep;
  public readonly phaseAfterPass: Phase;
  public readonly consecutivePassesBefore: number;
  public readonly consecutivePassesAfter: number;
  public readonly turnsTakenThisRoundBefore: number;
  public readonly turnsTakenThisRoundAfter: number;
  public readonly nextActivePlayer: Player | null;
  public readonly nextTurnStep: TurnStep | null;
  public readonly roundEnded: boolean;

  public constructor(
    roundNumber: number,
    player: Player,
    stepPassed: TurnStep,
    phaseAfterPass: Phase,
    consecutivePassesBefore: number,
    consecutivePassesAfter: number,
    turnsTakenThisRoundBefore: number,
    turnsTakenThisRoundAfter: number,
    nextActivePlayer: Player | null,
    nextTurnStep: TurnStep | null,
    roundEnded: boolean,
    actionKind: GameActionKind,
  ) {
    super(roundNumber, player, null, null, actionKind);
    this.player = player;
    this.stepPassed = stepPassed;
    this.phaseAfterPass = phaseAfterPass;
    this.consecutivePassesBefore = consecutivePassesBefore;
    this.consecutivePassesAfter = consecutivePassesAfter;
    this.turnsTakenThisRoundBefore = turnsTakenThisRoundBefore;
    this.turnsTakenThisRoundAfter = turnsTakenThisRoundAfter;
    this.nextActivePlayer = nextActivePlayer;
    this.nextTurnStep = nextTurnStep;
    this.roundEnded = roundEnded;
  }
}
