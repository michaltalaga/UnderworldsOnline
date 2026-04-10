import type { Card, CardFactory } from "../cards/Card";
import { DeckDefinition } from "../definitions/DeckDefinition";
import { WarbandDefinition } from "../definitions/WarbandDefinition";
import { Board } from "../state/Board";
import { Deck } from "../state/Deck";
import { Fighter } from "../state/Fighter";
import { Game } from "../state/Game";
import { HexCell } from "../state/HexCell";
import { Player } from "../state/Player";
import { Territory } from "../state/Territory";
import { Warscroll } from "../state/Warscroll";
import {
  BoardSide,
  CardZone,
  DeckKind,
  Phase,
  SetupStep,
} from "../values/enums";
import type { GameId, PlayerId } from "../values/ids";

export type ShuffleCards = (cards: readonly Card[]) => Card[];

export type GameFactoryPlayerConfig = {
  id: PlayerId;
  name: string;
  warband: WarbandDefinition;
  // When provided, the deck's cards replace the warband's built-in cards.
  // When omitted, the warband's own objectiveCards/powerCards are used.
  deck?: DeckDefinition;
};

export type GameFactoryCreateParams = {
  gameId: GameId;
  board: Board;
  players: readonly [GameFactoryPlayerConfig, GameFactoryPlayerConfig];
  shuffleCards?: ShuffleCards;
};

export class GameFactory {
  public createGame(params: GameFactoryCreateParams): Game {
    this.validatePlayers(params.players);
    this.validateBoard(params.board);

    const shuffleCards = params.shuffleCards ?? this.shuffleCards;
    const board = this.createBoard(params.board);
    const players = params.players.map((player) => this.createPlayer(player, shuffleCards));

    return new Game(
      params.gameId,
      board,
      players,
      1,
      3,
      Phase.Setup,
      SetupStep.MusterWarbands,
      null,
      null,
      null,
      null,
      null,
      0,
      null,
      [],
      [
        `Created game ${params.gameId}.`,
        ...players.map((player) => `${player.name} entered with ${player.warband.name}.`),
      ],
    );
  }

  private createPlayer(
    config: GameFactoryPlayerConfig,
    shuffleCards: ShuffleCards,
  ): Player {
    const objectiveCardFactories = config.deck?.objectiveCards ?? config.warband.objectiveCards;
    const powerCardFactories = config.deck?.powerCards ?? config.warband.powerCards;
    this.validateWarband(config.warband, config.name);

    const fighters = config.warband.fighters.map(
      (fighter, index) =>
        new Fighter(
          `${config.id}:fighter:${fighter.id}:${index + 1}`,
          fighter.id,
          config.id,
        ),
    );

    // Create player first (without cards) so Card constructors can reference their owner.
    const player = new Player(
      config.id,
      config.name,
      config.warband,
      0,
      null,
      false,
      0,
      false,
      fighters,
      new Deck(DeckKind.Objective, [], []),
      new Deck(DeckKind.Power, [], []),
      [],
      [],
      [],
      [],
      new Warscroll(
        config.id,
        config.warband.warscroll.id,
        { ...config.warband.warscroll.startingTokens },
      ),
    );

    // Now create card objects with the player as owner.
    const objectiveCards = this.createCards(player, objectiveCardFactories, CardZone.ObjectiveDeck, "objective");
    const powerCards = this.createCards(player, powerCardFactories, CardZone.PowerDeck, "power");
    player.objectiveDeck = new Deck(DeckKind.Objective, shuffleCards(objectiveCards), []);
    player.powerDeck = new Deck(DeckKind.Power, shuffleCards(powerCards), []);

    return player;
  }

  private createCards(
    owner: Player,
    factories: readonly CardFactory[],
    zone: CardZone,
    prefix: string,
  ): Card[] {
    return factories.map(
      (factory, index) =>
        factory(`${owner.id}:card:${prefix}:${index + 1}`, owner, zone),
    );
  }

  private createBoard(board: Board): Board {
    const frontHexes = this.createSideHexes(board.getHexesForSide(BoardSide.Front));
    const frontTerritories = this.createSideTerritories(board.getTerritoriesForSide(BoardSide.Front));
    const backHexes = board.getAvailableSides().includes(BoardSide.Back)
      ? this.createSideHexes(board.getHexesForSide(BoardSide.Back))
      : [];
    const backTerritories = board.getAvailableSides().includes(BoardSide.Back)
      ? this.createSideTerritories(board.getTerritoriesForSide(BoardSide.Back))
      : [];

    return new Board(
      board.layoutId,
      board.side,
      frontHexes,
      frontTerritories,
      [],
      backHexes,
      backTerritories,
    );
  }

  private validatePlayers(players: readonly GameFactoryPlayerConfig[]): void {
    if (players.length !== 2) {
      throw new Error("A game requires exactly two players.");
    }

    const playerIds = players.map((player) => player.id);
    this.validateUniqueValues(playerIds, "player ids");
  }

  private validateBoard(board: Board): void {
    for (const side of board.getAvailableSides()) {
      this.validateBoardSide(
        board.getHexesForSide(side),
        board.getTerritoriesForSide(side),
        side,
      );
    }
  }

  private validateWarband(warband: WarbandDefinition, playerName: string): void {
    if (warband.fighters.length === 0) {
      throw new Error(`${playerName}'s warband must provide at least one fighter.`);
    }

    this.validateUniqueValues(
      warband.fighters.map((fighter) => fighter.id),
      `${playerName}'s fighter definition ids`,
    );

    for (const [tokenName, tokenCount] of Object.entries(warband.warscroll.startingTokens)) {
      if (!Number.isInteger(tokenCount) || tokenCount < 0) {
        throw new Error(
          `${playerName}'s warscroll token '${tokenName}' must have a non-negative integer count.`,
        );
      }
    }
  }

  // Card factories are opaque functions — can't validate kind/ID at definition time.
  // Validation happens at runtime when cards are created.

  private validateUniqueValues(values: readonly string[], label: string): void {
    if (new Set(values).size !== values.length) {
      throw new Error(`Expected unique ${label}.`);
    }
  }

  private createSideHexes(hexes: readonly HexCell[]): HexCell[] {
    return hexes.map(
      (hex) =>
        new HexCell(
          hex.id,
          hex.q,
          hex.r,
          hex.kind,
          hex.isStartingHex,
          hex.isEdgeHex,
          hex.territoryId,
          null,
          null,
        ),
    );
  }

  private createSideTerritories(territories: readonly Territory[]): Territory[] {
    return territories.map(
      (territory) =>
        new Territory(territory.id, territory.name, null, [...territory.hexIds]),
    );
  }

  private validateBoardSide(
    hexes: readonly HexCell[],
    territories: readonly Territory[],
    side: BoardSide,
  ): void {
    this.validateUniqueValues(
      hexes.map((hex) => hex.id),
      `${side} board hex ids`,
    );

    this.validateUniqueValues(
      territories.map((territory) => territory.id),
      `${side} territory ids`,
    );

    const hexIds = new Set(hexes.map((hex) => hex.id));
    for (const territory of territories) {
      for (const hexId of territory.hexIds) {
        if (!hexIds.has(hexId)) {
          throw new Error(
            `Territory ${territory.id} on ${side} references unknown hex ${hexId}.`,
          );
        }
      }
    }
  }

  private shuffleCards(cards: readonly Card[]): Card[] {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
