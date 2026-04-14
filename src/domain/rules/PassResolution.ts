import type { Phase, TurnStep } from "../values/enums";
import type { PlayerId } from "../values/ids";
import type { Player } from "../state/Player";

export class PassResolution {
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
  ) {
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

  public get playerId(): PlayerId { return this.player.id; }
  public get playerName(): string { return this.player.name; }
  public get nextActivePlayerId(): PlayerId | null { return this.nextActivePlayer?.id ?? null; }
  public get nextActivePlayerName(): string | null { return this.nextActivePlayer?.name ?? null; }
}
