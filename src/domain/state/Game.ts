import { CleanupResolution } from "../endPhase/CleanupResolution";
import type { CardId, FighterId, GameId, PlayerId } from "../values/ids";
import { ObjectiveDrawResolution } from "../endPhase/ObjectiveDrawResolution";
import { ObjectiveScoringResolution } from "../endPhase/ObjectiveScoringResolution";
import { PowerDrawResolution } from "../endPhase/PowerDrawResolution";
import { EndPhaseStep, Phase, SetupStep, TurnStep } from "../values/enums";
import { CombatResult } from "../rules/CombatResult";
import { PloyResolution } from "../rules/PloyResolution";
import { WarscrollAbilityResolution } from "../rules/WarscrollAbilityResolution";
import { BoardState } from "./BoardState";
import { CardInstance } from "./CardInstance";
import { FighterState } from "./FighterState";
import {
  canTransitionGameState,
  createGameStateFromLegacyFields,
  type GameState,
} from "./GameState";
import { PlayerState } from "./PlayerState";

export class Game {
  public readonly id: GameId;
  public board: BoardState;
  public players: PlayerState[];
  public roundNumber: number;
  public maxRounds: number;
  public consecutivePasses: number;
  public winnerPlayerId: PlayerId | null;
  public lastCombatResult: CombatResult | null;
  public combatHistory: CombatResult[];
  public lastPloyResolution: PloyResolution | null;
  public ployHistory: PloyResolution[];
  public lastWarscrollAbilityResolution: WarscrollAbilityResolution | null;
  public warscrollAbilityHistory: WarscrollAbilityResolution[];
  public lastObjectiveScoringResolution: ObjectiveScoringResolution | null;
  public objectiveScoringHistory: ObjectiveScoringResolution[];
  public lastObjectiveDrawResolution: ObjectiveDrawResolution | null;
  public objectiveDrawHistory: ObjectiveDrawResolution[];
  public lastPowerDrawResolution: PowerDrawResolution | null;
  public powerDrawHistory: PowerDrawResolution[];
  public lastCleanupResolution: CleanupResolution | null;
  public cleanupHistory: CleanupResolution[];
  public eventLog: string[];
  private flowState: GameState;

  public constructor(
    id: GameId,
    board: BoardState,
    players: PlayerState[] = [],
    roundNumber: number = 1,
    maxRounds: number = 3,
    phase: Phase = Phase.Setup,
    setupStep: SetupStep | null = SetupStep.MusterWarbands,
    turnStep: TurnStep | null = null,
    endPhaseStep: EndPhaseStep | null = null,
    activePlayerId: PlayerId | null = null,
    firstPlayerId: PlayerId | null = null,
    priorityPlayerId: PlayerId | null = null,
    consecutivePasses: number = 0,
    winnerPlayerId: PlayerId | null = null,
    lastCombatResult: CombatResult | null = null,
    eventLog: string[] = [],
  ) {
    this.id = id;
    this.board = board;
    this.players = players;
    this.roundNumber = roundNumber;
    this.maxRounds = maxRounds;
    this.consecutivePasses = consecutivePasses;
    this.winnerPlayerId = winnerPlayerId;
    this.lastCombatResult = lastCombatResult;
    this.combatHistory = [];
    this.lastPloyResolution = null;
    this.ployHistory = [];
    this.lastWarscrollAbilityResolution = null;
    this.warscrollAbilityHistory = [];
    this.lastObjectiveScoringResolution = null;
    this.objectiveScoringHistory = [];
    this.lastObjectiveDrawResolution = null;
    this.objectiveDrawHistory = [];
    this.lastPowerDrawResolution = null;
    this.powerDrawHistory = [];
    this.lastCleanupResolution = null;
    this.cleanupHistory = [];
    this.eventLog = eventLog;
    this.flowState = createGameStateFromLegacyFields({
      phase,
      setupStep,
      turnStep,
      endPhaseStep,
      activePlayerId,
      firstPlayerId,
      priorityPlayerId,
    });
  }

  public get state(): GameState {
    return this.flowState;
  }

  public get phase(): Phase {
    return this.flowState.phase;
  }

  public get setupStep(): SetupStep | null {
    return this.flowState.setupStep;
  }

  public get turnStep(): TurnStep | null {
    return this.flowState.turnStep;
  }

  public get endPhaseStep(): EndPhaseStep | null {
    return this.flowState.endPhaseStep;
  }

  public get activePlayerId(): PlayerId | null {
    return this.flowState.activePlayerId;
  }

  public get firstPlayerId(): PlayerId | null {
    return this.flowState.firstPlayerId;
  }

  public get priorityPlayerId(): PlayerId | null {
    return this.flowState.priorityPlayerId;
  }

  public getPlayer(playerId: PlayerId): PlayerState | undefined {
    return this.players.find((player) => player.id === playerId);
  }

  public getOpponent(playerId: PlayerId): PlayerState | undefined {
    return this.players.find((player) => player.id !== playerId);
  }

  public getFighter(fighterId: FighterId): FighterState | undefined {
    return this.players
      .flatMap((player) => player.fighters)
      .find((fighter) => fighter.id === fighterId);
  }

  public getCard(cardId: CardId): CardInstance | undefined {
    return this.players
      .flatMap((player) => player.getAllCards())
      .find((card) => card.id === cardId);
  }

  public isFinalRound(): boolean {
    return this.roundNumber >= this.maxRounds;
  }

  public transitionTo(nextState: GameState): void {
    if (!canTransitionGameState(this.flowState, nextState)) {
      throw new Error(`Invalid game state transition from ${this.flowState.kind} to ${nextState.kind}.`);
    }

    this.flowState = nextState;
  }

  public toJSON(): object {
    return {
      id: this.id,
      board: this.board,
      players: this.players,
      roundNumber: this.roundNumber,
      maxRounds: this.maxRounds,
      state: this.state,
      phase: this.phase,
      setupStep: this.setupStep,
      turnStep: this.turnStep,
      endPhaseStep: this.endPhaseStep,
      activePlayerId: this.activePlayerId,
      firstPlayerId: this.firstPlayerId,
      priorityPlayerId: this.priorityPlayerId,
      consecutivePasses: this.consecutivePasses,
      winnerPlayerId: this.winnerPlayerId,
      lastCombatResult: this.lastCombatResult,
      combatHistory: this.combatHistory,
      lastPloyResolution: this.lastPloyResolution,
      ployHistory: this.ployHistory,
      lastWarscrollAbilityResolution: this.lastWarscrollAbilityResolution,
      warscrollAbilityHistory: this.warscrollAbilityHistory,
      lastObjectiveScoringResolution: this.lastObjectiveScoringResolution,
      objectiveScoringHistory: this.objectiveScoringHistory,
      lastObjectiveDrawResolution: this.lastObjectiveDrawResolution,
      objectiveDrawHistory: this.objectiveDrawHistory,
      lastPowerDrawResolution: this.lastPowerDrawResolution,
      powerDrawHistory: this.powerDrawHistory,
      lastCleanupResolution: this.lastCleanupResolution,
      cleanupHistory: this.cleanupHistory,
      eventLog: this.eventLog,
    };
  }
}
