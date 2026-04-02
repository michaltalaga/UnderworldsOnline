import type { CardId, FighterId, GameId, PlayerId } from "../values/ids";
import { EndPhaseStep, Phase, SetupStep, TurnStep } from "../values/enums";
import { BoardState } from "./BoardState";
import { CardInstance } from "./CardInstance";
import { FighterState } from "./FighterState";
import { GameEventLogState } from "./GameEventLogState";
import {
  type GameRecord,
  type GameRecordDataByKind,
  type GameRecordKind,
  type GameEventMetadata,
} from "./GameRecord";
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
  public records: GameRecord[];
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

  public get events(): readonly GameRecord[] {
    return this.records;
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

  public addRecord<TKind extends GameRecordKind>(
    kind: TKind,
    data: GameRecordDataByKind[TKind],
    metadata: GameEventMetadata = {},
  ): void {
    this.records.push({
      kind,
      roundNumber: metadata.roundNumber ?? this.roundNumber,
      invokedByPlayerId: metadata.invokedByPlayerId ?? null,
      invokedByFighterId: metadata.invokedByFighterId ?? null,
      invokedByCardId: metadata.invokedByCardId ?? null,
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

  public getEventLogState(batchStartIndex: number = 0): GameEventLogState {
    return new GameEventLogState(this.records, batchStartIndex);
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
