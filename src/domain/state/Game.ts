import type { CardId, FighterId, GameId, PlayerId } from "../values/ids";
import { EndPhaseStep, Phase, SetupStep, TurnStep } from "../values/enums";
import { BoardState } from "./BoardState";
import { CardInstance } from "./CardInstance";
import { FighterState } from "./FighterState";
import { PlayerState } from "./PlayerState";

export class Game {
  public readonly id: GameId;
  public board: BoardState;
  public players: PlayerState[];
  public roundNumber: number;
  public maxRounds: number;
  public phase: Phase;
  public setupStep: SetupStep | null;
  public turnStep: TurnStep | null;
  public endPhaseStep: EndPhaseStep | null;
  public activePlayerId: PlayerId | null;
  public firstPlayerId: PlayerId | null;
  public priorityPlayerId: PlayerId | null;
  public consecutivePasses: number;
  public winnerPlayerId: PlayerId | null;
  public eventLog: string[];

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
    eventLog: string[] = [],
  ) {
    this.id = id;
    this.board = board;
    this.players = players;
    this.roundNumber = roundNumber;
    this.maxRounds = maxRounds;
    this.phase = phase;
    this.setupStep = setupStep;
    this.turnStep = turnStep;
    this.endPhaseStep = endPhaseStep;
    this.activePlayerId = activePlayerId;
    this.firstPlayerId = firstPlayerId;
    this.priorityPlayerId = priorityPlayerId;
    this.consecutivePasses = consecutivePasses;
    this.winnerPlayerId = winnerPlayerId;
    this.eventLog = eventLog;
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
}
