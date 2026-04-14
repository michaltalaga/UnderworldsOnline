import type { GameOutcomeKind } from "../values/enums";
import type { FighterId, PlayerId } from "../values/ids";
import type { Player } from "../state/Player";

export const CleanupTransitionKind = {
  CombatReady: "combatReady",
  Finished: "finished",
} as const;

export type CleanupTransitionKind = (typeof CleanupTransitionKind)[keyof typeof CleanupTransitionKind];

export type CleanupFighterResolution = {
  fighterId: FighterId;
  fighterName: string;
  clearedMoveToken: boolean;
  clearedChargeToken: boolean;
  clearedGuardToken: boolean;
  clearedTokenCount: number;
};

export type CleanupPlayerResolution = {
  playerId: PlayerId;
  playerName: string;
  turnsTakenBeforeReset: number;
  hadDelvedThisPowerStepBeforeReset: boolean;
  fightersWithTokensCleared: readonly CleanupFighterResolution[];
};

export class CleanupResolution {
  public readonly completedRoundNumber: number;
  public readonly consecutivePassesBeforeReset: number;
  public readonly playerResolutions: readonly CleanupPlayerResolution[];
  public readonly totalTokensCleared: number;
  public readonly nextStateKind: CleanupTransitionKind;
  public readonly nextRoundNumber: number | null;
  public readonly outcomeKind: GameOutcomeKind | null;
  public readonly winner: Player | null;
  public readonly outcomeReason: string | null;

  public constructor(
    completedRoundNumber: number,
    consecutivePassesBeforeReset: number,
    playerResolutions: readonly CleanupPlayerResolution[],
    nextStateKind: CleanupTransitionKind,
    nextRoundNumber: number | null,
    outcomeKind: GameOutcomeKind | null = null,
    winner: Player | null = null,
    outcomeReason: string | null = null,
  ) {
    this.completedRoundNumber = completedRoundNumber;
    this.consecutivePassesBeforeReset = consecutivePassesBeforeReset;
    this.playerResolutions = playerResolutions;
    this.totalTokensCleared = playerResolutions.reduce(
      (total, playerResolution) => total + playerResolution.fightersWithTokensCleared.reduce(
        (playerTotal, fighterResolution) => playerTotal + fighterResolution.clearedTokenCount,
        0,
      ),
      0,
    );
    this.nextStateKind = nextStateKind;
    this.nextRoundNumber = nextRoundNumber;
    this.outcomeKind = outcomeKind;
    this.winner = winner;
    this.outcomeReason = outcomeReason;
  }

  public get winnerPlayerId(): PlayerId | null { return this.winner?.id ?? null; }
}
