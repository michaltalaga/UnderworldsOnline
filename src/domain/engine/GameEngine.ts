import { CardInstance } from "../state/CardInstance";
import { FeatureTokenState } from "../state/FeatureTokenState";
import { FighterState } from "../state/FighterState";
import { Game } from "../state/Game";
import { HexCell } from "../state/HexCell";
import { PlayerState } from "../state/PlayerState";
import { Territory } from "../state/Territory";
import {
  CardZone,
  FeatureTokenSide,
  HexKind,
  Phase,
  SetupStep,
} from "../values/enums";
import type { CardZone as CardZoneType } from "../values/enums";
import type { FighterId, HexId, PlayerId, TerritoryId } from "../values/ids";
import { ChooseTerritoryAction } from "../setup/ChooseTerritoryAction";
import { CompleteMusterAction } from "../setup/CompleteMusterAction";
import { DeployFighterAction } from "../setup/DeployFighterAction";
import { DrawStartingHandsAction } from "../setup/DrawStartingHandsAction";
import { PlaceFeatureTokenAction } from "../setup/PlaceFeatureTokenAction";
import { ResolveMulliganAction } from "../setup/ResolveMulliganAction";
import { SetupAction } from "../setup/SetupAction";

export type GameEngineShuffleCards = (cards: readonly CardInstance[]) => CardInstance[];

export class GameEngine {
  private readonly shuffleCards: GameEngineShuffleCards;

  public constructor(shuffleCards: GameEngineShuffleCards = GameEngine.copyCards) {
    this.shuffleCards = shuffleCards;
  }

  public applySetupAction(game: Game, action: SetupAction): Game {
    if (action instanceof CompleteMusterAction) {
      this.applyCompleteMuster(game);
      return game;
    }

    if (action instanceof DrawStartingHandsAction) {
      this.applyDrawStartingHands(game);
      return game;
    }

    if (action instanceof ResolveMulliganAction) {
      this.applyResolveMulligan(game, action);
      return game;
    }

    if (action instanceof ChooseTerritoryAction) {
      this.applyChooseTerritory(game, action);
      return game;
    }

    if (action instanceof PlaceFeatureTokenAction) {
      this.applyPlaceFeatureToken(game, action);
      return game;
    }

    if (action instanceof DeployFighterAction) {
      this.applyDeployFighter(game, action);
      return game;
    }

    throw new Error(`Unsupported setup action: ${action.kind}.`);
  }

  private applyCompleteMuster(game: Game): void {
    this.assertSetupStep(game, SetupStep.MusterWarbands);
    game.setupStep = SetupStep.DrawStartingHands;
    game.eventLog.push("Warbands mustered.");
  }

  private applyDrawStartingHands(game: Game): void {
    this.assertSetupStep(game, SetupStep.DrawStartingHands);

    for (const player of game.players) {
      if (player.objectiveHand.length > 0 || player.powerHand.length > 0) {
        throw new Error(`Player ${player.name} already has a starting hand.`);
      }

      this.drawCards(player.objectiveDeck.drawPile, player.objectiveHand, 3, CardZone.ObjectiveHand);
      this.drawCards(player.powerDeck.drawPile, player.powerHand, 5, CardZone.PowerHand);
    }

    game.setupStep = SetupStep.Mulligan;
    game.activePlayerId = game.players[0]?.id ?? null;
    game.eventLog.push("Starting hands drawn.");
  }

  private applyResolveMulligan(game: Game, action: ResolveMulliganAction): void {
    this.assertSetupStep(game, SetupStep.Mulligan);
    const player = this.requirePlayer(game, action.playerId);
    this.assertActivePlayer(game, player.id);

    if (action.redrawObjectives) {
      this.redrawHand(player.objectiveDeck.drawPile, player.objectiveHand, CardZone.ObjectiveHand);
    }

    if (action.redrawPower) {
      this.redrawHand(player.powerDeck.drawPile, player.powerHand, CardZone.PowerHand);
    }

    player.mulliganUsed = action.redrawObjectives || action.redrawPower;
    game.eventLog.push(
      `${player.name} ${player.mulliganUsed ? "used" : "declined"} their mulligan.`,
    );

    const currentPlayerIndex = game.players.findIndex(
      (currentPlayer) => currentPlayer.id === player.id,
    );
    const isLastPlayer = currentPlayerIndex === game.players.length - 1;

    if (isLastPlayer) {
      game.setupStep = SetupStep.DetermineTerritories;
      game.activePlayerId = null;
      game.eventLog.push("Mulligan step complete.");
      return;
    }

    game.activePlayerId = game.players[currentPlayerIndex + 1]?.id ?? null;
  }

  private applyChooseTerritory(game: Game, action: ChooseTerritoryAction): void {
    this.assertSetupStep(game, SetupStep.DetermineTerritories);
    if (game.board.territories.length !== 2) {
      throw new Error("Territory choice requires exactly two territories on the board.");
    }

    const winningPlayer = this.requirePlayer(game, action.playerId);
    const losingPlayer = this.requireOpponent(game, winningPlayer.id);
    const chosenTerritory = this.requireTerritory(game, action.territoryId);
    const remainingTerritory = game.board.territories.find(
      (territory) => territory.id !== chosenTerritory.id,
    );

    if (remainingTerritory === undefined) {
      throw new Error("Could not find the opposing territory.");
    }

    game.board.side = action.boardSide;
    chosenTerritory.ownerPlayerId = winningPlayer.id;
    remainingTerritory.ownerPlayerId = losingPlayer.id;
    winningPlayer.territoryId = chosenTerritory.id;
    losingPlayer.territoryId = remainingTerritory.id;
    game.setupStep = SetupStep.PlaceFeatureTokens;
    game.activePlayerId = losingPlayer.id;
    game.eventLog.push(
      `${winningPlayer.name} chose ${chosenTerritory.name} on the ${action.boardSide} board side.`,
    );
  }

  private applyPlaceFeatureToken(game: Game, action: PlaceFeatureTokenAction): void {
    this.assertSetupStep(game, SetupStep.PlaceFeatureTokens);
    const player = this.requirePlayer(game, action.playerId);
    this.assertActivePlayer(game, player.id);

    const placementNumber = game.board.featureTokens.length + 1;
    if (placementNumber > 5) {
      throw new Error("All feature tokens have already been placed.");
    }

    const hex = this.requireHex(game, action.hexId);
    const requireNeutralHex = game.board.featureTokens.length === 0;
    const standardPlacements = game.board.hexes.filter((candidate) =>
      this.isLegalFeatureHex(game, candidate, false, requireNeutralHex),
    );
    const allowEdgePlacement = standardPlacements.length === 0;

    if (!this.isLegalFeatureHex(game, hex, allowEdgePlacement, requireNeutralHex)) {
      throw new Error(`Hex ${hex.id} is not a legal feature token placement.`);
    }

    if (
      placementNumber === 5 &&
      !this.wouldSatisfyTerritoryCoverage(game, hex.territoryId)
    ) {
      throw new Error("The fifth feature token must leave at least one token in each territory.");
    }

    const featureToken = new FeatureTokenState(
      `feature:${placementNumber}`,
      placementNumber,
      hex.id,
      FeatureTokenSide.Hidden,
    );
    game.board.featureTokens.push(featureToken);
    hex.featureTokenId = featureToken.id;
    game.eventLog.push(`${player.name} placed feature token ${placementNumber} on ${hex.id}.`);

    if (placementNumber === 5) {
      for (const token of game.board.featureTokens) {
        token.side = FeatureTokenSide.Treasure;
      }

      game.setupStep = SetupStep.DeployFighters;
      game.activePlayerId = player.id;
      game.eventLog.push("Feature placement complete.");
      return;
    }

    game.activePlayerId = this.requireOpponent(game, player.id).id;
  }

  private applyDeployFighter(game: Game, action: DeployFighterAction): void {
    this.assertSetupStep(game, SetupStep.DeployFighters);
    const player = this.requirePlayer(game, action.playerId);
    this.assertActivePlayer(game, player.id);

    const fighter = this.requireOwnedUndeployedFighter(player, action.fighterId);
    const territoryId = this.requirePlayerTerritory(player);
    const hex = this.requireHex(game, action.hexId);

    if (hex.kind !== HexKind.Starting) {
      throw new Error(`Hex ${hex.id} is not a starting hex.`);
    }

    if (hex.territoryId !== territoryId) {
      throw new Error(`Hex ${hex.id} is not in ${player.name}'s territory.`);
    }

    if (hex.occupantFighterId !== null) {
      throw new Error(`Hex ${hex.id} is already occupied.`);
    }

    fighter.currentHexId = hex.id;
    hex.occupantFighterId = fighter.id;
    game.eventLog.push(`${player.name} deployed fighter ${fighter.id} to ${hex.id}.`);

    if (this.areAllFightersDeployed(game)) {
      game.setupStep = SetupStep.Complete;
      game.phase = Phase.Combat;
      game.activePlayerId = null;
      game.priorityPlayerId = null;
      game.eventLog.push("Setup complete.");
      return;
    }

    game.activePlayerId = this.getNextDeploymentPlayer(game, player.id).id;
  }

  private drawCards(
    drawPile: CardInstance[],
    hand: CardInstance[],
    amount: number,
    zone: CardZoneType,
  ): void {
    for (let drawIndex = 0; drawIndex < amount; drawIndex += 1) {
      const card = drawPile.shift();
      if (card === undefined) {
        throw new Error(`Attempted to draw ${amount} cards from an exhausted deck.`);
      }

      card.zone = zone;
      hand.push(card);
    }
  }

  private redrawHand(
    drawPile: CardInstance[],
    hand: CardInstance[],
    handZone: CardZoneType,
  ): void {
    const setAsideCards = [...hand];
    hand.length = 0;

    this.drawCards(drawPile, hand, setAsideCards.length, handZone);

    const deckZone =
      handZone === CardZone.ObjectiveHand ? CardZone.ObjectiveDeck : CardZone.PowerDeck;

    for (const card of setAsideCards) {
      card.zone = deckZone;
    }

    const reshuffledDeck = this.shuffleCards([...drawPile, ...setAsideCards]);
    drawPile.splice(0, drawPile.length, ...reshuffledDeck);
  }

  private isLegalFeatureHex(
    game: Game,
    hex: HexCell,
    allowEdgePlacement: boolean,
    requireNeutralHex: boolean,
  ): boolean {
    if (hex.occupantFighterId !== null || hex.featureTokenId !== null) {
      return false;
    }

    if (
      hex.kind === HexKind.Starting ||
      hex.kind === HexKind.Blocked ||
      hex.kind === HexKind.Stagger
    ) {
      return false;
    }

    if (!allowEdgePlacement && hex.kind === HexKind.Edge) {
      return false;
    }

    if (requireNeutralHex && hex.territoryId !== null) {
      return false;
    }

    return !game.board.featureTokens.some((token) => {
      const tokenHex = game.board.getHex(token.hexId);
      return tokenHex !== undefined && this.getHexDistance(hex, tokenHex) <= 2;
    });
  }

  private wouldSatisfyTerritoryCoverage(game: Game, newTokenTerritoryId: TerritoryId | null): boolean {
    const occupiedTerritories = new Set<TerritoryId>();

    for (const token of game.board.featureTokens) {
      const tokenHex = game.board.getHex(token.hexId);
      if (tokenHex?.territoryId !== null && tokenHex?.territoryId !== undefined) {
        occupiedTerritories.add(tokenHex.territoryId);
      }
    }

    if (newTokenTerritoryId !== null) {
      occupiedTerritories.add(newTokenTerritoryId);
    }

    return game.players.every(
      (player) => player.territoryId !== null && occupiedTerritories.has(player.territoryId),
    );
  }

  private getHexDistance(a: HexCell, b: HexCell): number {
    const qDistance = a.q - b.q;
    const rDistance = a.r - b.r;
    const sDistance = (a.q + a.r) - (b.q + b.r);
    return (Math.abs(qDistance) + Math.abs(rDistance) + Math.abs(sDistance)) / 2;
  }

  private getNextDeploymentPlayer(game: Game, currentPlayerId: PlayerId): PlayerState {
    const currentPlayer = this.requirePlayer(game, currentPlayerId);
    const opponent = this.requireOpponent(game, currentPlayerId);

    if (this.getUndeployedFighters(opponent).length > 0) {
      return opponent;
    }

    if (this.getUndeployedFighters(currentPlayer).length > 0) {
      return currentPlayer;
    }

    throw new Error("No fighters remain to deploy.");
  }

  private areAllFightersDeployed(game: Game): boolean {
    return game.players.every((player) => this.getUndeployedFighters(player).length === 0);
  }

  private getUndeployedFighters(player: PlayerState): FighterState[] {
    return player.fighters.filter(
      (fighter) => fighter.currentHexId === null && !fighter.isSlain,
    );
  }

  private requireOwnedUndeployedFighter(player: PlayerState, fighterId: FighterId): FighterState {
    const fighter = player.getFighter(fighterId);
    if (fighter === undefined) {
      throw new Error(`Player ${player.name} does not control fighter ${fighterId}.`);
    }

    if (fighter.currentHexId !== null) {
      throw new Error(`Fighter ${fighter.id} has already been deployed.`);
    }

    return fighter;
  }

  private requirePlayerTerritory(player: PlayerState): TerritoryId {
    if (player.territoryId === null) {
      throw new Error(`Player ${player.name} does not have an assigned territory.`);
    }

    return player.territoryId;
  }

  private requirePlayer(game: Game, playerId: PlayerId | null): PlayerState {
    if (playerId === null) {
      throw new Error("This action requires a player id.");
    }

    const player = game.getPlayer(playerId);
    if (player === undefined) {
      throw new Error(`Unknown player ${playerId}.`);
    }

    return player;
  }

  private requireOpponent(game: Game, playerId: PlayerId): PlayerState {
    const opponent = game.getOpponent(playerId);
    if (opponent === undefined) {
      throw new Error(`Could not find opponent for player ${playerId}.`);
    }

    return opponent;
  }

  private requireTerritory(game: Game, territoryId: TerritoryId): Territory {
    const territory = game.board.getTerritory(territoryId);
    if (territory === undefined) {
      throw new Error(`Unknown territory ${territoryId}.`);
    }

    return territory;
  }

  private requireHex(game: Game, hexId: HexId): HexCell {
    const hex = game.board.getHex(hexId);
    if (hex === undefined) {
      throw new Error(`Unknown hex ${hexId}.`);
    }

    return hex;
  }

  private assertSetupStep(game: Game, expectedStep: SetupStep): void {
    if (game.phase !== Phase.Setup) {
      throw new Error(`Expected setup phase, got ${game.phase}.`);
    }

    if (game.setupStep !== expectedStep) {
      throw new Error(`Expected setup step ${expectedStep}, got ${game.setupStep}.`);
    }
  }

  private assertActivePlayer(game: Game, playerId: PlayerId): void {
    if (game.activePlayerId !== playerId) {
      throw new Error(`Expected active player ${game.activePlayerId}, got ${playerId}.`);
    }
  }

  private static copyCards(cards: readonly CardInstance[]): CardInstance[] {
    return [...cards];
  }
}
