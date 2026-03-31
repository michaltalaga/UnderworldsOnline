import { CardInstance } from "../state/CardInstance";
import { FeatureTokenState } from "../state/FeatureTokenState";
import { FighterState } from "../state/FighterState";
import { Game } from "../state/Game";
import {
  createCombatChooseFirstPlayerGameState,
  createCombatReadyGameState,
  createCombatTurnGameState,
  createEndPhaseGameState,
  createSetupDeployFightersGameState,
  createSetupDetermineTerritoriesChoiceGameState,
  createSetupDetermineTerritoriesRollOffGameState,
  createSetupDrawStartingHandsGameState,
  createSetupMulliganGameState,
  createSetupPlaceFeatureTokensGameState,
} from "../state/GameState";
import { HexCell } from "../state/HexCell";
import { PlayerState } from "../state/PlayerState";
import { Territory } from "../state/Territory";
import {
  RollOffKind,
  CardZone,
  EndPhaseStep,
  FeatureTokenSide,
  HexKind,
  TurnStep,
} from "../values/enums";
import type { CardZone as CardZoneType } from "../values/enums";
import type { FighterId, HexId, PlayerId, TerritoryId } from "../values/ids";
import { ChooseTerritoryAction } from "../setup/ChooseTerritoryAction";
import { CompleteMusterAction } from "../setup/CompleteMusterAction";
import { DeployFighterAction } from "../setup/DeployFighterAction";
import { DrawStartingHandsAction } from "../setup/DrawStartingHandsAction";
import { EndPhaseAction } from "../endPhase/EndPhaseAction";
import { GameAction } from "../actions/GameAction";
import { MoveAction } from "../actions/MoveAction";
import { PassAction } from "../actions/PassAction";
import { PlaceFeatureTokenAction } from "../setup/PlaceFeatureTokenAction";
import { ResolveMulliganAction } from "../setup/ResolveMulliganAction";
import { ResolveTerritoryRollOffAction } from "../setup/ResolveTerritoryRollOffAction";
import { SetupAction } from "../setup/SetupAction";
import { ResolveDiscardCardsAction } from "../endPhase/ResolveDiscardCardsAction";
import { ResolveDrawObjectivesAction } from "../endPhase/ResolveDrawObjectivesAction";
import { ResolveDrawPowerCardsAction } from "../endPhase/ResolveDrawPowerCardsAction";
import { ResolveEquipUpgradesAction } from "../endPhase/ResolveEquipUpgradesAction";
import { ResolveScoreObjectivesAction } from "../endPhase/ResolveScoreObjectivesAction";
import { CombatActionService } from "../rules/CombatActionService";
import { DefaultScoringResolver } from "../rules/DefaultScoringResolver";
import { RollOffContext } from "../rules/RollOffContext";
import { RollOffResolver } from "../rules/RollOffResolver";
import { type RollOffRoundInput } from "../rules/RollOffRound";
import { RollOffResult } from "../rules/RollOffResult";
import { ScoringResolver } from "../rules/ScoringResolver";

export type GameEngineShuffleCards = (cards: readonly CardInstance[]) => CardInstance[];

export class GameEngine {
  private static readonly objectiveHandSize = 3;
  private static readonly powerHandSize = 5;
  private static readonly turnsPerRound = 4;
  private readonly shuffleCards: GameEngineShuffleCards;
  private readonly rollOffResolver: RollOffResolver;
  private readonly combatActionService: CombatActionService;
  private readonly scoringResolver: ScoringResolver;

  public constructor(
    shuffleCards: GameEngineShuffleCards = GameEngine.copyCards,
    rollOffResolver: RollOffResolver = new RollOffResolver(),
    combatActionService: CombatActionService = new CombatActionService(),
    scoringResolver: ScoringResolver = new DefaultScoringResolver(),
  ) {
    this.shuffleCards = shuffleCards;
    this.rollOffResolver = rollOffResolver;
    this.combatActionService = combatActionService;
    this.scoringResolver = scoringResolver;
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

    if (action instanceof ResolveTerritoryRollOffAction) {
      this.applyResolveTerritoryRollOff(game, action);
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

  public applyGameAction(game: Game, action: GameAction): Game {
    if (action instanceof MoveAction) {
      this.applyMoveAction(game, action);
      return game;
    }

    if (action instanceof PassAction) {
      this.applyPassAction(game, action);
      return game;
    }

    throw new Error(`Unsupported game action: ${action.kind}.`);
  }

  public applyEndPhaseAction(game: Game, action: EndPhaseAction): Game {
    if (action instanceof ResolveScoreObjectivesAction) {
      this.applyResolveScoreObjectives(game);
      return game;
    }

    if (action instanceof ResolveEquipUpgradesAction) {
      this.applyResolveEquipUpgrades(game);
      return game;
    }

    if (action instanceof ResolveDiscardCardsAction) {
      this.applyResolveDiscardCards(game);
      return game;
    }

    if (action instanceof ResolveDrawObjectivesAction) {
      this.applyResolveDrawObjectives(game);
      return game;
    }

    if (action instanceof ResolveDrawPowerCardsAction) {
      this.applyResolveDrawPowerCards(game);
      return game;
    }

    throw new Error(`Unsupported end phase action: ${action.kind}.`);
  }

  public resolveFirstTurnRollOff(
    game: Game,
    rounds: readonly RollOffRoundInput[],
  ): RollOffResult {
    this.assertStateKind(game, "combatReady");

    const [playerOne, playerTwo] = this.requireTwoPlayers(game);
    const tieWinnerPlayerId =
      game.roundNumber >= 2 ? this.getUnderdogPlayerId(playerOne, playerTwo) : null;

    const result = this.rollOffResolver.resolve(
      new RollOffContext(
        playerOne.id,
        playerTwo.id,
        RollOffKind.FirstTurn,
        tieWinnerPlayerId,
      ),
      rounds,
    );

    game.transitionTo(createCombatChooseFirstPlayerGameState(result.winnerPlayerId));
    game.eventLog.push(this.describeRollOff(game, result));

    return result;
  }

  public chooseFirstPlayer(
    game: Game,
    chooserPlayerId: PlayerId,
    firstPlayerId: PlayerId,
  ): Game {
    this.assertStateKind(game, "combatChooseFirstPlayer");

    if (game.priorityPlayerId !== chooserPlayerId) {
      throw new Error(
        `Expected roll-off winner ${game.priorityPlayerId} to choose first player, got ${chooserPlayerId}.`,
      );
    }

    const chooser = this.requirePlayer(game, chooserPlayerId);
    const firstPlayer = this.requirePlayer(game, firstPlayerId);
    const rollOffLoser = this.requireOpponent(game, chooser.id);

    this.drawCards(rollOffLoser.powerDeck.drawPile, rollOffLoser.powerHand, 1, CardZone.PowerHand);

    for (const player of game.players) {
      player.turnsTakenThisRound = 0;
      player.hasDelvedThisPowerStep = false;
    }

    game.transitionTo(createCombatTurnGameState(firstPlayer.id, firstPlayer.id, TurnStep.Action));
    game.consecutivePasses = 0;
    game.eventLog.push(
      `${chooser.name} chose ${firstPlayer.name} to take the first turn. ${rollOffLoser.name} drew 1 power card.`,
    );

    return game;
  }

  private applyCompleteMuster(game: Game): void {
    this.assertStateKind(game, "setupMusterWarbands");
    game.transitionTo(createSetupDrawStartingHandsGameState());
    game.eventLog.push("Warbands mustered.");
  }

  private applyDrawStartingHands(game: Game): void {
    this.assertStateKind(game, "setupDrawStartingHands");

    for (const player of game.players) {
      if (player.objectiveHand.length > 0 || player.powerHand.length > 0) {
        throw new Error(`Player ${player.name} already has a starting hand.`);
      }

      this.drawCards(player.objectiveDeck.drawPile, player.objectiveHand, 3, CardZone.ObjectiveHand);
      this.drawCards(player.powerDeck.drawPile, player.powerHand, 5, CardZone.PowerHand);
    }

    const firstPlayerId = game.players[0]?.id ?? null;
    if (firstPlayerId === null) {
      throw new Error("Expected at least one player when drawing starting hands.");
    }

    game.transitionTo(createSetupMulliganGameState(firstPlayerId));
    game.eventLog.push("Starting hands drawn.");
  }

  private applyResolveMulligan(game: Game, action: ResolveMulliganAction): void {
    this.assertStateKind(game, "setupMulligan");
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
      game.transitionTo(createSetupDetermineTerritoriesRollOffGameState());
      game.eventLog.push("Mulligan step complete.");
      return;
    }

    const nextPlayerId = game.players[currentPlayerIndex + 1]?.id ?? null;
    if (nextPlayerId === null) {
      throw new Error("Expected the next player to resolve their mulligan.");
    }

    game.transitionTo(createSetupMulliganGameState(nextPlayerId));
  }

  private applyResolveTerritoryRollOff(
    game: Game,
    action: ResolveTerritoryRollOffAction,
  ): void {
    this.assertStateKind(game, "setupDetermineTerritoriesRollOff");
    const [playerOne, playerTwo] = this.requireTwoPlayers(game);

    const result = this.rollOffResolver.resolve(
      new RollOffContext(playerOne.id, playerTwo.id, RollOffKind.TerritoryChoice),
      action.rounds,
    );

    game.transitionTo(createSetupDetermineTerritoriesChoiceGameState(result.winnerPlayerId));
    game.eventLog.push(this.describeRollOff(game, result));
  }

  private applyChooseTerritory(game: Game, action: ChooseTerritoryAction): void {
    this.assertStateKind(game, "setupDetermineTerritoriesChoice");
    game.board.setSide(action.boardSide);

    if (game.board.territories.length !== 2) {
      throw new Error("Territory choice requires exactly two territories on the board.");
    }

    const winningPlayer = this.requirePlayer(game, action.playerId);
    this.assertActivePlayer(game, winningPlayer.id);
    const losingPlayer = this.requireOpponent(game, winningPlayer.id);
    const chosenTerritory = this.requireTerritory(game, action.territoryId);
    const remainingTerritory = game.board.territories.find(
      (territory) => territory.id !== chosenTerritory.id,
    );

    if (remainingTerritory === undefined) {
      throw new Error("Could not find the opposing territory.");
    }

    chosenTerritory.ownerPlayerId = winningPlayer.id;
    remainingTerritory.ownerPlayerId = losingPlayer.id;
    winningPlayer.territoryId = chosenTerritory.id;
    losingPlayer.territoryId = remainingTerritory.id;
    game.transitionTo(createSetupPlaceFeatureTokensGameState(losingPlayer.id));
    game.eventLog.push(
      `${winningPlayer.name} chose ${chosenTerritory.name} on the ${action.boardSide} board side.`,
    );
  }

  private applyPlaceFeatureToken(game: Game, action: PlaceFeatureTokenAction): void {
    this.assertStateKind(game, "setupPlaceFeatureTokens");
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

      game.transitionTo(createSetupDeployFightersGameState(player.id));
      game.eventLog.push("Feature placement complete.");
      return;
    }

    game.transitionTo(createSetupPlaceFeatureTokensGameState(this.requireOpponent(game, player.id).id));
  }

  private applyDeployFighter(game: Game, action: DeployFighterAction): void {
    this.assertStateKind(game, "setupDeployFighters");
    const player = this.requirePlayer(game, action.playerId);
    this.assertActivePlayer(game, player.id);

    const fighter = this.requireOwnedUndeployedFighter(player, action.fighterId);
    const territoryId = this.requirePlayerTerritory(player);
    const hex = this.requireHex(game, action.hexId);

    if (!hex.isStartingHex) {
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
    fighter.hasStaggerToken = hex.kind === HexKind.Stagger;
    game.eventLog.push(`${player.name} deployed fighter ${fighter.id} to ${hex.id}.`);

    if (this.areAllFightersDeployed(game)) {
      game.transitionTo(createCombatReadyGameState());
      game.eventLog.push("Setup complete.");
      return;
    }

    game.transitionTo(createSetupDeployFightersGameState(this.getNextDeploymentPlayer(game, player.id).id));
  }

  private applyMoveAction(game: Game, action: MoveAction): void {
    this.assertCombatTurnStep(game, TurnStep.Action);
    if (!this.combatActionService.isLegalMoveAction(game, action)) {
      throw new Error(`Move path ${action.path.join(" -> ")} is not legal for fighter ${action.fighterId}.`);
    }

    const player = this.requirePlayer(game, action.playerId);
    this.assertActivePlayer(game, player.id);

    const fighter = this.requireOwnedDeployedFighter(player, action.fighterId);
    const currentHexId = fighter.currentHexId;
    if (currentHexId === null) {
      throw new Error(`Fighter ${fighter.id} is not deployed on the board.`);
    }

    const currentHex = this.requireHex(game, currentHexId);
    const destinationHexId = action.path[action.path.length - 1];
    if (destinationHexId === undefined) {
      throw new Error(`Move action for fighter ${fighter.id} requires a destination hex.`);
    }

    const destinationHex = this.requireHex(game, destinationHexId);

    currentHex.occupantFighterId = null;
    destinationHex.occupantFighterId = fighter.id;
    fighter.currentHexId = destinationHex.id;
    fighter.hasMoveToken = true;
    if (destinationHex.kind === HexKind.Stagger) {
      fighter.hasStaggerToken = true;
    }

    const firstPlayerId = game.firstPlayerId;
    if (firstPlayerId === null) {
      throw new Error("Combat turn state requires a first player id.");
    }

    game.consecutivePasses = 0;
    game.transitionTo(createCombatTurnGameState(firstPlayerId, player.id, TurnStep.Power));
    game.eventLog.push(`${player.name} moved fighter ${fighter.id} to ${destinationHex.id}.`);
  }

  private applyPassAction(game: Game, action: PassAction): void {
    this.assertStateKind(game, "combatTurn");

    const player = this.requirePlayer(game, action.playerId);
    this.assertActivePlayer(game, player.id);

    const firstPlayerId = game.firstPlayerId;
    if (firstPlayerId === null) {
      throw new Error("Combat turn state requires a first player id.");
    }

    if (game.turnStep === TurnStep.Action) {
      game.consecutivePasses += 1;
      game.transitionTo(createCombatTurnGameState(firstPlayerId, player.id, TurnStep.Power));
      game.eventLog.push(`${player.name} passed their action step.`);
      return;
    }

    if (game.turnStep === TurnStep.Power) {
      player.turnsTakenThisRound += 1;
      player.hasDelvedThisPowerStep = false;

      if (this.haveAllPlayersCompletedRoundTurns(game)) {
        game.consecutivePasses = 0;
        game.transitionTo(createEndPhaseGameState(EndPhaseStep.ScoreObjectives, null, firstPlayerId));
        game.eventLog.push(`Round ${game.roundNumber} combat turns complete. End phase begins.`);
        return;
      }

      const nextPlayer = this.requireOpponent(game, player.id);
      nextPlayer.hasDelvedThisPowerStep = false;

      game.consecutivePasses += 1;
      game.transitionTo(createCombatTurnGameState(firstPlayerId, nextPlayer.id, TurnStep.Action));
      game.eventLog.push(`${player.name} passed their power step.`);
      return;
    }

    throw new Error(`Unsupported combat turn step ${game.turnStep}.`);
  }

  private applyResolveScoreObjectives(game: Game): void {
    this.assertEndPhaseStep(game, EndPhaseStep.ScoreObjectives);

    for (const player of game.players) {
      const scorableObjectives = this.scoringResolver.getScorableObjectives(game, player.id);
      const uniqueObjectiveIds = new Set(scorableObjectives.map((card) => card.id));

      for (const objectiveId of uniqueObjectiveIds) {
        const objectiveCard = player.getCard(objectiveId);
        if (objectiveCard === undefined || objectiveCard.zone !== CardZone.ObjectiveHand) {
          throw new Error(`Objective card ${objectiveId} is not available to score for ${player.name}.`);
        }

        const objectiveDefinition = player.getCardDefinition(objectiveCard.id);
        if (objectiveDefinition === undefined) {
          throw new Error(`Missing card definition for objective ${objectiveCard.definitionId}.`);
        }

        const handIndex = player.objectiveHand.findIndex((card) => card.id === objectiveCard.id);
        if (handIndex === -1) {
          throw new Error(`Could not find objective ${objectiveCard.id} in ${player.name}'s hand.`);
        }

        player.objectiveHand.splice(handIndex, 1);
        objectiveCard.zone = CardZone.ScoredObjectives;
        objectiveCard.revealed = true;
        player.scoredObjectives.push(objectiveCard);
        player.glory += objectiveDefinition.gloryValue;
        game.eventLog.push(
          `${player.name} scored ${objectiveDefinition.name} for ${objectiveDefinition.gloryValue} glory.`,
        );
      }
    }

    game.transitionTo(
      createEndPhaseGameState(
        EndPhaseStep.EquipUpgrades,
        null,
        game.firstPlayerId,
      ),
    );
    game.eventLog.push("Objective scoring complete.");
  }

  private applyResolveEquipUpgrades(game: Game): void {
    this.assertEndPhaseStep(game, EndPhaseStep.EquipUpgrades);
    game.transitionTo(
      createEndPhaseGameState(
        EndPhaseStep.DiscardCards,
        null,
        game.firstPlayerId,
      ),
    );
    game.eventLog.push("Upgrade equipping complete.");
  }

  private applyResolveDiscardCards(game: Game): void {
    this.assertEndPhaseStep(game, EndPhaseStep.DiscardCards);
    game.transitionTo(
      createEndPhaseGameState(
        EndPhaseStep.DrawObjectives,
        null,
        game.firstPlayerId,
      ),
    );
    game.eventLog.push("Card discarding complete.");
  }

  private applyResolveDrawObjectives(game: Game): void {
    this.assertEndPhaseStep(game, EndPhaseStep.DrawObjectives);

    for (const player of game.players) {
      const cardsToDraw = Math.max(0, GameEngine.objectiveHandSize - player.objectiveHand.length);
      if (cardsToDraw === 0) {
        continue;
      }

      this.drawCards(
        player.objectiveDeck.drawPile,
        player.objectiveHand,
        cardsToDraw,
        CardZone.ObjectiveHand,
      );
      game.eventLog.push(`${player.name} drew ${cardsToDraw} objective card${cardsToDraw === 1 ? "" : "s"}.`);
    }

    game.transitionTo(
      createEndPhaseGameState(
        EndPhaseStep.DrawPowerCards,
        null,
        game.firstPlayerId,
      ),
    );
    game.eventLog.push("Objective drawing complete.");
  }

  private applyResolveDrawPowerCards(game: Game): void {
    this.assertEndPhaseStep(game, EndPhaseStep.DrawPowerCards);

    for (const player of game.players) {
      const cardsToDraw = Math.max(0, GameEngine.powerHandSize - player.powerHand.length);
      if (cardsToDraw === 0) {
        continue;
      }

      this.drawCards(
        player.powerDeck.drawPile,
        player.powerHand,
        cardsToDraw,
        CardZone.PowerHand,
      );
      game.eventLog.push(`${player.name} drew ${cardsToDraw} power card${cardsToDraw === 1 ? "" : "s"}.`);
    }

    game.transitionTo(
      createEndPhaseGameState(
        EndPhaseStep.Cleanup,
        null,
        game.firstPlayerId,
      ),
    );
    game.eventLog.push("Power card drawing complete.");
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
      hex.isStartingHex ||
      hex.kind === HexKind.Blocked ||
      hex.kind === HexKind.Stagger
    ) {
      return false;
    }

    if (!allowEdgePlacement && hex.isEdgeHex) {
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

  private requireOwnedDeployedFighter(player: PlayerState, fighterId: FighterId): FighterState {
    const fighter = player.getFighter(fighterId);
    if (fighter === undefined) {
      throw new Error(`Player ${player.name} does not control fighter ${fighterId}.`);
    }

    if (fighter.currentHexId === null || fighter.isSlain) {
      throw new Error(`Fighter ${fighter.id} is not deployed on the board.`);
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

  private requireTwoPlayers(game: Game): [PlayerState, PlayerState] {
    const [playerOne, playerTwo] = game.players;
    if (playerOne === undefined || playerTwo === undefined || game.players.length !== 2) {
      throw new Error("Roll-offs require exactly two players.");
    }

    return [playerOne, playerTwo];
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

  private assertActivePlayer(game: Game, playerId: PlayerId): void {
    if (game.activePlayerId !== playerId) {
      throw new Error(`Expected active player ${game.activePlayerId}, got ${playerId}.`);
    }
  }

  private assertStateKind(game: Game, expectedKind: Game["state"]["kind"]): void {
    if (game.state.kind !== expectedKind) {
      throw new Error(`Expected game state ${expectedKind}, got ${game.state.kind}.`);
    }
  }

  private assertCombatTurnStep(game: Game, expectedTurnStep: TurnStep): void {
    this.assertStateKind(game, "combatTurn");
    if (game.turnStep !== expectedTurnStep) {
      throw new Error(`Expected combat turn step ${expectedTurnStep}, got ${game.turnStep}.`);
    }
  }

  private assertEndPhaseStep(game: Game, expectedEndPhaseStep: EndPhaseStep): void {
    this.assertStateKind(game, "endPhase");
    if (game.endPhaseStep !== expectedEndPhaseStep) {
      throw new Error(`Expected end phase step ${expectedEndPhaseStep}, got ${game.endPhaseStep}.`);
    }
  }

  private getUnderdogPlayerId(playerOne: PlayerState, playerTwo: PlayerState): PlayerId | null {
    if (playerOne.glory === playerTwo.glory) {
      return null;
    }

    return playerOne.glory < playerTwo.glory ? playerOne.id : playerTwo.id;
  }

  private haveAllPlayersCompletedRoundTurns(game: Game): boolean {
    return game.players.every(
      (player) => player.turnsTakenThisRound >= GameEngine.turnsPerRound,
    );
  }

  private describeRollOff(game: Game, result: RollOffResult): string {
    const winner = this.requirePlayer(game, result.winnerPlayerId);
    const loser = this.requirePlayer(game, result.loserPlayerId);
    const decisiveRoundNumber = result.rounds.length;
    const tieBreakerSuffix = result.resolvedByTieBreaker ? " by tie-breaker" : "";

    return `${winner.name} won the ${result.context.kind} roll-off against ${loser.name} in round ${decisiveRoundNumber}${tieBreakerSuffix}.`;
  }

  private static copyCards(cards: readonly CardInstance[]): CardInstance[] {
    return [...cards];
  }
}
