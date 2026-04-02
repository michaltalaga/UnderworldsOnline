import type { Phase, TurnStep } from "../values/enums";
import type { PlayerId } from "../values/ids";

export class PassResolution {
  public readonly playerId: PlayerId;
  public readonly playerName: string;
  public readonly stepPassed: TurnStep;
  public readonly phaseAfterPass: Phase;
  public readonly consecutivePassesBefore: number;
  public readonly consecutivePassesAfter: number;
  public readonly turnsTakenThisRoundBefore: number;
  public readonly turnsTakenThisRoundAfter: number;
  public readonly nextActivePlayerId: PlayerId | null;
  public readonly nextActivePlayerName: string | null;
  public readonly nextTurnStep: TurnStep | null;
  public readonly roundEnded: boolean;

  public constructor(
    playerId: PlayerId,
    playerName: string,
    stepPassed: TurnStep,
    phaseAfterPass: Phase,
    consecutivePassesBefore: number,
    consecutivePassesAfter: number,
    turnsTakenThisRoundBefore: number,
    turnsTakenThisRoundAfter: number,
    nextActivePlayerId: PlayerId | null,
    nextActivePlayerName: string | null,
    nextTurnStep: TurnStep | null,
    roundEnded: boolean,
  ) {
    this.playerId = playerId;
    this.playerName = playerName;
    this.stepPassed = stepPassed;
    this.phaseAfterPass = phaseAfterPass;
    this.consecutivePassesBefore = consecutivePassesBefore;
    this.consecutivePassesAfter = consecutivePassesAfter;
    this.turnsTakenThisRoundBefore = turnsTakenThisRoundBefore;
    this.turnsTakenThisRoundAfter = turnsTakenThisRoundAfter;
    this.nextActivePlayerId = nextActivePlayerId;
    this.nextActivePlayerName = nextActivePlayerName;
    this.nextTurnStep = nextTurnStep;
    this.roundEnded = roundEnded;
  }
}
