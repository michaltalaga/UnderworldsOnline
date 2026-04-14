import { Card } from "../cards/Card";
import { type CardPlayContext } from "../cards/types";
import { getEffectiveAttackDice, getEffectiveHealth, getEffectiveSaveDice } from "../cards/upgradeEffects";
import { ConfirmCombatAction } from "../actions/ConfirmCombatAction";
import {
  RoundStartedEvent,
  TurnStartedEvent,
  ActionStepStartedEvent,
  ActionStepEndedEvent,
  PowerStepEndedEvent,
  TurnEndedEvent,
  TurnStepChangedEvent,
  FighterMovedEvent,
  FighterGuardedEvent,
  FighterFocusedEvent,
  FighterDelvedEvent,
  FighterSlainEvent,
  CombatStartedEvent,
  AttackDiceRolledEvent,
  SaveDiceRolledEvent,
  CombatResolvedEvent,
  CombatEndedEvent,
  CardPlayedEvent,
  CardResolvedEvent,
  PloyPlayedEvent,
  UpgradeEquippedEvent,
  WarscrollAbilityUsedEvent,
  PlayerPassedEvent,
  RollOffResolvedEvent,
} from "../events";
import { rollAttackDie, rollSaveDie } from "../rules/Dice";
import {
  CleanupResolution,
  CleanupTransitionKind,
  type CleanupFighterResolution,
  type CleanupPlayerResolution,
} from "../endPhase/CleanupResolution";
import { FeatureToken } from "../state/FeatureToken";
import { Fighter } from "../state/Fighter";
import { Game } from "../state/Game";
import { type GameEventMetadata, type GameEventInvokerKind, GameRecordKind } from "../state/GameRecord";
import {
  createCombatChooseFirstPlayerGameState,
  createCombatReadyGameState,
  createCombatTurnGameState,
  createEndPhaseGameState,
  createFinishedGameState,
  createSetupDeployFightersGameState,
  createSetupDetermineTerritoriesChoiceGameState,
  createSetupDetermineTerritoriesRollOffGameState,
  createSetupDrawStartingHandsGameState,
  createSetupMulliganGameState,
  createSetupPlaceFeatureTokensGameState,
  type GameState,
} from "../state/GameState";
import { HexCell } from "../state/HexCell";
import { Player } from "../state/Player";
import { Territory } from "../state/Territory";
import {
  RollOffKind,
  CardKind,
  CardZone,
  EndPhaseActionKind,
  EndPhaseStep,
  FeatureTokenSide,
  HexKind,
  ObjectiveConditionTiming,
  TurnStep,
} from "../values/enums";
import type { CardZone as CardZoneType, GameActionKind } from "../values/enums";
import type { CardId, FighterId, HexId, PlayerId, TerritoryId } from "../values/ids";
import { ChooseTerritoryAction } from "../setup/ChooseTerritoryAction";
import { CompleteMusterAction } from "../setup/CompleteMusterAction";
import { DeployFighterAction } from "../setup/DeployFighterAction";
import { DrawStartingHandsAction } from "../setup/DrawStartingHandsAction";
import { EndPhaseAction } from "../endPhase/EndPhaseAction";
import {
  ObjectiveDrawResolution,
  type ObjectiveDrawCardResolution,
  type ObjectiveDrawPlayerResolution,
} from "../endPhase/ObjectiveDrawResolution";
import {
  ObjectiveScoringResolution,
  type ObjectiveScoringCardResolution,
  type ObjectiveScoringPlayerResolution,
} from "../endPhase/ObjectiveScoringResolution";
import {
  PowerDrawResolution,
  type PowerDrawCardResolution,
  type PowerDrawPlayerResolution,
} from "../endPhase/PowerDrawResolution";
import { ActionStepEndedResolution } from "../rules/ActionStepEndedResolution";
import { ActionStepStartedResolution } from "../rules/ActionStepStartedResolution";
import { AttackAction } from "../actions/AttackAction";
import { CardPlayedResolution } from "../rules/CardPlayedResolution";
import { CardResolvedResolution } from "../rules/CardResolvedResolution";
import { ChargeAction } from "../actions/ChargeAction";
import { DelveAction } from "../actions/DelveAction";
import { EndActionStepAction } from "../actions/EndActionStepAction";
import { FocusAction } from "../actions/FocusAction";
import { GameAction } from "../actions/GameAction";
import { GuardAction } from "../actions/GuardAction";
import { MoveAction } from "../actions/MoveAction";
import { PassAction } from "../actions/PassAction";
import { PlayPloyAction } from "../actions/PlayPloyAction";
import { PlayUpgradeAction } from "../actions/PlayUpgradeAction";
import { PlaceFeatureTokenAction } from "../setup/PlaceFeatureTokenAction";
import { UseWarscrollAbilityAction } from "../actions/UseWarscrollAbilityAction";
import { ResolveCleanupAction } from "../endPhase/ResolveCleanupAction";
import { ResolveMulliganAction } from "../setup/ResolveMulliganAction";
import { ResolveTerritoryRollOffAction } from "../setup/ResolveTerritoryRollOffAction";
import { SetupAction } from "../setup/SetupAction";
import { ResolveDiscardCardsAction } from "../endPhase/ResolveDiscardCardsAction";
import { ResolveDrawObjectivesAction } from "../endPhase/ResolveDrawObjectivesAction";
import { ResolveDrawPowerCardsAction } from "../endPhase/ResolveDrawPowerCardsAction";
import { ResolveEquipUpgradesAction } from "../endPhase/ResolveEquipUpgradesAction";
import { ResolveScoreObjectivesAction } from "../endPhase/ResolveScoreObjectivesAction";
import { CombatActionService } from "../rules/CombatActionService";
import { getActiveCombatState } from "../rules/CombatStateProjection";
import { CombatContext } from "../rules/CombatContext";
import { CombatEndedResolution } from "../rules/CombatEndedResolution";
import { CombatResolver } from "../rules/CombatResolver";
import { DefaultCombatResolver } from "../rules/DefaultCombatResolver";
import { DefaultWarscrollEffectResolver } from "../rules/DefaultWarscrollEffectResolver";
import { DefaultVictoryResolver } from "../rules/DefaultVictoryResolver";
import { DelveResolution } from "../rules/DelveResolution";
import { CombatStartedResolution } from "../rules/CombatStartedResolution";
import { FighterSlainResolution } from "../rules/FighterSlainResolution";
import { FocusResolution, type FocusCardResolution } from "../rules/FocusResolution";
import { GuardResolution } from "../rules/GuardResolution";
import { MoveResolution } from "../rules/MoveResolution";
import { PassResolution } from "../rules/PassResolution";
import { PowerStepEndedResolution } from "../rules/PowerStepEndedResolution";
import { PloyResolution } from "../rules/PloyResolution";
import { RoundStartResolution, type RoundStartFeatureTokenResolution } from "../rules/RoundStartResolution";
import { RollOffContext } from "../rules/RollOffContext";
import { RollOffResolver } from "../rules/RollOffResolver";
import { type RollOffRoundInput } from "../rules/RollOffRound";
import { RollOffResult } from "../rules/RollOffResult";
import { TurnEndedResolution } from "../rules/TurnEndedResolution";
import { TurnStepChangeResolution } from "../rules/TurnStepChangeResolution";
import { TurnStartedResolution } from "../rules/TurnStartedResolution";
import { UpgradeResolution } from "../rules/UpgradeResolution";
import { WarscrollAbilityResolution } from "../rules/WarscrollAbilityResolution";
import { VictoryResolver } from "../rules/VictoryResolver";
import { WarscrollEffectResolver } from "../rules/WarscrollEffectResolver";

export type GameEngineShuffleCards = (cards: readonly Card[]) => Card[];

export class GameEngine {
  private static readonly objectiveHandSize = 3;
  private static readonly powerHandSize = 5;
  private static readonly turnsPerRound = 4;
  private readonly shuffleCards: GameEngineShuffleCards;
  private readonly rollOffResolver: RollOffResolver;
  private readonly combatActionService: CombatActionService;
  private readonly combatResolver: CombatResolver;
  private readonly victoryResolver: VictoryResolver;
  private readonly warscrollEffectResolver: WarscrollEffectResolver;
  private readonly manualScoringPlayerIds: ReadonlySet<PlayerId>;

  public constructor(
    shuffleCards: GameEngineShuffleCards = GameEngine.copyCards,
    rollOffResolver: RollOffResolver = new RollOffResolver(),
    combatResolver: CombatResolver = new DefaultCombatResolver(),
    victoryResolver: VictoryResolver = new DefaultVictoryResolver(),
    warscrollEffectResolver: WarscrollEffectResolver = new DefaultWarscrollEffectResolver(),
    combatActionService: CombatActionService = new CombatActionService(warscrollEffectResolver),
    manualScoringPlayerIds: ReadonlySet<PlayerId> = new Set(),
  ) {
    this.shuffleCards = shuffleCards;
    this.rollOffResolver = rollOffResolver;
    this.combatActionService = combatActionService;
    this.combatResolver = combatResolver;
    this.victoryResolver = victoryResolver;
    this.warscrollEffectResolver = warscrollEffectResolver;
    this.manualScoringPlayerIds = manualScoringPlayerIds;
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
    if (action instanceof AttackAction) {
      this.applyAttackAction(game, action);
      this.resolveAutoPlayableCards(game, this.createImmediateTriggerContext(action.kind));
      return game;
    }

    if (action instanceof ChargeAction) {
      this.applyChargeAction(game, action);
      this.resolveAutoPlayableCards(game, this.createImmediateTriggerContext(action.kind));
      return game;
    }

    if (action instanceof MoveAction) {
      this.applyMoveAction(game, action);
      this.resolveAutoPlayableCards(game, this.createImmediateTriggerContext(action.kind));
      return game;
    }

    if (action instanceof GuardAction) {
      this.applyGuardAction(game, action);
      this.resolveAutoPlayableCards(game, this.createImmediateTriggerContext(action.kind));
      return game;
    }

    if (action instanceof DelveAction) {
      this.applyDelveAction(game, action);
      this.resolveAutoPlayableCards(game, this.createImmediateTriggerContext(action.kind));
      return game;
    }

    if (action instanceof FocusAction) {
      this.applyFocusAction(game, action);
      this.resolveAutoPlayableCards(game, this.createImmediateTriggerContext(action.kind));
      return game;
    }

    if (action instanceof PlayPloyAction) {
      this.applyPlayPloyAction(game, action);
      this.resolveAutoPlayableCards(game, this.createImmediateTriggerContext(action.kind));
      return game;
    }

    if (action instanceof PlayUpgradeAction) {
      this.applyPlayUpgradeAction(game, action);
      this.resolveAutoPlayableCards(game, this.createImmediateTriggerContext(action.kind));
      return game;
    }

    if (action instanceof UseWarscrollAbilityAction) {
      this.applyUseWarscrollAbilityAction(game, action);
      this.resolveAutoPlayableCards(game, this.createImmediateTriggerContext(action.kind));
      return game;
    }

    if (action instanceof ConfirmCombatAction) {
      this.applyConfirmCombatAction(game, action);
      this.resolveAutoPlayableCards(game, this.createImmediateTriggerContext(action.kind));
      return game;
    }

    if (action instanceof EndActionStepAction) {
      this.applyEndActionStep(game, action);
      return game;
    }

    if (action instanceof PassAction) {
      this.applyPassAction(game, action);
      this.resolveAutoPlayableCards(game, this.createImmediateTriggerContext(action.kind));
      return game;
    }

    throw new Error(`Unsupported game action: ${action.kind}.`);
  }

  public applyEndPhaseAction(game: Game, action: EndPhaseAction): Game {
    if (action instanceof ResolveScoreObjectivesAction) {
      this.applyResolveScoreObjectives(game);
      this.resolveAutoPlayableCards(game, { triggerActionKind: action.kind });
      return game;
    }

    if (action instanceof ResolveEquipUpgradesAction) {
      this.applyResolveEquipUpgrades(game);
      this.resolveAutoPlayableCards(game, { triggerActionKind: action.kind });
      return game;
    }

    if (action instanceof ResolveDiscardCardsAction) {
      this.applyResolveDiscardCards(game);
      this.resolveAutoPlayableCards(game, { triggerActionKind: action.kind });
      return game;
    }

    if (action instanceof ResolveDrawObjectivesAction) {
      this.applyResolveDrawObjectives(game);
      this.resolveAutoPlayableCards(game, { triggerActionKind: action.kind });
      return game;
    }

    if (action instanceof ResolveDrawPowerCardsAction) {
      this.applyResolveDrawPowerCards(game);
      this.resolveAutoPlayableCards(game, { triggerActionKind: action.kind });
      return game;
    }

    if (action instanceof ResolveCleanupAction) {
      this.applyResolveCleanup(game);
      this.resolveAutoPlayableCards(game, { triggerActionKind: action.kind });
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

  public startCombatRound(
    game: Game,
    rounds: readonly RollOffRoundInput[],
    firstPlayerId: PlayerId,
  ): RollOffResult {
    const result = this.resolveFirstTurnRollOff(game, rounds);
    this.chooseFirstPlayer(game, result.winnerPlayerId, firstPlayerId);
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

    this.recordRoundStart(game, firstPlayer.id);
    this.transitionToState(
      game,
      createCombatTurnGameState(firstPlayer.id, firstPlayer.id, TurnStep.Action),
      { invokedByPlayer: chooser },
    );
    game.consecutivePasses = 0;
    game.eventLog.push(
      `${chooser.name} chose ${firstPlayer.name} to take the first turn. ${rollOffLoser.name} drew 1 power card.`,
    );
    this.resolveAutoPlayableCards(game, {});

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
    const player = this.requirePlayer(game, action.player.id);
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

    const currentPlayerIndex = game.players.indexOf(player);
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

    game.addRecord(GameRecordKind.RollOff, result, {
      invokedByPlayer: null,
      actionKind: action.kind,
    });
    game.emitEvent(new RollOffResolvedEvent(
      game.roundNumber,
      result.context.kind,
      playerOne,
      playerTwo,
      result.rounds,
      result.decisiveRound,
      this.requirePlayer(game, result.winnerPlayerId),
      this.requirePlayer(game, result.loserPlayerId),
      result.resolvedByTieBreaker,
    ));
    game.transitionTo(createSetupDetermineTerritoriesChoiceGameState(result.winnerPlayerId));
    game.eventLog.push(this.describeRollOff(game, result));
  }

  private applyChooseTerritory(game: Game, action: ChooseTerritoryAction): void {
    this.assertStateKind(game, "setupDetermineTerritoriesChoice");
    game.board.setSide(action.boardSide);

    if (game.board.territories.length !== 2) {
      throw new Error("Territory choice requires exactly two territories on the board.");
    }

    const winningPlayer = this.requirePlayer(game, action.player.id);
    this.assertActivePlayer(game, winningPlayer.id);
    const losingPlayer = this.requireOpponent(game, winningPlayer.id);
    const chosenTerritory = this.requireTerritory(game, action.territory.id);
    const remainingTerritory = game.board.territories.find(
      (territory) => territory.id !== chosenTerritory.id,
    );

    if (remainingTerritory === undefined) {
      throw new Error("Could not find the opposing territory.");
    }

    chosenTerritory.owner = winningPlayer;
    remainingTerritory.owner = losingPlayer;
    winningPlayer.territory = chosenTerritory;
    losingPlayer.territory = remainingTerritory;
    game.transitionTo(createSetupPlaceFeatureTokensGameState(losingPlayer.id));
    game.eventLog.push(
      `${winningPlayer.name} chose ${chosenTerritory.name} on the ${action.boardSide} board side.`,
    );
  }

  private applyPlaceFeatureToken(game: Game, action: PlaceFeatureTokenAction): void {
    this.assertStateKind(game, "setupPlaceFeatureTokens");
    const player = this.requirePlayer(game, action.player.id);
    this.assertActivePlayer(game, player.id);

    const placementNumber = game.board.featureTokens.length + 1;
    if (placementNumber > 5) {
      throw new Error("All feature tokens have already been placed.");
    }

    const hex = this.requireHex(game, action.hex.id);
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

    const featureToken = new FeatureToken(
      `feature:${placementNumber}`,
      placementNumber,
      hex,
      FeatureTokenSide.Hidden,
    );
    game.board.featureTokens.push(featureToken);
    hex.featureToken = featureToken;
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
    const player = this.requirePlayer(game, action.player.id);
    this.assertActivePlayer(game, player.id);

    const fighter = this.requireOwnedUndeployedFighter(player, action.fighter.id);
    const territoryId = this.requirePlayerTerritory(player);
    const hex = this.requireHex(game, action.hex.id);

    if (!hex.isStartingHex) {
      throw new Error(`Hex ${hex.id} is not a starting hex.`);
    }

    if (hex.territoryId !== territoryId) {
      throw new Error(`Hex ${hex.id} is not in ${player.name}'s territory.`);
    }

    if (hex.occupantFighterId !== null) {
      throw new Error(`Hex ${hex.id} is already occupied.`);
    }

    fighter.currentHex = hex;
    hex.occupantFighter = fighter;
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
      throw new Error(`Move path ${action.path.join(" -> ")} is not legal for fighter ${action.fighter.id}.`);
    }

    const player = this.requirePlayer(game, action.player.id);
    this.assertActivePlayer(game, player.id);

    const fighter = this.requireOwnedDeployedFighter(player, action.fighter.id);
    const fighterDefinition = fighter.definition;
    if (fighterDefinition === undefined) {
      throw new Error(`Could not find fighter definition for ${fighter.id}.`);
    }

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

    currentHex.occupantFighter = null;
    this.syncFeatureTokenHolderAtHex(game, currentHex.id);
    destinationHex.occupantFighter = fighter;
    this.syncFeatureTokenHolderAtHex(game, destinationHex.id);
    fighter.currentHex = destinationHex;
    fighter.hasMoveToken = true;
    const hadStaggerTokenBeforeMove = fighter.hasStaggerToken;
    if (destinationHex.kind === HexKind.Stagger) {
      fighter.hasStaggerToken = true;
    }
    this.recordMoveEvent(
      game,
      player,
      fighter,
      currentHex,
      destinationHex,
      action.path,
      destinationHex.kind,
      !hadStaggerTokenBeforeMove && fighter.hasStaggerToken,
      {
        invokedByPlayer: player,
        invokedByFighter: fighter,
        actionKind: action.kind,
      },
    );

    game.consecutivePasses = 0;
    game.eventLog.push(`${player.name} moved fighter ${fighter.id} to ${destinationHex.id}.`);
  }

  private applyAttackAction(game: Game, action: AttackAction): void {
    this.assertCombatTurnStep(game, TurnStep.Action);
    if (!this.combatActionService.isLegalAttackAction(game, action)) {
      throw new Error(`Attack action is not legal for fighter ${action.attacker.id} against ${action.target.id}.`);
    }

    const attackerPlayer = this.requirePlayer(game, action.player.id);
    this.assertActivePlayer(game, attackerPlayer.id);

    const defenderPlayer = this.requireOpponent(game, attackerPlayer.id);
    const attacker = this.requireOwnedDeployedFighter(attackerPlayer, action.attacker.id);
    const attackerDefinition = attacker.definition;
    const target = defenderPlayer.getFighter(action.target.id);
    const targetDefinition = defenderPlayer.getFighterDefinition(action.target.id);
    if (
      attackerDefinition === undefined ||
      target === undefined ||
      targetDefinition === undefined ||
      target.currentHexId === null ||
      target.isSlain
    ) {
      throw new Error(`Attack target ${action.target.id} is not available.`);
    }

    const weapon = attackerPlayer.getFighterWeaponDefinition(attacker.id, action.weapon.id);
    if (weapon === undefined) {
      throw new Error(`Fighter ${attacker.id} does not have weapon ${action.weapon.id}.`);
    }

    // Roll attack dice and store as pending. Save dice are rolled on the
    // next ConfirmCombatAction advance (mirrors the rulebook sequence).
    const attackDiceCount = getEffectiveAttackDice(weapon, attackerPlayer, attacker);
    const attackRoll = action.attackRoll ?? Array.from({ length: attackDiceCount }, () => rollAttackDie());

    game.emitEvent(new AttackDiceRolledEvent(
      game.roundNumber,
      attackerPlayer,
      defenderPlayer,
      attacker,
      target,
      weapon,
      action.selectedAbility,
      attackRoll,
      action.kind,
    ));

    game.consecutivePasses = 0;
    game.eventLog.push(
      `${attackerPlayer.name} rolled attack dice against ${targetDefinition.name} with ${weapon.name}.`,
    );
  }

  private applyChargeAction(game: Game, action: ChargeAction): void {
    this.assertCombatTurnStep(game, TurnStep.Action);
    if (!this.combatActionService.isLegalChargeAction(game, action)) {
      throw new Error(`Charge action is not legal for fighter ${action.fighter.id} against ${action.target.id}.`);
    }

    const attackerPlayer = this.requirePlayer(game, action.player.id);
    this.assertActivePlayer(game, attackerPlayer.id);

    const defenderPlayer = this.requireOpponent(game, attackerPlayer.id);
    const attacker = this.requireOwnedDeployedFighter(attackerPlayer, action.fighter.id);
    const attackerDefinition = attacker.definition;
    const target = defenderPlayer.getFighter(action.target.id);
    const targetDefinition = defenderPlayer.getFighterDefinition(action.target.id);
    if (
      attackerDefinition === undefined ||
      target === undefined ||
      targetDefinition === undefined ||
      target.currentHexId === null ||
      target.isSlain
    ) {
      throw new Error(`Charge target ${action.target.id} is not available.`);
    }

    const weapon = attackerPlayer.getFighterWeaponDefinition(attacker.id, action.weapon.id);
    if (weapon === undefined) {
      throw new Error(`Fighter ${attacker.id} does not have weapon ${action.weapon.id}.`);
    }

    const currentHexId = attacker.currentHexId;
    if (currentHexId === null) {
      throw new Error(`Fighter ${attacker.id} is not deployed on the board.`);
    }

    const destinationHexId = action.path[action.path.length - 1];
    if (destinationHexId === undefined) {
      throw new Error(`Charge action for fighter ${attacker.id} requires a destination hex.`);
    }

    const currentHex = this.requireHex(game, currentHexId);
    const destinationHex = this.requireHex(game, destinationHexId);
    currentHex.occupantFighter = null;
    this.syncFeatureTokenHolderAtHex(game, currentHex.id);
    destinationHex.occupantFighter = attacker;
    this.syncFeatureTokenHolderAtHex(game, destinationHex.id);
    attacker.currentHex = destinationHex;
    const hadStaggerTokenBeforeMove = attacker.hasStaggerToken;
    if (destinationHex.kind === HexKind.Stagger) {
      attacker.hasStaggerToken = true;
    }
    this.recordMoveEvent(
      game,
      attackerPlayer,
      attacker,
      currentHex,
      destinationHex,
      action.path,
      destinationHex.kind,
      !hadStaggerTokenBeforeMove && attacker.hasStaggerToken,
      {
        invokedByPlayer: attackerPlayer,
        invokedByFighter: attacker,
        actionKind: action.kind,
      },
    );

    const attackDiceCount = getEffectiveAttackDice(weapon, attackerPlayer, attacker);
    const attackRoll = action.attackRoll ?? Array.from({ length: attackDiceCount }, () => rollAttackDie());

    attacker.hasChargeToken = true;

    game.emitEvent(new AttackDiceRolledEvent(
      game.roundNumber,
      attackerPlayer,
      defenderPlayer,
      attacker,
      target,
      weapon,
      action.selectedAbility,
      attackRoll,
      action.kind,
    ));

    game.consecutivePasses = 0;
    game.eventLog.push(
      `${attackerPlayer.name} charged ${attackerDefinition.name} to ${destinationHex.id} and rolled attack dice against ${targetDefinition.name}.`,
    );
  }

  /**
   * Advances the pending combat to the next phase.
   *
   *   attack-rolled  →  save-rolled   (roll save dice)
   *   save-rolled    →  resolved      (compute outcome)
   *   resolved       →  (done)        (apply damage, clear pending)
   */
  private applyConfirmCombatAction(game: Game, _action: ConfirmCombatAction): void {
    const combatState = getActiveCombatState(game);
    if (combatState === null) {
      throw new Error("No active combat to confirm.");
    }

    const attackerPlayer = combatState.attackerPlayer;
    const defenderPlayer = combatState.defenderPlayer;
    const target = combatState.target;
    const targetDefinition = target.definition;

    // --- Phase: attack-rolled → save-rolled ---
    if (combatState.phase === "attack-rolled") {
      if (targetDefinition === undefined) return;
      const saveDiceCount = getEffectiveSaveDice(targetDefinition, defenderPlayer, target);
      const saveRoll = Array.from({ length: saveDiceCount }, () => rollSaveDie());
      game.emitEvent(new SaveDiceRolledEvent(
        game.roundNumber,
        attackerPlayer,
        defenderPlayer,
        combatState.attacker,
        target,
        combatState.weapon,
        combatState.selectedAbility,
        combatState.attackRoll,
        saveRoll,
        combatState.actionKind,
      ));
      game.eventLog.push(`Save dice rolled for ${targetDefinition.name}.`);
      return;
    }

    // --- Phase: save-rolled → resolved ---
    if (combatState.phase === "save-rolled") {
      const attacker = combatState.attacker;
      const attackerDef = attacker.definition;
      if (attackerDef === undefined || targetDefinition === undefined) return;

      const combatResult = this.combatResolver.resolve(
        game,
        new CombatContext(
          attackerPlayer,
          defenderPlayer,
          attacker,
          target,
          combatState.weapon,
          combatState.selectedAbility,
        ),
        [...combatState.attackRoll],
        [...combatState.saveRoll],
      );

      // Emit a CombatResolvedEvent — this advances the phase to "resolved"
      game.emitEvent(new CombatResolvedEvent(
        game.roundNumber,
        attackerPlayer,
        defenderPlayer,
        attacker,
        target,
        combatState.weapon,
        combatState.selectedAbility,
        combatResult.selectedAbilityRequiresCritical,
        combatResult.selectedAbilityTriggered,
        combatState.attackRoll,
        combatState.saveRoll,
        combatResult.outcome,
        combatResult.attackSuccesses,
        combatResult.saveSuccesses,
        combatResult.attackCriticals,
        combatResult.saveCriticals,
        combatResult.damageInflicted,
        false, // targetSlain — not known yet
        false, // targetMoved
        false, // attackerMoved
        combatResult.staggerApplied,
        combatState.actionKind,
      ));
      game.eventLog.push(
        `Outcome: ${combatResult.outcome} — ${combatResult.damageInflicted} damage.`,
      );
      return;
    }

    // --- Phase: resolved → apply damage and finish ---
    if (combatState.phase === "resolved") {
      const attacker = combatState.attacker;
      const attackerDefinition = attacker.definition;
      if (
        attackerDefinition === undefined ||
        targetDefinition === undefined ||
        target.currentHexId === null || target.isSlain
      ) {
        return;
      }

      const { combatResult, targetSlain } = this.resolveCombatAction(
        game, attackerPlayer, defenderPlayer,
        attacker, attackerDefinition, target, targetDefinition,
        combatState.weapon.id, combatState.weapon.name, combatState.selectedAbility,
        [...combatState.attackRoll], [...combatState.saveRoll], combatState.actionKind,
      );

      const damageText = combatResult.damageInflicted === 0
        ? "dealt no damage"
        : `dealt ${combatResult.damageInflicted} damage`;
      const effectText = [
        combatResult.staggerApplied ? `staggered ${targetDefinition.name}` : null,
        targetSlain ? `slew ${targetDefinition.name}` : null,
      ].filter((text): text is string => text !== null);
      const effectSuffix = effectText.length === 0 ? "" : `, ${effectText.join(", ")}`;
      game.eventLog.push(`Combat resolved: ${damageText}${effectSuffix}.`);
    }
  }

  private applyGuardAction(game: Game, action: GuardAction): void {
    this.assertCombatTurnStep(game, TurnStep.Action);
    if (!this.combatActionService.isLegalGuardAction(game, action)) {
      throw new Error(`Guard action is not legal for fighter ${action.fighter.id}.`);
    }

    const player = this.requirePlayer(game, action.player.id);
    this.assertActivePlayer(game, player.id);

    const fighter = this.requireOwnedDeployedFighter(player, action.fighter.id);
    const fighterDefinition = fighter.definition;
    if (fighterDefinition === undefined) {
      throw new Error(`Could not find fighter definition for ${fighter.id}.`);
    }

    fighter.hasGuardToken = true;
    game.addRecord(
      GameRecordKind.Guard,
      new GuardResolution(player, fighter),
      {
        invokedByPlayer: player,
        invokedByFighter: fighter,
        actionKind: action.kind,
      },
    );
    game.emitEvent(new FighterGuardedEvent(
      game.roundNumber,
      player,
      fighter,
      action.kind,
    ));

    game.consecutivePasses = 0;
    game.eventLog.push(`${player.name} put fighter ${fighter.id} on guard.`);
  }

  private applyDelveAction(game: Game, action: DelveAction): void {
    this.assertCombatTurnStep(game, TurnStep.Power);
    if (!this.combatActionService.isLegalDelveAction(game, action)) {
      throw new Error(
        `Delve action is not legal for fighter ${action.fighter.id} on feature token ${action.featureToken.id}.`,
      );
    }

    const player = this.requirePlayer(game, action.player.id);
    this.assertActivePlayer(game, player.id);

    const fighter = this.requireOwnedDeployedFighter(player, action.fighter.id);
    const fighterDefinition = fighter.definition;
    if (fighterDefinition === undefined) {
      throw new Error(`Could not find fighter definition for ${fighter.id}.`);
    }

    const fighterHexId = fighter.currentHexId;
    if (fighterHexId === null) {
      throw new Error(`Fighter ${fighter.id} is not on the board to delve.`);
    }

    const fighterHex = this.requireHex(game, fighterHexId);
    if (fighterHex.featureTokenId !== action.featureToken.id) {
      throw new Error(
        `Fighter ${fighter.id} is not on feature token ${action.featureToken.id}.`,
      );
    }

    const featureToken = game.board.getFeatureToken(action.featureToken.id);
    if (featureToken === undefined) {
      throw new Error(`Unknown feature token ${action.featureToken.id}.`);
    }

    const sideBeforeDelve = featureToken.side;
    if (featureToken.side === FeatureTokenSide.Treasure) {
      featureToken.side = FeatureTokenSide.Cover;
    } else if (featureToken.side === FeatureTokenSide.Cover) {
      featureToken.side = FeatureTokenSide.Treasure;
    } else {
      throw new Error(`Feature token ${featureToken.id} cannot be delved from side ${featureToken.side}.`);
    }

    const hadStaggerTokenBeforeDelve = fighter.hasStaggerToken;
    this.syncFeatureTokenHolderAtHex(game, fighterHex.id);
    fighter.hasStaggerToken = true;
    player.hasDelvedThisPowerStep = true;
    const holderAfterDelve = featureToken.heldByFighter;
    const resolution = new DelveResolution(
      game.roundNumber,
      player,
      fighter,
      featureToken,
      sideBeforeDelve,
      featureToken.side,
      !hadStaggerTokenBeforeDelve && fighter.hasStaggerToken,
      holderAfterDelve,
    );
    game.addRecord(GameRecordKind.Delve, resolution, {
      invokedByPlayer: player,
      invokedByFighter: fighter,
      actionKind: action.kind,
    });
    game.emitEvent(new FighterDelvedEvent(
      game.roundNumber,
      player,
      fighter,
      featureToken.id,
      fighterHex.id,
      sideBeforeDelve,
      featureToken.side,
      !hadStaggerTokenBeforeDelve && fighter.hasStaggerToken,
      holderAfterDelve,
      action.kind,
    ));
    game.consecutivePasses = 0;
    const effectText = [
      `It is now a ${featureToken.side} token`,
      `${fighter.id} gained a stagger token`,
    ].filter((text): text is string => text !== null);
    game.eventLog.push(
      `${player.name} delved feature token ${featureToken.id} with fighter ${fighter.id}. `
      + `${effectText.join(" and ")}.`,
    );
  }

  private applyFocusAction(game: Game, action: FocusAction): void {
    this.assertCombatTurnStep(game, TurnStep.Action);
    if (!this.combatActionService.isLegalFocusAction(game, action)) {
      throw new Error(`Focus action is not legal for player ${action.player.id}.`);
    }

    const player = this.requirePlayer(game, action.player.id);
    this.assertActivePlayer(game, player.id);

    const discardedObjectives = action.objectiveCards.map((card) =>
      this.discardFocusCard(
        player,
        card.id,
        player.objectiveHand,
        player.objectiveDeck.discardPile,
        CardZone.ObjectiveDiscard,
      ),
    );
    const discardedPowerCards = action.powerCards.map((card) =>
      this.discardFocusCard(
        player,
        card.id,
        player.powerHand,
        player.powerDeck.discardPile,
        CardZone.PowerDiscard,
      ),
    );
    const drawnObjectives = this.drawFocusCards(
      player.objectiveDeck.drawPile,
      player.objectiveHand,
      discardedObjectives.length,
      CardZone.ObjectiveHand,
    );
    const drawnPowerCards = [
      ...this.drawFocusCards(
        player.powerDeck.drawPile,
        player.powerHand,
        discardedPowerCards.length,
        CardZone.PowerHand,
      ),
      ...this.drawFocusCards(
        player.powerDeck.drawPile,
        player.powerHand,
        1,
        CardZone.PowerHand,
      ),
    ];

    const resolution = new FocusResolution(
      player,
      discardedObjectives,
      discardedPowerCards,
      drawnObjectives,
      drawnPowerCards,
    );
    game.addRecord(GameRecordKind.Focus, resolution, {
      invokedByPlayer: player,
      actionKind: action.kind,
    });
    game.emitEvent(new FighterFocusedEvent(
      game.roundNumber,
      player,
      discardedObjectives.map((fc) => player.getCard(fc.cardId)).filter((c): c is Card => c !== undefined),
      discardedPowerCards.map((fc) => player.getCard(fc.cardId)).filter((c): c is Card => c !== undefined),
      drawnObjectives.map((fc) => player.getCard(fc.cardId)).filter((c): c is Card => c !== undefined),
      drawnPowerCards.map((fc) => player.getCard(fc.cardId)).filter((c): c is Card => c !== undefined),
      action.kind,
    ));
    game.consecutivePasses = 0;
    game.eventLog.push(
      `${player.name} focused, discarded ${discardedObjectives.length} objective card${discardedObjectives.length === 1 ? "" : "s"} `
      + `and ${discardedPowerCards.length} power card${discardedPowerCards.length === 1 ? "" : "s"}, `
      + `then drew ${drawnObjectives.length} objective card${drawnObjectives.length === 1 ? "" : "s"} `
      + `and ${drawnPowerCards.length} power card${drawnPowerCards.length === 1 ? "" : "s"}.`,
    );
  }

  private applyEndActionStep(game: Game, action: EndActionStepAction): void {
    this.assertCombatTurnStep(game, TurnStep.Action);
    const player = this.requirePlayer(game, action.player.id);
    this.assertActivePlayer(game, player.id);

    const firstPlayerId = game.firstPlayerId;
    if (firstPlayerId === null) {
      throw new Error("Combat turn state requires a first player id.");
    }

    this.transitionToState(
      game,
      createCombatTurnGameState(firstPlayerId, player.id, TurnStep.Power),
      {
        invokedByPlayer: player,
        actionKind: action.kind,
      },
    );
    game.eventLog.push(`${player.name} ended the action step.`);
  }

  private applyPlayPloyAction(game: Game, action: PlayPloyAction): void {
    // Reaction ploys are playable during the action step while
    // combat is active (the card itself gates timing via canPlay).
    if (getActiveCombatState(game) === null) {
      this.assertCombatTurnStep(game, TurnStep.Power);
    }
    if (!this.combatActionService.isLegalPlayPloyAction(game, action)) {
      throw new Error(`Ploy play is not legal for card ${action.card.id}.`);
    }

    const player = this.requirePlayer(game, action.player.id);
    this.assertActivePlayer(game, player.id);

    const card = player.getCard(action.card.id);
    if (card === undefined) {
      throw new Error(`Player ${player.name} does not have ploy card ${action.card.id}.`);
    }

    if (card.kind !== CardKind.Ploy) {
      throw new Error(`Card ${card.name} is not a ploy.`);
    }

    const ployTarget = this.getPloyTargetDetails(game, action.targetFighter?.id ?? null);
    this.recordCardPlayed(
      game,
      player,
      card,
      {
        invokedByPlayer: player,
        invokedByCard: card,
        actionKind: action.kind,
      },
      { target: ployTarget },
    );

    // Apply the card's specific effect (guard token, push, heal, etc.)
    const targetFighter = action.targetFighter;
    const effectDescriptions = card.applyEffect(game, targetFighter ?? player);

    // Move card from hand to discard pile.
    const handIndex = player.powerHand.indexOf(card);
    if (handIndex !== -1) {
      player.powerHand.splice(handIndex, 1);
    }
    card.zone = CardZone.PowerDiscard;
    card.revealed = true;
    player.powerDeck.discardPile.push(card);

    const resolution = new PloyResolution(
      player,
      card,
      targetFighter,
      [], // ployEffects — no longer tracked on Card; will be migrated later
      effectDescriptions,
    );
    game.addRecord(GameRecordKind.Ploy, resolution, {
      invokedByPlayer: player,
      invokedByCard: card,
      actionKind: action.kind,
    });
    game.emitEvent(new PloyPlayedEvent(
      game.roundNumber,
      player,
      card,
      targetFighter ?? null,
      targetFighter !== null && targetFighter !== undefined
        ? game.players.find((p) => p.getFighter(targetFighter.id) !== undefined) ?? null
        : null,
      [], // ployEffects — not tracked on Card yet
      effectDescriptions,
      action.kind,
    ));
    this.recordCardResolved(
      game,
      player,
      card,
      effectDescriptions,
      0,
      {
        invokedByPlayer: player,
        invokedByCard: card,
        actionKind: action.kind,
      },
      { target: ployTarget },
    );
    game.consecutivePasses = 0;
    const effectSuffix = effectDescriptions.length > 0 ? ` and ${effectDescriptions.join(", ")}` : "";
    game.eventLog.push(`${player.name} played ploy ${card.name}${effectSuffix}.`);
  }

  private applyPlayUpgradeAction(game: Game, action: PlayUpgradeAction): void {
    this.assertCombatTurnStep(game, TurnStep.Power);
    if (!this.combatActionService.isLegalPlayUpgradeAction(game, action)) {
      throw new Error(`Upgrade play is not legal for card ${action.card.id} on fighter ${action.fighter.id}.`);
    }

    const player = this.requirePlayer(game, action.player.id);
    this.assertActivePlayer(game, player.id);

    const card = player.getCard(action.card.id);
    const fighter = this.requireOwnedDeployedFighter(player, action.fighter.id);
    if (card === undefined) {
      throw new Error(`Player ${player.name} does not have upgrade card ${action.card.id}.`);
    }

    if (card.kind !== CardKind.Upgrade) {
      throw new Error(`Card ${card.name} is not an upgrade.`);
    }

    const fighterDefinition = fighter.definition;
    if (fighterDefinition === undefined) {
      throw new Error(`Could not find fighter definition for ${fighter.id}.`);
    }

    const upgradeTarget = this.getPloyTargetDetails(game, fighter.id);
    this.recordCardPlayed(
      game,
      player,
      card,
      {
        invokedByPlayer: player,
        invokedByFighter: fighter,
        invokedByCard: card,
        actionKind: action.kind,
      },
      { target: upgradeTarget },
    );

    // Inline upgrade play effects: move card from hand to equipped, attach to fighter, pay glory.
    const handIndex = player.powerHand.indexOf(card);
    if (handIndex !== -1) {
      player.powerHand.splice(handIndex, 1);
    }
    card.zone = CardZone.Equipped;
    card.revealed = true;
    card.attachedToFighter = fighter;
    player.equippedUpgrades.push(card);

    const upgradeCost = card.gloryValue;
    player.glory -= upgradeCost;

    const effectDescriptions: string[] = [];

    const resolution = new UpgradeResolution(
      player,
      card,
      fighter,
      upgradeCost,
    );
    game.addRecord(GameRecordKind.Upgrade, resolution, {
      invokedByPlayer: player,
      invokedByFighter: fighter,
      invokedByCard: card,
      actionKind: action.kind,
    });
    game.emitEvent(new UpgradeEquippedEvent(
      game.roundNumber,
      player,
      card,
      fighter,
      upgradeCost,
      action.kind,
    ));
    this.recordCardResolved(
      game,
      player,
      card,
      [...effectDescriptions, `equipped to ${fighterDefinition.name}`, `paid ${upgradeCost} glory`],
      -upgradeCost,
      {
        invokedByPlayer: player,
        invokedByFighter: fighter,
        invokedByCard: card,
        actionKind: action.kind,
      },
      { target: upgradeTarget },
    );
    game.consecutivePasses = 0;
    game.eventLog.push(
      `${player.name} played upgrade ${card.name} on fighter ${fighter.id} for ${upgradeCost} glory.`,
    );
  }

  private applyUseWarscrollAbilityAction(game: Game, action: UseWarscrollAbilityAction): void {
    this.assertCombatTurnStep(game, TurnStep.Power);
    if (!this.combatActionService.isLegalUseWarscrollAbilityAction(game, action)) {
      throw new Error(`Warscroll ability ${action.abilityIndex} is not legal for player ${action.player.id}.`);
    }

    const player = this.requirePlayer(game, action.player.id);
    this.assertActivePlayer(game, player.id);

    const warscroll = player.getWarscrollWithDefinition();
    const ability = warscroll?.definition.getAbility(action.abilityIndex);
    if (warscroll === undefined || ability === undefined) {
      throw new Error(`Player ${player.name} does not have warscroll ability ${action.abilityIndex}.`);
    }

    for (const [tokenName, tokenCost] of Object.entries(ability.tokenCosts)) {
      const currentTokenCount = player.warscrollState.tokens[tokenName] ?? 0;
      if (currentTokenCount < tokenCost) {
        throw new Error(`${player.name} cannot pay ${tokenCost} ${tokenName} warscroll token(s).`);
      }

      player.warscrollState.tokens[tokenName] = currentTokenCount - tokenCost;
    }

    const effectSummaries = this.warscrollEffectResolver.resolve(game, player, ability);
    const resolution = new WarscrollAbilityResolution(
      player,
      warscroll.definition.name,
      action.abilityIndex,
      ability.name,
      { ...ability.tokenCosts },
      ability.effects,
      effectSummaries,
    );

    game.addRecord(GameRecordKind.WarscrollAbility, resolution, {
      invokedByPlayer: player,
      actionKind: action.kind,
    });
    game.emitEvent(new WarscrollAbilityUsedEvent(
      game.roundNumber,
      player,
      warscroll.definition.name,
      action.abilityIndex,
      ability.name,
      { ...ability.tokenCosts },
      ability.effects,
      effectSummaries,
      action.kind,
    ));
    game.consecutivePasses = 0;
    game.eventLog.push(
      `${player.name} used warscroll ability ${ability.name} and ${resolution.effectSummaries.join(" and ")}.`,
    );
  }

  private applyPassAction(game: Game, action: PassAction): void {
    this.assertStateKind(game, "combatTurn");

    const player = this.requirePlayer(game, action.player.id);
    this.assertActivePlayer(game, player.id);

    const firstPlayerId = game.firstPlayerId;
    if (firstPlayerId === null) {
      throw new Error("Combat turn state requires a first player id.");
    }

    if (game.turnStep === TurnStep.Action) {
      const consecutivePassesBefore = game.consecutivePasses;
      const turnsTakenBefore = player.turnsTakenThisRound;
      const nextState = createCombatTurnGameState(firstPlayerId, player.id, TurnStep.Power);
      game.consecutivePasses += 1;
      game.addRecord(
        GameRecordKind.Pass,
        new PassResolution(
          player,
          TurnStep.Action,
          nextState.phase,
          consecutivePassesBefore,
          game.consecutivePasses,
          turnsTakenBefore,
          player.turnsTakenThisRound,
          player,
          nextState.turnStep,
          false,
        ),
        {
          invokedByPlayer: player,
          actionKind: action.kind,
        },
      );
      game.emitEvent(new PlayerPassedEvent(
        game.roundNumber,
        player,
        TurnStep.Action,
        nextState.phase,
        consecutivePassesBefore,
        game.consecutivePasses,
        turnsTakenBefore,
        player.turnsTakenThisRound,
        player,
        nextState.turnStep,
        false,
        action.kind,
      ));
      this.transitionToState(
        game,
        nextState,
        {
          invokedByPlayer: player,
          actionKind: action.kind,
        },
      );
      game.eventLog.push(`${player.name} passed their action step.`);
      return;
    }

    if (game.turnStep === TurnStep.Power) {
      const consecutivePassesBefore = game.consecutivePasses;
      const turnsTakenBefore = player.turnsTakenThisRound;
      player.turnsTakenThisRound += 1;
      player.hasDelvedThisPowerStep = false;

      if (this.haveAllPlayersCompletedRoundTurns(game)) {
        const nextState = createEndPhaseGameState(EndPhaseStep.ScoreObjectives, null, firstPlayerId);
        game.consecutivePasses = 0;
        game.addRecord(
          GameRecordKind.Pass,
          new PassResolution(
            player,
            TurnStep.Power,
            nextState.phase,
            consecutivePassesBefore,
            game.consecutivePasses,
            turnsTakenBefore,
            player.turnsTakenThisRound,
            null,
            nextState.turnStep,
            true,
          ),
          {
            invokedByPlayer: player,
            actionKind: action.kind,
          },
        );
        game.emitEvent(new PlayerPassedEvent(
          game.roundNumber,
          player,
          TurnStep.Power,
          nextState.phase,
          consecutivePassesBefore,
          game.consecutivePasses,
          turnsTakenBefore,
          player.turnsTakenThisRound,
          null,
          nextState.turnStep,
          true,
          action.kind,
        ));
        this.transitionToState(
          game,
          nextState,
          {
            invokedByPlayer: player,
            actionKind: action.kind,
          },
        );
        game.eventLog.push(`Round ${game.roundNumber} combat turns complete. End phase begins.`);
        return;
      }

      const nextPlayer = this.requireOpponent(game, player.id);
      nextPlayer.hasDelvedThisPowerStep = false;

      const nextState = createCombatTurnGameState(firstPlayerId, nextPlayer.id, TurnStep.Action);
      game.consecutivePasses += 1;
      game.addRecord(
        GameRecordKind.Pass,
        new PassResolution(
          player,
          TurnStep.Power,
          nextState.phase,
          consecutivePassesBefore,
          game.consecutivePasses,
          turnsTakenBefore,
          player.turnsTakenThisRound,
          nextPlayer,
          nextState.turnStep,
          false,
        ),
        {
          invokedByPlayer: player,
          actionKind: action.kind,
        },
      );
      game.emitEvent(new PlayerPassedEvent(
        game.roundNumber,
        player,
        TurnStep.Power,
        nextState.phase,
        consecutivePassesBefore,
        game.consecutivePasses,
        turnsTakenBefore,
        player.turnsTakenThisRound,
        nextPlayer,
        nextState.turnStep,
        false,
        action.kind,
      ));
      this.transitionToState(
        game,
        nextState,
        {
          invokedByPlayer: player,
          actionKind: action.kind,
        },
      );
      game.eventLog.push(`${player.name} passed their power step.`);
      return;
    }

    throw new Error(`Unsupported combat turn step ${game.turnStep}.`);
  }

  private applyResolveScoreObjectives(game: Game): void {
    this.assertEndPhaseStep(game, EndPhaseStep.ScoreObjectives);

    const scoringContext = this.createEndPhaseTriggerContext(EndPhaseActionKind.ResolveScoreObjectives);
    const playerResolutions: ObjectiveScoringPlayerResolution[] = [];
    for (const player of game.players) {
      if (this.manualScoringPlayerIds.has(player.id)) {
        playerResolutions.push({
          playerId: player.id,
          playerName: player.name,
          gloryGained: 0,
          scoredObjectives: [],
        });
        continue;
      }
      playerResolutions.push(
        this.scoreObjectivesForPlayer(game, player, scoringContext),
      );
    }

    const resolution = new ObjectiveScoringResolution(game.roundNumber, playerResolutions);
    game.addRecord(GameRecordKind.ObjectiveScoring, resolution, {
      actionKind: EndPhaseActionKind.ResolveScoreObjectives,
    });
    // TODO: emit ObjectivesScoredEvent for Phase 1 (requires building snapshot arrays with object references from string-ID sub-resolutions)
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

    const playerResolutions: ObjectiveDrawPlayerResolution[] = [];
    for (const player of game.players) {
      const handSizeBefore = player.objectiveHand.length;
      const cardsToDraw = Math.max(0, GameEngine.objectiveHandSize - player.objectiveHand.length);
      const drawnCards: ObjectiveDrawCardResolution[] = [];

      if (cardsToDraw === 0) {
        playerResolutions.push({
          playerId: player.id,
          playerName: player.name,
          cardsDrawn: drawnCards,
        });
        continue;
      }

      this.drawCards(
        player.objectiveDeck.drawPile,
        player.objectiveHand,
        cardsToDraw,
        CardZone.ObjectiveHand,
      );

      for (const card of player.objectiveHand.slice(handSizeBefore)) {
        drawnCards.push({
          cardId: card.id,
          cardDefinitionId: card.name, // Card IS the definition — use name as identifier
          cardName: card.name,
        });
      }

      playerResolutions.push({
        playerId: player.id,
        playerName: player.name,
        cardsDrawn: drawnCards,
      });
      game.eventLog.push(`${player.name} drew ${cardsToDraw} objective card${cardsToDraw === 1 ? "" : "s"}.`);
    }

    const resolution = new ObjectiveDrawResolution(game.roundNumber, playerResolutions);
    game.addRecord(GameRecordKind.ObjectiveDraw, resolution, {
      actionKind: EndPhaseActionKind.ResolveDrawObjectives,
    });
    // TODO: emit ObjectivesDrawnEvent for Phase 1 (requires building snapshot arrays with object references from string-ID sub-resolutions)
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

    const playerResolutions: PowerDrawPlayerResolution[] = [];
    for (const player of game.players) {
      const handSizeBefore = player.powerHand.length;
      const cardsToDraw = Math.max(0, GameEngine.powerHandSize - player.powerHand.length);
      const drawnCards: PowerDrawCardResolution[] = [];

      if (cardsToDraw === 0) {
        playerResolutions.push({
          playerId: player.id,
          playerName: player.name,
          cardsDrawn: drawnCards,
        });
        continue;
      }

      this.drawCards(
        player.powerDeck.drawPile,
        player.powerHand,
        cardsToDraw,
        CardZone.PowerHand,
      );

      for (const card of player.powerHand.slice(handSizeBefore)) {
        drawnCards.push({
          cardId: card.id,
          cardDefinitionId: card.name, // Card IS the definition — use name as identifier
          cardName: card.name,
        });
      }

      playerResolutions.push({
        playerId: player.id,
        playerName: player.name,
        cardsDrawn: drawnCards,
      });
      game.eventLog.push(`${player.name} drew ${cardsToDraw} power card${cardsToDraw === 1 ? "" : "s"}.`);
    }

    const resolution = new PowerDrawResolution(game.roundNumber, playerResolutions);
    game.addRecord(GameRecordKind.PowerDraw, resolution, {
      actionKind: EndPhaseActionKind.ResolveDrawPowerCards,
    });
    // TODO: emit PowerCardsDrawnEvent for Phase 1 (requires building snapshot arrays with object references from string-ID sub-resolutions)
    game.transitionTo(
      createEndPhaseGameState(
        EndPhaseStep.Cleanup,
        null,
        game.firstPlayerId,
      ),
    );
    game.eventLog.push("Power card drawing complete.");
  }

  private applyResolveCleanup(game: Game): void {
    this.assertEndPhaseStep(game, EndPhaseStep.Cleanup);

    const completedRoundNumber = game.roundNumber;
    const consecutivePassesBeforeReset = game.consecutivePasses;
    const playerResolutions: CleanupPlayerResolution[] = game.players.map((player) => {
      const fightersWithTokensCleared: CleanupFighterResolution[] = [];

      for (const fighter of player.fighters) {
        if (!fighter.hasMoveToken && !fighter.hasChargeToken && !fighter.hasGuardToken) {
          continue;
        }

        const fighterDefinition = fighter.definition;
        if (fighterDefinition === undefined) {
          throw new Error(`Fighter ${fighter.id} is missing definition data during cleanup.`);
        }

        const clearedTokenCount = Number(fighter.hasMoveToken)
          + Number(fighter.hasChargeToken)
          + Number(fighter.hasGuardToken);

        fightersWithTokensCleared.push({
          fighterId: fighter.id,
          fighterName: fighterDefinition.name,
          clearedMoveToken: fighter.hasMoveToken,
          clearedChargeToken: fighter.hasChargeToken,
          clearedGuardToken: fighter.hasGuardToken,
          clearedTokenCount,
        });
      }

      return {
        playerId: player.id,
        playerName: player.name,
        turnsTakenBeforeReset: player.turnsTakenThisRound,
        hadDelvedThisPowerStepBeforeReset: player.hasDelvedThisPowerStep,
        fightersWithTokensCleared,
      };
    });

    this.resetRoundState(game);

    if (game.isFinalRound()) {
      const outcome = this.victoryResolver.getOutcome(game);
      if (outcome === null) {
        throw new Error("Final-round cleanup requires a game outcome.");
      }

      game.winnerPlayerId = outcome.winnerPlayerId;
      game.transitionTo(createFinishedGameState());
      const outcomeWinner = outcome.winnerPlayerId !== null
        ? game.getPlayer(outcome.winnerPlayerId) ?? null
        : null;
      const resolution = new CleanupResolution(
        completedRoundNumber,
        consecutivePassesBeforeReset,
        playerResolutions,
        CleanupTransitionKind.Finished,
        null,
        outcome.kind,
        outcomeWinner,
        outcome.reason,
      );
      game.addRecord(GameRecordKind.Cleanup, resolution, {
        actionKind: EndPhaseActionKind.ResolveCleanup,
      });
      // TODO: emit CleanupEvent for Phase 1 (requires building CleanupPlayerSnapshot arrays with Fighter object references)

      if (outcome.winnerPlayerId === null) {
        game.eventLog.push(`Cleanup complete. Game finished in a draw. ${outcome.reason}`);
        return;
      }

      const winner = this.requirePlayer(game, outcome.winnerPlayerId);
      game.eventLog.push(`Cleanup complete. ${winner.name} won the game. ${outcome.reason}`);
      return;
    }

    game.roundNumber += 1;
    game.winnerPlayerId = null;
    game.transitionTo(createCombatReadyGameState());
    const resolution = new CleanupResolution(
      completedRoundNumber,
      consecutivePassesBeforeReset,
      playerResolutions,
      CleanupTransitionKind.CombatReady,
      game.roundNumber,
    );
    game.addRecord(GameRecordKind.Cleanup, resolution, {
      actionKind: EndPhaseActionKind.ResolveCleanup,
    });
    // TODO: emit CleanupEvent for Phase 1 (requires building CleanupPlayerSnapshot arrays with Fighter object references)
    game.eventLog.push(
      `Cleanup complete. Round ${completedRoundNumber + 1} is ready to begin.`,
    );
  }

  private recordRoundStart(game: Game, firstPlayerId: PlayerId): void {
    const featureTokens: RoundStartFeatureTokenResolution[] = game.board.featureTokens.map((featureToken) => {
      const holderDetails = this.getPloyTargetDetails(game, featureToken.heldByFighterId);
      return {
        featureTokenId: featureToken.id,
        featureTokenHexId: featureToken.hexId,
        side: featureToken.side,
        heldByFighterId: holderDetails?.fighterId ?? null,
        heldByFighterName: holderDetails?.fighterName ?? null,
        holderOwnerPlayerId: holderDetails?.ownerPlayerId ?? null,
      };
    });

    const firstPlayer = this.requirePlayer(game, firstPlayerId);
    game.addRecord(
      GameRecordKind.RoundStart,
      new RoundStartResolution(game.roundNumber, firstPlayer, featureTokens),
      {
        invokedByPlayer: firstPlayer,
      },
    );
    game.emitEvent(new RoundStartedEvent(
      game.roundNumber,
      firstPlayer,
      game.board.featureTokens.map((featureToken) => {
        const holder = featureToken.heldByFighterId !== null ? game.getFighter(featureToken.heldByFighterId) : undefined;
        const holderOwner = holder !== undefined
          ? game.players.find((p) => p.getFighter(holder.id) !== undefined) ?? null
          : null;
        return {
          featureTokenId: featureToken.id,
          featureTokenHexId: featureToken.hexId,
          side: featureToken.side,
          heldByFighter: holder ?? null,
          holderOwnerPlayer: holderOwner,
        };
      }),
    ));
  }

  private transitionToState(
    game: Game,
    nextState: GameState,
    metadata: GameEventMetadata = {},
  ): void {
    const previousState = game.state;
    game.transitionTo(nextState);
    const currentState = game.state;

    if (
      previousState.kind === "combatTurn" &&
      previousState.turnStep === TurnStep.Action &&
      previousState.activePlayerId !== null &&
      (
        currentState.kind !== "combatTurn" ||
        currentState.turnStep !== TurnStep.Action ||
        currentState.activePlayerId !== previousState.activePlayerId
      )
    ) {
      const previousActionPlayer = this.requirePlayer(game, previousState.activePlayerId);
      this.recordActionStepEnded(game, previousActionPlayer, currentState, metadata);
    }

    if (
      previousState.kind === "combatTurn" &&
      previousState.turnStep === TurnStep.Power &&
      previousState.activePlayerId !== null &&
      (
        currentState.kind !== "combatTurn" ||
        currentState.turnStep !== TurnStep.Power ||
        currentState.activePlayerId !== previousState.activePlayerId
      )
    ) {
      const previousPowerPlayer = this.requirePlayer(game, previousState.activePlayerId);
      this.recordPowerStepEnded(game, previousPowerPlayer, currentState, metadata);
      this.recordTurnEnded(game, previousPowerPlayer, currentState, metadata);
    }

    if (
      previousState.turnStep === currentState.turnStep &&
      previousState.activePlayerId === currentState.activePlayerId
    ) {
      return;
    }

    const fromActivePlayer = previousState.activePlayerId !== null
      ? game.getPlayer(previousState.activePlayerId) ?? null
      : null;
    const toActivePlayer = currentState.activePlayerId !== null
      ? game.getPlayer(currentState.activePlayerId) ?? null
      : null;
    game.addRecord(
      GameRecordKind.TurnStepChanged,
      new TurnStepChangeResolution(
        previousState.kind,
        currentState.kind,
        previousState.phase,
        currentState.phase,
        previousState.turnStep,
        currentState.turnStep,
        fromActivePlayer,
        toActivePlayer,
      ),
      metadata,
    );
    game.emitEvent(new TurnStepChangedEvent(
      game.roundNumber,
      previousState.kind,
      currentState.kind,
      previousState.phase,
      currentState.phase,
      previousState.turnStep,
      currentState.turnStep,
      previousState.activePlayerId !== null ? game.getPlayer(previousState.activePlayerId) ?? null : null,
      currentState.activePlayerId !== null ? game.getPlayer(currentState.activePlayerId) ?? null : null,
    ));

    if (
      currentState.kind === "combatTurn" &&
      currentState.turnStep === TurnStep.Action &&
      currentState.activePlayerId !== null &&
      (
        previousState.turnStep !== TurnStep.Action ||
        previousState.activePlayerId !== currentState.activePlayerId
      )
    ) {
      this.recordActionStepStarted(game, currentState.activePlayerId, metadata);
      this.recordTurnStarted(game, currentState.activePlayerId, metadata);
    }
  }

  private recordMoveEvent(
    game: Game,
    player: Player,
    fighter: Fighter,
    fromHex: HexCell,
    toHex: HexCell,
    path: readonly HexId[],
    destinationHexKind: HexKind,
    staggerApplied: boolean,
    metadata: GameEventMetadata = {},
  ): void {
    game.addRecord(
      GameRecordKind.Move,
      new MoveResolution(
        player,
        fighter,
        fromHex,
        toHex,
        path,
        destinationHexKind,
        staggerApplied,
      ),
      metadata,
    );
    game.emitEvent(new FighterMovedEvent(
      game.roundNumber,
      player,
      fighter,
      fromHex.id,
      toHex.id,
      path,
      destinationHexKind,
      staggerApplied,
      metadata.actionKind ?? null,
    ));
  }

  private recordCardPlayed(
    game: Game,
    player: Player,
    card: Card,
    metadata: GameEventMetadata = {},
    options: {
      timing?: ObjectiveConditionTiming | null;
      target?: ReturnType<GameEngine["getPloyTargetDetails"]>;
    } = {},
  ): void {
    const targetFighter = options.target?.fighterId !== undefined
      ? game.getFighter(options.target.fighterId) ?? null
      : null;
    game.addRecord(
      GameRecordKind.CardPlayed,
      new CardPlayedResolution(
        player,
        card,
        card.zone,
        targetFighter,
        options.timing ?? null,
      ),
      metadata,
    );
    const targetOwnerPlayer = options.target?.ownerPlayerId !== undefined
      ? game.getPlayer(options.target.ownerPlayerId) ?? null
      : null;
    game.emitEvent(new CardPlayedEvent(
      game.roundNumber,
      player,
      card,
      card.kind,
      card.zone,
      targetFighter,
      targetOwnerPlayer,
      options.timing ?? null,
      metadata.actionKind ?? null,
    ));
  }

  private recordCardResolved(
    game: Game,
    player: Player,
    card: Card,
    effectSummaries: readonly string[],
    gloryDelta: number,
    metadata: GameEventMetadata = {},
    options: {
      timing?: ObjectiveConditionTiming | null;
      target?: ReturnType<GameEngine["getPloyTargetDetails"]>;
    } = {},
  ): void {
    const resolvedTargetFighter = options.target?.fighterId !== undefined
      ? game.getFighter(options.target.fighterId) ?? null
      : null;
    game.addRecord(
      GameRecordKind.CardResolved,
      new CardResolvedResolution(
        player,
        card,
        card.zone,
        resolvedTargetFighter,
        options.timing ?? null,
        gloryDelta,
        effectSummaries,
      ),
      metadata,
    );
    const resolvedTargetOwnerPlayer = options.target?.ownerPlayerId !== undefined
      ? game.getPlayer(options.target.ownerPlayerId) ?? null
      : null;
    game.emitEvent(new CardResolvedEvent(
      game.roundNumber,
      player,
      card,
      card.kind,
      card.zone,
      resolvedTargetFighter,
      resolvedTargetOwnerPlayer,
      options.timing ?? null,
      gloryDelta,
      effectSummaries,
      metadata.actionKind ?? null,
    ));
  }

  private recordTurnStarted(
    game: Game,
    playerId: PlayerId,
    metadata: GameEventMetadata = {},
  ): void {
    const player = this.requirePlayer(game, playerId);
    const roundTurnNumber =
      game.players.reduce((total, currentPlayer) => total + currentPlayer.turnsTakenThisRound, 0) + 1;

    game.addRecord(
      GameRecordKind.TurnStarted,
      new TurnStartedResolution(
        game.roundNumber,
        player,
        player.turnsTakenThisRound + 1,
        roundTurnNumber,
        roundTurnNumber === 1,
      ),
      metadata,
    );
    game.emitEvent(new TurnStartedEvent(
      game.roundNumber,
      player,
      player.turnsTakenThisRound + 1,
      roundTurnNumber,
      roundTurnNumber === 1,
    ));
  }

  private recordActionStepStarted(
    game: Game,
    playerId: PlayerId,
    metadata: GameEventMetadata = {},
  ): void {
    const player = this.requirePlayer(game, playerId);
    const roundTurnNumber =
      game.players.reduce((total, currentPlayer) => total + currentPlayer.turnsTakenThisRound, 0) + 1;

    game.addRecord(
      GameRecordKind.ActionStepStarted,
      new ActionStepStartedResolution(
        game.roundNumber,
        player,
        player.turnsTakenThisRound + 1,
        roundTurnNumber,
        roundTurnNumber === 1,
      ),
      metadata,
    );
    game.emitEvent(new ActionStepStartedEvent(
      game.roundNumber,
      player,
      player.turnsTakenThisRound + 1,
      roundTurnNumber,
      roundTurnNumber === 1,
    ));
  }

  private recordActionStepEnded(
    game: Game,
    player: Player,
    nextState: GameState,
    metadata: GameEventMetadata = {},
  ): void {
    const nextActivePlayer =
      nextState.activePlayerId === null ? null : game.getPlayer(nextState.activePlayerId);
    const roundTurnNumber =
      game.players.reduce((total, currentPlayer) => total + currentPlayer.turnsTakenThisRound, 0) + 1;

    game.addRecord(
      GameRecordKind.ActionStepEnded,
      new ActionStepEndedResolution(
        game.roundNumber,
        player,
        player.turnsTakenThisRound + 1,
        roundTurnNumber,
        nextState.kind,
        nextState.phase,
        nextState.turnStep,
        nextActivePlayer ?? null,
      ),
      metadata,
    );
    game.emitEvent(new ActionStepEndedEvent(
      game.roundNumber,
      player,
      player.turnsTakenThisRound + 1,
      roundTurnNumber,
      nextState.kind,
      nextState.phase,
      nextState.turnStep,
      nextActivePlayer ?? null,
    ));
  }

  private recordPowerStepEnded(
    game: Game,
    player: Player,
    nextState: GameState,
    metadata: GameEventMetadata = {},
  ): void {
    const completedRoundTurnNumber = game.players.reduce(
      (total, currentPlayer) => total + currentPlayer.turnsTakenThisRound,
      0,
    );
    const nextActivePlayer =
      nextState.activePlayerId === null ? null : game.getPlayer(nextState.activePlayerId);

    game.addRecord(
      GameRecordKind.PowerStepEnded,
      new PowerStepEndedResolution(
        game.roundNumber,
        player,
        player.turnsTakenThisRound,
        completedRoundTurnNumber,
        nextState.kind,
        nextState.phase,
        nextState.turnStep,
        nextActivePlayer ?? null,
        nextState.kind === "endPhase",
      ),
      metadata,
    );
    game.emitEvent(new PowerStepEndedEvent(
      game.roundNumber,
      player,
      player.turnsTakenThisRound,
      completedRoundTurnNumber,
      nextState.kind,
      nextState.phase,
      nextState.turnStep,
      nextActivePlayer ?? null,
      nextState.kind === "endPhase",
    ));
  }

  private recordTurnEnded(
    game: Game,
    player: Player,
    nextState: GameState,
    metadata: GameEventMetadata = {},
  ): void {
    const completedRoundTurnNumber = game.players.reduce(
      (total, currentPlayer) => total + currentPlayer.turnsTakenThisRound,
      0,
    );
    const nextActivePlayer =
      nextState.activePlayerId === null ? null : game.getPlayer(nextState.activePlayerId);

    game.addRecord(
      GameRecordKind.TurnEnded,
      new TurnEndedResolution(
        game.roundNumber,
        player,
        player.turnsTakenThisRound,
        completedRoundTurnNumber,
        nextState.kind,
        nextState.phase,
        nextState.turnStep,
        nextActivePlayer ?? null,
        nextState.kind === "endPhase",
      ),
      metadata,
    );
    game.emitEvent(new TurnEndedEvent(
      game.roundNumber,
      player,
      player.turnsTakenThisRound,
      completedRoundTurnNumber,
      nextState.kind,
      nextState.phase,
      nextState.turnStep,
      nextActivePlayer ?? null,
      nextState.kind === "endPhase",
    ));
  }

  private drawCards(
    drawPile: Card[],
    hand: Card[],
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

  private createImmediateTriggerContext(actionKind: GameActionKind): CardPlayContext {
    return {
      timing: ObjectiveConditionTiming.Immediate,
      triggerActionKind: actionKind,
    };
  }

  private createEndPhaseTriggerContext(actionKind: EndPhaseActionKind): CardPlayContext {
    return {
      timing: ObjectiveConditionTiming.EndPhase,
      triggerActionKind: actionKind,
    };
  }

  private resolveAutoPlayableCards(
    game: Game,
    context: CardPlayContext,
  ): void {
    const autoPlayedObjectives = this.resolveAutoPlayableObjectives(game, context);
    this.appendTriggeredObjectiveSummaryToLatestEventLog(game, autoPlayedObjectives);
  }

  private resolveAutoPlayableObjectives(
    game: Game,
    context: CardPlayContext,
  ): ObjectiveScoringPlayerResolution[] {
    const autoPlayedObjectives: ObjectiveScoringPlayerResolution[] = [];
    let scoredObjectives = false;
    do {
      scoredObjectives = false;
      for (const player of game.players) {
        if (this.manualScoringPlayerIds.has(player.id)) continue;
        const resolution = this.scoreObjectivesForPlayer(
          game,
          player,
          context,
          false,
          true,
        );
        if (resolution.scoredObjectives.length === 0) {
          continue;
        }

        autoPlayedObjectives.push(resolution);
        scoredObjectives = true;
      }
    } while (scoredObjectives);

    return autoPlayedObjectives;
  }

  private appendTriggeredObjectiveSummaryToLatestEventLog(
    game: Game,
    resolutions: readonly ObjectiveScoringPlayerResolution[],
  ): void {
    if (resolutions.length === 0) {
      return;
    }

    const summary = resolutions.length === 1
      ? this.describeObjectiveScoringResolution(resolutions[0])
      : `Triggered scores: ${resolutions.map((resolution) =>
        `${resolution.playerName} ${this.describeObjectiveScoringResolution(resolution)}`
      ).join("; ")}`;

    if (game.eventLog.length === 0) {
      game.eventLog.push(summary);
      return;
    }

    const lastIndex = game.eventLog.length - 1;
    const lastEntry = game.eventLog[lastIndex];
    if (lastEntry.endsWith(".")) {
      const joiner = resolutions.length === 1 ? " and " : " ";
      game.eventLog[lastIndex] = `${lastEntry.slice(0, -1)}${joiner}${summary}.`;
      return;
    }

    game.eventLog[lastIndex] = `${lastEntry} ${summary}.`;
  }

  private describeObjectiveScoringResolution(
    resolution: ObjectiveScoringPlayerResolution,
  ): string {
    return `scored ${resolution.scoredObjectives.map((objective) => objective.cardName).join(", ")} for ${resolution.gloryGained} glory`;
  }

  private scoreObjectivesForPlayer(
    game: Game,
    player: Player,
    context: CardPlayContext,
    logEachObjective: boolean = true,
    recordResolution: boolean = false,
  ): ObjectiveScoringPlayerResolution {
    const timing = context.timing;
    if (timing === undefined) {
      return {
        playerId: player.id,
        playerName: player.name,
        gloryGained: 0,
        scoredObjectives: [],
      };
    }

    // Use the new Card-based API: each card self-reports its legal targets.
    const playableOptions = player
      .getPlayableCardOptions(game, player.objectiveHand)
      .filter((option) => option.card.kind === CardKind.Objective);
    const scoredObjectives: ObjectiveScoringCardResolution[] = [];
    let gloryGained = 0;

    for (const option of playableOptions) {
      const card = option.card;
      if (card.zone !== CardZone.ObjectiveHand) {
        throw new Error(`Objective card ${card.id} is not available to score for ${player.name}.`);
      }

      this.recordCardPlayed(
        game,
        player,
        card,
        {
          invokedByPlayer: player,
          invokedByCard: card,
          actionKind: context.triggerActionKind ?? null,
        },
        { timing },
      );

      // Inline objective scoring effects: move card from hand to scored pile, add glory.
      const handIndex = player.objectiveHand.indexOf(card);
      if (handIndex !== -1) {
        player.objectiveHand.splice(handIndex, 1);
      }
      card.zone = CardZone.ScoredObjectives;
      card.revealed = true;
      player.scoredObjectives.push(card);
      player.glory += card.gloryValue;

      const scoredObjective = {
        cardId: card.id,
        cardDefinitionId: card.name, // Card IS the definition — use name as identifier
        cardName: card.name,
        gloryValue: card.gloryValue,
      };
      gloryGained += scoredObjective.gloryValue;
      scoredObjectives.push(scoredObjective);
      this.recordCardResolved(
        game,
        player,
        card,
        [`scored for ${scoredObjective.gloryValue} glory`],
        scoredObjective.gloryValue,
        {
          invokedByPlayer: player,
          invokedByCard: card,
          actionKind: context.triggerActionKind ?? null,
        },
        { timing },
      );

      if (logEachObjective) {
        game.eventLog.push(
          `${player.name} scored ${card.name} for ${card.gloryValue} glory.`,
        );
      }
    }

    const playerResolution = {
      playerId: player.id,
      playerName: player.name,
      gloryGained,
      scoredObjectives,
    };

    if (recordResolution && scoredObjectives.length > 0) {
      game.addRecord(
        GameRecordKind.ObjectiveScoring,
        new ObjectiveScoringResolution(game.roundNumber, [playerResolution]),
        {
          invokedByPlayer: player,
          invokedByCard: scoredObjectives.length === 1
            ? player.scoredObjectives.find((c) => c.id === scoredObjectives[0].cardId) ?? null
            : null,
          actionKind: context.triggerActionKind ?? null,
        },
      );
      // TODO: emit ObjectivesScoredEvent for Phase 1 (auto-scored objectives during combat)
    }

    return playerResolution;
  }

  private drawFocusCards(
    drawPile: Card[],
    hand: Card[],
    amount: number,
    zone: CardZoneType,
  ): FocusCardResolution[] {
    const drawnCards: FocusCardResolution[] = [];

    for (let drawIndex = 0; drawIndex < amount; drawIndex += 1) {
      const card = drawPile.shift();
      if (card === undefined) {
        break;
      }

      card.zone = zone;
      hand.push(card);
      drawnCards.push({
        cardId: card.id,
        cardDefinitionId: card.name, // Card IS the definition — use name as identifier
        cardName: card.name,
      });
    }

    return drawnCards;
  }

  private discardFocusCard(
    player: Player,
    cardId: CardId,
    hand: Card[],
    discardPile: Card[],
    discardZone: CardZoneType,
  ): FocusCardResolution {
    const card = player.getCard(cardId);
    if (card === undefined) {
      throw new Error(`Player ${player.name} does not have focus card ${cardId}.`);
    }

    const handIndex = hand.indexOf(card);
    if (handIndex === -1) {
      throw new Error(`Could not find focus card ${card.id} in ${player.name}'s hand.`);
    }

    hand.splice(handIndex, 1);
    card.zone = discardZone;
    card.revealed = true;
    discardPile.push(card);
    return {
      cardId: card.id,
      cardDefinitionId: card.name, // Card IS the definition — use name as identifier
      cardName: card.name,
    };
  }

  private redrawHand(
    drawPile: Card[],
    hand: Card[],
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

  private getNextDeploymentPlayer(game: Game, currentPlayerId: PlayerId): Player {
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

  private getUndeployedFighters(player: Player): Fighter[] {
    return player.fighters.filter(
      (fighter) => fighter.currentHexId === null && !fighter.isSlain,
    );
  }

  private requireOwnedUndeployedFighter(player: Player, fighterId: FighterId): Fighter {
    const fighter = player.getFighter(fighterId);
    if (fighter === undefined) {
      throw new Error(`Player ${player.name} does not control fighter ${fighterId}.`);
    }

    if (fighter.currentHexId !== null) {
      throw new Error(`Fighter ${fighter.id} has already been deployed.`);
    }

    return fighter;
  }

  private requireOwnedDeployedFighter(player: Player, fighterId: FighterId): Fighter {
    const fighter = player.getFighter(fighterId);
    if (fighter === undefined) {
      throw new Error(`Player ${player.name} does not control fighter ${fighterId}.`);
    }

    if (fighter.currentHexId === null || fighter.isSlain) {
      throw new Error(`Fighter ${fighter.id} is not deployed on the board.`);
    }

    return fighter;
  }

  private requirePlayerTerritory(player: Player): TerritoryId {
    if (player.territoryId === null) {
      throw new Error(`Player ${player.name} does not have an assigned territory.`);
    }

    return player.territoryId;
  }

  private requirePlayer(game: Game, playerId: PlayerId | null): Player {
    if (playerId === null) {
      throw new Error("This action requires a player id.");
    }

    const player = game.getPlayer(playerId);
    if (player === undefined) {
      throw new Error(`Unknown player ${playerId}.`);
    }

    return player;
  }

  private requireTwoPlayers(game: Game): [Player, Player] {
    const [playerOne, playerTwo] = game.players;
    if (playerOne === undefined || playerTwo === undefined || game.players.length !== 2) {
      throw new Error("Roll-offs require exactly two players.");
    }

    return [playerOne, playerTwo];
  }

  private requireOpponent(game: Game, playerId: PlayerId): Player {
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

  private getUnderdogPlayerId(playerOne: Player, playerTwo: Player): PlayerId | null {
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

  private resetRoundState(game: Game): void {
    game.consecutivePasses = 0;

    for (const player of game.players) {
      player.turnsTakenThisRound = 0;
      player.hasDelvedThisPowerStep = false;

      for (const fighter of player.fighters) {
        fighter.hasMoveToken = false;
        fighter.hasChargeToken = false;
        fighter.hasGuardToken = false;
      }
    }
  }

  private describeRollOff(game: Game, result: RollOffResult): string {
    const winner = this.requirePlayer(game, result.winnerPlayerId);
    const loser = this.requirePlayer(game, result.loserPlayerId);
    const decisiveRoundNumber = result.rounds.length;
    const tieBreakerSuffix = result.resolvedByTieBreaker ? " by tie-breaker" : "";

    return `${winner.name} won the ${result.context.kind} roll-off against ${loser.name} in round ${decisiveRoundNumber}${tieBreakerSuffix}.`;
  }

  private static copyCards(cards: readonly Card[]): Card[] {
    return [...cards];
  }

  private resolveCombatAction(
    game: Game,
    attackerPlayer: Player,
    defenderPlayer: Player,
    attacker: Fighter,
    _attackerDefinition: Player["warband"]["fighters"][number],
    target: Fighter,
    targetDefinition: Player["warband"]["fighters"][number],
    weaponId: string,
    _weaponName: string,
    selectedAbility: AttackAction["selectedAbility"],
    attackRoll: AttackAction["attackRoll"],
    saveRoll: AttackAction["saveRoll"],
    actionKind: GameEventInvokerKind,
  ): { combatResult: ReturnType<CombatResolver["resolve"]>; targetSlain: boolean } {
    const weapon = attackerPlayer.getFighterWeaponDefinition(attacker.id, weaponId);
    if (weapon === undefined) {
      throw new Error(`Weapon ${weaponId} not found on ${attacker.id}.`);
    }
    game.addRecord(
      GameRecordKind.CombatStarted,
      new CombatStartedResolution(
        attackerPlayer,
        attacker,
        defenderPlayer,
        target,
        weapon,
        selectedAbility,
      ),
      {
        invokedByPlayer: attackerPlayer,
        invokedByFighter: attacker,
        actionKind,
      },
    );
    if (weapon !== undefined) {
      game.emitEvent(new CombatStartedEvent(
        game.roundNumber,
        attackerPlayer,
        defenderPlayer,
        attacker,
        target,
        weapon,
        selectedAbility,
        actionKind,
      ));
    }

    if (weapon === undefined) {
      throw new Error(`Weapon ${weaponId} not found on ${attacker.id}.`);
    }
    const combatResult = this.combatResolver.resolve(
      game,
      new CombatContext(
        attackerPlayer,
        defenderPlayer,
        attacker,
        target,
        weapon,
        selectedAbility,
      ),
      attackRoll,
      saveRoll,
    );

    if (combatResult.targetMoved || combatResult.attackerMoved) {
      throw new Error("Driven back movement is not yet supported.");
    }

    game.addRecord(GameRecordKind.Combat, combatResult, {
      invokedByPlayer: attackerPlayer,
      invokedByFighter: attacker,
      actionKind,
    });
    if (weapon !== undefined) {
      game.emitEvent(new CombatResolvedEvent(
        game.roundNumber,
        attackerPlayer,
        defenderPlayer,
        attacker,
        target,
        weapon,
        selectedAbility,
        combatResult.selectedAbilityRequiresCritical,
        combatResult.selectedAbilityTriggered,
        combatResult.attackRoll,
        combatResult.saveRoll,
        combatResult.outcome,
        combatResult.attackSuccesses,
        combatResult.saveSuccesses,
        combatResult.attackCriticals,
        combatResult.saveCriticals,
        combatResult.damageInflicted,
        combatResult.targetSlain,
        combatResult.targetMoved,
        combatResult.attackerMoved,
        combatResult.staggerApplied,
        actionKind,
      ));
    }
    target.damage += combatResult.damageInflicted;
    if (combatResult.staggerApplied) {
      target.hasStaggerToken = true;
    }

    const targetSlain = combatResult.targetSlain || target.damage >= getEffectiveHealth(targetDefinition, defenderPlayer, target);
    if (targetSlain) {
      const targetHexId = target.currentHexId;
      if (targetHexId === null) {
        throw new Error(`Target fighter ${target.id} is not on the board to be slain.`);
      }

      const targetHex = this.requireHex(game, targetHexId);
      targetHex.occupantFighter = null;
      this.syncFeatureTokenHolderAtHex(game, targetHex.id);
      target.currentHex = null;
      target.isSlain = true;
      attackerPlayer.glory += targetDefinition.bounty;
      game.addRecord(
        GameRecordKind.FighterSlain,
        new FighterSlainResolution(
          attackerPlayer,
          attacker,
          defenderPlayer,
          target,
          targetHex,
          targetDefinition.bounty,
        ),
        {
          invokedByPlayer: attackerPlayer,
          invokedByFighter: attacker,
          actionKind,
        },
      );
      game.emitEvent(new FighterSlainEvent(
        game.roundNumber,
        attackerPlayer,
        attacker,
        defenderPlayer,
        target,
        targetHex.id,
        targetDefinition.bounty,
        actionKind,
      ));
    }

    game.addRecord(
      GameRecordKind.CombatEnded,
      new CombatEndedResolution(
        attackerPlayer,
        attacker,
        defenderPlayer,
        target,
        weapon,
        selectedAbility,
        combatResult.selectedAbilityRequiresCritical,
        combatResult.selectedAbilityTriggered,
        combatResult.attackRoll,
        combatResult.saveRoll,
        combatResult.outcome,
        combatResult.attackSuccesses,
        combatResult.saveSuccesses,
        combatResult.attackCriticals,
        combatResult.saveCriticals,
        combatResult.damageInflicted,
        targetSlain,
        combatResult.staggerApplied,
      ),
      {
        invokedByPlayer: attackerPlayer,
        invokedByFighter: attacker,
        actionKind,
      },
    );
    if (weapon !== undefined) {
      game.emitEvent(new CombatEndedEvent(
        game.roundNumber,
        attackerPlayer,
        defenderPlayer,
        attacker,
        target,
        weapon,
        selectedAbility,
        combatResult.selectedAbilityRequiresCritical,
        combatResult.selectedAbilityTriggered,
        combatResult.attackRoll,
        combatResult.saveRoll,
        combatResult.outcome,
        combatResult.attackSuccesses,
        combatResult.saveSuccesses,
        combatResult.attackCriticals,
        combatResult.saveCriticals,
        combatResult.damageInflicted,
        targetSlain,
        combatResult.staggerApplied,
        actionKind,
      ));
    }

    return { combatResult, targetSlain };
  }

  private syncFeatureTokenHolderAtHex(game: Game, hexId: HexId): void {
    const hex = this.requireHex(game, hexId);
    if (hex.featureTokenId === null) {
      return;
    }

    const featureToken = game.board.getFeatureToken(hex.featureTokenId);
    if (featureToken === undefined) {
      throw new Error(`Unknown feature token ${hex.featureTokenId} on hex ${hex.id}.`);
    }

    if (featureToken.hexId !== hex.id) {
      throw new Error(`Feature token ${featureToken.id} is not on expected hex ${hex.id}.`);
    }

    featureToken.heldByFighter =
      featureToken.side === FeatureTokenSide.Treasure ? hex.occupantFighter : null;
  }

  private getPloyTargetDetails(
    game: Game,
    targetFighterId: FighterId | null,
  ): {
    fighterId: FighterId;
    fighterName: string;
    ownerPlayerId: PlayerId;
    ownerPlayerName: string;
  } | null {
    if (targetFighterId === null) {
      return null;
    }

    for (const player of game.players) {
      const fighter = player.getFighter(targetFighterId);
      const fighterDefinition = player.getFighterDefinition(targetFighterId);
      if (fighter === undefined || fighterDefinition === undefined) {
        continue;
      }

      return {
        fighterId: fighter.id,
        fighterName: fighterDefinition.name,
        ownerPlayerId: player.id,
        ownerPlayerName: player.name,
      };
    }

    return null;
  }
}
