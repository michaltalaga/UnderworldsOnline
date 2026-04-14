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
import {
  BoardSide,
  CardZone,
  DeckKind,
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

    // Create player first (empty fighters) so Fighter can hold the
    // Player ref. Fighters are assigned immediately after construction.
    const player = new Player(
      config.id,
      config.name,
      config.warband,
      0,
      null,
      false,
      0,
      false,
      [],
      new Deck(DeckKind.Objective, [], []),
      new Deck(DeckKind.Power, [], []),
      [],
      [],
      [],
      [],
    );
    player.warscrollState.tokens = { ...config.warband.warscroll.startingTokens };
    player.fighters = config.warband.fighters.map(
      (fighterDef, index) =>
        new Fighter(
          `${config.id}:fighter:${fighterDef.id}:${index + 1}` as never,
          fighterDef,
          player,
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
    const { hexes: frontHexes, territories: frontTerritories } = this.createSide(
      board.getHexesForSide(BoardSide.Front),
      board.getTerritoriesForSide(BoardSide.Front),
    );
    const hasBack = board.getAvailableSides().includes(BoardSide.Back);
    const { hexes: backHexes, territories: backTerritories } = hasBack
      ? this.createSide(board.getHexesForSide(BoardSide.Back), board.getTerritoriesForSide(BoardSide.Back))
      : { hexes: [], territories: [] };

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

  // Fresh hexes and territories are wired up together: new hexes point at
  // new territories (not the originals), and each new territory's `hexes`
  // array contains the new hex refs.
  private createSide(
    sourceHexes: readonly HexCell[],
    sourceTerritories: readonly Territory[],
  ): { hexes: HexCell[]; territories: Territory[] } {
    const territories = sourceTerritories.map(
      (territory) => new Territory(territory.id, territory.name, null, []),
    );
    const territoryByOriginal = new Map<Territory, Territory>();
    sourceTerritories.forEach((source, index) => territoryByOriginal.set(source, territories[index]));

    const hexes = sourceHexes.map(
      (hex) =>
        new HexCell(
          hex.id,
          hex.q,
          hex.r,
          hex.kind,
          hex.isStartingHex,
          hex.isEdgeHex,
          hex.territory === null ? null : territoryByOriginal.get(hex.territory) ?? null,
          null,
          null,
        ),
    );

    for (const territory of territories) {
      territory.hexes = hexes.filter((hex) => hex.territory === territory);
    }

    return { hexes, territories };
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

    const hexSet = new Set<HexCell>(hexes);
    for (const territory of territories) {
      for (const hex of territory.hexes) {
        if (!hexSet.has(hex)) {
          throw new Error(
            `Territory ${territory.id} on ${side} references unknown hex ${hex.id}.`,
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
