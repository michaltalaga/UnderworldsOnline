import type { GameOutcomeKind } from "../values/enums";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export type CleanupTransitionKind = "combatReady" | "finished";

export type CleanupFighterSnapshot = {
  readonly fighter: Fighter;
  readonly clearedMoveToken: boolean;
  readonly clearedChargeToken: boolean;
  readonly clearedGuardToken: boolean;
  readonly clearedTokenCount: number;
};

export type CleanupPlayerSnapshot = {
  readonly player: Player;
  readonly turnsTakenBeforeReset: number;
  readonly hadDelvedThisPowerStepBeforeReset: boolean;
  readonly fightersWithTokensCleared: readonly CleanupFighterSnapshot[];
};

export class CleanupEvent extends GameEvent {
  public readonly completedRoundNumber: number;
  public readonly consecutivePassesBeforeReset: number;
  public readonly playerResolutions: readonly CleanupPlayerSnapshot[];
  public readonly totalTokensCleared: number;
  public readonly nextStateKind: CleanupTransitionKind;
  public readonly nextRoundNumber: number | null;
  public readonly outcomeKind: GameOutcomeKind | null;
  public readonly winner: Player | null;
  public readonly outcomeReason: string | null;

  public constructor(
    roundNumber: number,
    completedRoundNumber: number,
    consecutivePassesBeforeReset: number,
    playerResolutions: readonly CleanupPlayerSnapshot[],
    nextStateKind: CleanupTransitionKind,
    nextRoundNumber: number | null,
    outcomeKind: GameOutcomeKind | null = null,
    winner: Player | null = null,
    outcomeReason: string | null = null,
  ) {
    super(roundNumber, null, null, null, null);
    this.completedRoundNumber = completedRoundNumber;
    this.consecutivePassesBeforeReset = consecutivePassesBeforeReset;
    this.playerResolutions = playerResolutions;
    this.totalTokensCleared = playerResolutions.reduce(
      (sum, r) => sum + r.fightersWithTokensCleared.reduce((s, f) => s + f.clearedTokenCount, 0), 0,
    );
    this.nextStateKind = nextStateKind;
    this.nextRoundNumber = nextRoundNumber;
    this.outcomeKind = outcomeKind;
    this.winner = winner;
    this.outcomeReason = outcomeReason;
  }
}
