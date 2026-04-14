import type { Card } from "../cards/Card";
import type { FeatureToken } from "./FeatureToken";
import type { HexCell } from "./HexCell";
import type { Territory } from "./Territory";
import type { FighterId, GameId, PlayerId } from "../values/ids";
import { EndPhaseStep, Phase, SetupStep, TurnStep } from "../values/enums";
import { Board } from "./Board";
import { Fighter } from "./Fighter";
import { GameEventLog } from "./GameEventLog";
import {
  type GameRecord,
  type GameRecordDataByKind,
  type GameRecordKind,
  type GameEventMetadata,
} from "./GameRecord";
import {
  canTransitionGameState,
  createSetupMusterWarbandsGameState,
  type GameState,
} from "./GameState";
import { Player } from "./Player";
import { GameEvent } from "../events/GameEvent";

/** Constructor type used for instanceof-based event queries. */
type EventConstructor<T extends GameEvent> = abstract new (...args: any[]) => T;

export class Game {
  public readonly id: GameId;
  public board: Board;
  public players: Player[];
  public roundNumber: number;
  public maxRounds: number;
  public consecutivePasses: number;
  public winnerPlayerId: PlayerId | null;
  public records: GameRecord[];
  public eventLog: string[];
  public readonly gameEvents: GameEvent[] = [];
  private flowState: GameState;

  public constructor(
    id: GameId,
    board: Board,
    players: Player[] = [],
    roundNumber: number = 1,
    maxRounds: number = 3,
    consecutivePasses: number = 0,
    winnerPlayerId: PlayerId | null = null,
    records: GameRecord[] = [],
    eventLog: string[] = [],
  ) {
    this.id = id;
    this.board = board;
    this.players = players;
    this.roundNumber = roundNumber;
    this.maxRounds = maxRounds;
    this.consecutivePasses = consecutivePasses;
    this.winnerPlayerId = winnerPlayerId;
    this.records = records;
    this.eventLog = eventLog;
    this.flowState = createSetupMusterWarbandsGameState();
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
    return this.flowState.activePlayer?.id ?? null;
  }

  public get firstPlayerId(): PlayerId | null {
    return this.flowState.firstPlayer?.id ?? null;
  }

  public get priorityPlayerId(): PlayerId | null {
    return this.flowState.priorityPlayer?.id ?? null;
  }

  /** Active player ref. */
  public get activePlayer(): Player | null {
    return this.flowState.activePlayer;
  }

  /** First player ref. */
  public get firstPlayer(): Player | null {
    return this.flowState.firstPlayer;
  }

  /** Priority player ref. */
  public get priorityPlayer(): Player | null {
    return this.flowState.priorityPlayer;
  }

  /** Winner player ref, derived from winnerPlayerId. */
  public get winner(): Player | null {
    return this.winnerPlayerId === null
      ? null
      : this.players.find((p) => p.id === this.winnerPlayerId) ?? null;
  }

  /** Opponent of the given player — derived from players list. */
  public opponentOf(player: Player): Player | null {
    return this.players.find((p) => p !== player) ?? null;
  }

  public get events(): readonly GameRecord[] {
    return this.records;
  }

  public getPlayer(playerId: PlayerId): Player | undefined {
    return this.players.find((player) => player.id === playerId);
  }

  public getOpponent(playerId: PlayerId): Player | undefined {
    return this.players.find((player) => player.id !== playerId);
  }

  public getFighter(fighterId: FighterId): Fighter | undefined {
    return this.players
      .flatMap((player) => player.fighters)
      .find((fighter) => fighter.id === fighterId);
  }

  public getCard(cardId: string): Card | undefined {
    return this.players
      .flatMap((player) => player.getAllCards())
      .find((card) => card.id === cardId);
  }

  public isFinalRound(): boolean {
    return this.roundNumber >= this.maxRounds;
  }

  // --- State queries (eliminate game.state.kind checks) ---

  public isInCombatTurn(): boolean {
    return this.flowState.kind === "combatTurn";
  }

  public isCombatReady(): boolean {
    return this.flowState.kind === "combatReady";
  }

  public isCombatActionStep(playerId: PlayerId): boolean {
    return this.isInCombatTurn() && this.turnStep === TurnStep.Action && this.activePlayerId === playerId;
  }

  public isCombatPowerStep(playerId: PlayerId): boolean {
    return this.isInCombatTurn() && this.turnStep === TurnStep.Power && this.activePlayerId === playerId;
  }

  // --- Board delegation (eliminate game.board.* chains) ---

  public getFighterHex(fighter: Fighter): HexCell | undefined {
    return fighter.currentHex ?? undefined;
  }

  public getNeighbors(hex: HexCell): HexCell[] {
    return this.board.getNeighbors(hex);
  }

  public getDistance(a: HexCell, b: HexCell): number {
    return this.board.getDistance(a, b);
  }

  public areAdjacent(a: HexCell, b: HexCell): boolean {
    return this.board.areAdjacent(a, b);
  }

  public get featureTokens(): readonly FeatureToken[] {
    return this.board.featureTokens;
  }

  public get territories(): readonly Territory[] {
    return this.board.territories;
  }

  public transitionTo(nextState: GameState): void {
    if (!canTransitionGameState(this.flowState, nextState)) {
      throw new Error(`Invalid game state transition from ${this.flowState.kind} to ${nextState.kind}.`);
    }

    this.flowState = nextState;
  }

  public addRecord<TKind extends GameRecordKind>(
    kind: TKind,
    data: GameRecordDataByKind[TKind],
    metadata: GameEventMetadata = {},
  ): void {
    this.records.push({
      kind,
      roundNumber: metadata.roundNumber ?? this.roundNumber,
      invokedByPlayer: metadata.invokedByPlayer ?? null,
      invokedByFighter: metadata.invokedByFighter ?? null,
      invokedByCard: metadata.invokedByCard ?? null,
      actionKind: metadata.actionKind ?? null,
      data,
    });
  }

  public addEvent<TKind extends GameRecordKind>(
    kind: TKind,
    data: GameRecordDataByKind[TKind],
    metadata: GameEventMetadata = {},
  ): void {
    this.addRecord(kind, data, metadata);
  }

  public getLatestEvent<TKind extends GameRecordKind>(
    kind: TKind,
  ): GameRecord<TKind> | null {
    for (let index = this.records.length - 1; index >= 0; index -= 1) {
      const event = this.records[index];
      if (event.kind === kind) {
        return event as GameRecord<TKind>;
      }
    }

    return null;
  }

  public getEventHistory<TKind extends GameRecordKind>(
    kind: TKind,
  ): GameRecord<TKind>[] {
    return this.records.flatMap((event) =>
      event.kind === kind ? [event as GameRecord<TKind>] : [],
    );
  }

  public getLatestRecord<TKind extends GameRecordKind>(
    kind: TKind,
  ): GameRecordDataByKind[TKind] | null {
    return this.getLatestEvent(kind)?.data ?? null;
  }

  public getRecordHistory<TKind extends GameRecordKind>(
    kind: TKind,
  ): GameRecordDataByKind[TKind][] {
    return this.getEventHistory(kind).map((event) => event.data);
  }

  public getEventLogState(): GameEventLog {
    return new GameEventLog(this.records);
  }

  // --- New event system (instanceof-based, object references) ---

  public emitEvent(event: GameEvent): void {
    this.gameEvents.push(event);
  }

  /** Get the most recent event of the given class, or null. */
  public getLatestEventOfType<T extends GameEvent>(
    eventType: EventConstructor<T>,
  ): T | null {
    for (let i = this.gameEvents.length - 1; i >= 0; i--) {
      const event = this.gameEvents[i];
      if (event instanceof eventType) {
        return event as T;
      }
    }
    return null;
  }

  /** Get all events of the given class, in chronological order. */
  public getEventsOfType<T extends GameEvent>(
    eventType: EventConstructor<T>,
  ): T[] {
    return this.gameEvents.filter(
      (e): e is T => e instanceof eventType,
    );
  }

  /** Get the most recent event of the given class that occurred after `afterEvent`, or null. */
  public getLatestEventAfter<T extends GameEvent>(
    afterEvent: GameEvent,
    eventType: EventConstructor<T>,
  ): T | null {
    const afterIndex = this.gameEvents.indexOf(afterEvent);
    if (afterIndex === -1) return null;
    for (let i = this.gameEvents.length - 1; i > afterIndex; i--) {
      const event = this.gameEvents[i];
      if (event instanceof eventType) {
        return event as T;
      }
    }
    return null;
  }

  /** Get all events that occurred in the current round. */
  public getEventsThisRound(): GameEvent[] {
    return this.gameEvents.filter((e) => e.roundNumber === this.roundNumber);
  }

  /** Get all events of the given class that occurred in the current round. */
  public getEventsOfTypeThisRound<T extends GameEvent>(
    eventType: EventConstructor<T>,
  ): T[] {
    return this.gameEvents.filter(
      (e): e is T => e instanceof eventType && e.roundNumber === this.roundNumber,
    );
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
      events: this.records,
      records: this.records,
      eventLog: this.eventLog,
    };
  }
}
