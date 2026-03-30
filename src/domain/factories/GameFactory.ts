import { CardDefinition } from "../definitions/CardDefinition";
import { WarbandDefinition } from "../definitions/WarbandDefinition";
import { CardInstance } from "../state/CardInstance";
import { BoardState } from "../state/BoardState";
import { DeckState } from "../state/DeckState";
import { FighterState } from "../state/FighterState";
import { Game } from "../state/Game";
import { HexCell } from "../state/HexCell";
import { PlayerState } from "../state/PlayerState";
import { Territory } from "../state/Territory";
import {
  CardKind,
  CardZone,
  DeckKind,
  Phase,
  SetupStep,
} from "../values/enums";
import type { GameId, PlayerId } from "../values/ids";

export type ShuffleCards = (cards: readonly CardInstance[]) => CardInstance[];

export type GameFactoryPlayerConfig = {
  id: PlayerId;
  name: string;
  warband: WarbandDefinition;
};

export type GameFactoryCreateParams = {
  gameId: GameId;
  board: BoardState;
  players: readonly [GameFactoryPlayerConfig, GameFactoryPlayerConfig];
  shuffleCards?: ShuffleCards;
};

export class GameFactory {
  public createGame(params: GameFactoryCreateParams): Game {
    this.validatePlayers(params.players);
    this.validateBoard(params.board);

    const shuffleCards = params.shuffleCards ?? this.copyCards;
    const board = this.createBoardState(params.board);
    const players = params.players.map((player) => this.createPlayerState(player, shuffleCards));

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
      [
        `Created game ${params.gameId}.`,
        ...players.map((player) => `${player.name} entered with ${player.warband.name}.`),
      ],
    );
  }

  private createPlayerState(
    config: GameFactoryPlayerConfig,
    shuffleCards: ShuffleCards,
  ): PlayerState {
    this.validateWarband(config.warband, config.name);

    const fighters = config.warband.fighters.map(
      (fighter, index) =>
        new FighterState(
          `${config.id}:fighter:${fighter.id}:${index + 1}`,
          fighter.id,
          config.id,
        ),
    );

    const objectiveCards = this.createCardInstances(
      config.id,
      config.warband.objectiveCards,
      CardZone.ObjectiveDeck,
      "objective",
    );
    const powerCards = this.createCardInstances(
      config.id,
      config.warband.powerCards,
      CardZone.PowerDeck,
      "power",
    );

    return new PlayerState(
      config.id,
      config.name,
      config.warband,
      0,
      null,
      false,
      0,
      false,
      fighters,
      new DeckState(DeckKind.Objective, shuffleCards(objectiveCards), []),
      new DeckState(DeckKind.Power, shuffleCards(powerCards), []),
      [],
      [],
      [],
      [],
    );
  }

  private createCardInstances(
    playerId: PlayerId,
    definitions: readonly CardDefinition[],
    zone: CardZone,
    prefix: string,
  ): CardInstance[] {
    return definitions.map(
      (definition, index) =>
        new CardInstance(
          `${playerId}:card:${prefix}:${definition.id}:${index + 1}`,
          definition.id,
          playerId,
          zone,
        ),
    );
  }

  private createBoardState(board: BoardState): BoardState {
    const hexes = board.hexes.map(
      (hex) =>
        new HexCell(
          hex.id,
          hex.q,
          hex.r,
          hex.kind,
          hex.territoryId,
          null,
          null,
        ),
    );

    const territories = board.territories.map(
      (territory) =>
        new Territory(territory.id, territory.name, null, [...territory.hexIds]),
    );

    return new BoardState(board.layoutId, board.side, hexes, territories, []);
  }

  private validatePlayers(players: readonly GameFactoryPlayerConfig[]): void {
    if (players.length !== 2) {
      throw new Error("A game requires exactly two players.");
    }

    const playerIds = players.map((player) => player.id);
    this.validateUniqueValues(playerIds, "player ids");
  }

  private validateBoard(board: BoardState): void {
    this.validateUniqueValues(
      board.hexes.map((hex) => hex.id),
      "board hex ids",
    );

    this.validateUniqueValues(
      board.territories.map((territory) => territory.id),
      "territory ids",
    );

    const hexIds = new Set(board.hexes.map((hex) => hex.id));
    for (const territory of board.territories) {
      for (const hexId of territory.hexIds) {
        if (!hexIds.has(hexId)) {
          throw new Error(
            `Territory ${territory.id} references unknown hex ${hexId}.`,
          );
        }
      }
    }
  }

  private validateWarband(warband: WarbandDefinition, playerName: string): void {
    if (warband.objectiveCards.length !== 12) {
      throw new Error(
        `${playerName}'s warband must provide exactly 12 objective cards.`,
      );
    }

    if (warband.powerCards.length !== 20) {
      throw new Error(
        `${playerName}'s warband must provide exactly 20 power cards.`,
      );
    }

    if (warband.objectiveCards.some((card) => card.kind !== CardKind.Objective)) {
      throw new Error(`${playerName}'s objective deck contains a non-objective card.`);
    }

    if (
      warband.powerCards.some(
        (card) => card.kind !== CardKind.Ploy && card.kind !== CardKind.Upgrade,
      )
    ) {
      throw new Error(`${playerName}'s power deck contains an invalid card kind.`);
    }

    this.validateUniqueValues(
      warband.fighters.map((fighter) => fighter.id),
      `${playerName}'s fighter definition ids`,
    );

    this.validateUniqueValues(
      [
        ...warband.objectiveCards.map((card) => card.id),
        ...warband.powerCards.map((card) => card.id),
      ],
      `${playerName}'s card definition ids`,
    );
  }

  private validateUniqueValues(values: readonly string[], label: string): void {
    if (new Set(values).size !== values.length) {
      throw new Error(`Expected unique ${label}.`);
    }
  }

  private copyCards(cards: readonly CardInstance[]): CardInstance[] {
    return [...cards];
  }
}
