import { GameEngine } from "../../engine/GameEngine";
import { GameFactory } from "../../factories/GameFactory";
import { SetupActionService } from "../../setup/SetupActionService";
import { CompleteMusterAction } from "../../setup/CompleteMusterAction";
import { DrawStartingHandsAction } from "../../setup/DrawStartingHandsAction";
import { ResolveMulliganAction } from "../../setup/ResolveMulliganAction";
import { ResolveTerritoryRollOffAction } from "../../setup/ResolveTerritoryRollOffAction";
import { ChooseTerritoryAction } from "../../setup/ChooseTerritoryAction";
import { PlaceFeatureTokenAction } from "../../setup/PlaceFeatureTokenAction";
import { DeployFighterAction } from "../../setup/DeployFighterAction";
import { Game } from "../../state/Game";
import type { SetupAction } from "../../setup/SetupAction";
import type { DeckDefinition } from "../../definitions/DeckDefinition";
import type { WarbandDefinition } from "../../definitions/WarbandDefinition";
import { BoardSide } from "../../values/enums";
import { deterministicFirstPlayerRollOff } from "../../rules/Dice";
import type { GameId } from "../../values/ids";
import { embergard1Board } from "../boards/Embergard1Board";
import { setupPracticeWarband } from "../warbands/SetupPracticeWarband";

const northTerritoryId = "territory:north";
const southTerritoryId = "territory:south";

export function createSetupPracticeGame(
  gameId: GameId = "game:setup-practice",
  warband: WarbandDefinition = setupPracticeWarband,
  deck: DeckDefinition | null = null,
): Game {
  return new GameFactory().createGame({
    gameId,
    board: embergard1Board,
    players: [
      {
        id: "player:one",
        name: "Player One",
        warband,
        ...(deck === null ? {} : { deck }),
      },
      {
        id: "player:two",
        name: "Player Two",
        warband,
        ...(deck === null ? {} : { deck }),
      },
    ],
    shuffleCards: shuffleCards,
  });
}

export function createCombatReadySetupPracticeGame(
  gameId: GameId = "game:setup-practice:combat-ready",
  warband: WarbandDefinition = setupPracticeWarband,
  deck: DeckDefinition | null = null,
): Game {
  const game = createSetupPracticeGame(gameId, warband, deck);
  const engine = new GameEngine(shuffleCards);
  const setupActionService = new SetupActionService();

  engine.applySetupAction(game, new CompleteMusterAction());
  engine.applySetupAction(game, new DrawStartingHandsAction());

  for (const player of game.players) {
    engine.applySetupAction(game, new ResolveMulliganAction(player, false, false));
  }

  engine.applySetupAction(
    game,
    new ResolveTerritoryRollOffAction([deterministicFirstPlayerRollOff]),
  );

  const territoryChooserId = requirePlayerId(game.activePlayerId, "territory chooser");
  const territoryChooser = game.getPlayer(territoryChooserId);
  if (territoryChooser === undefined) {
    throw new Error("Territory chooser not found.");
  }
  const northTerritory = game.board.getTerritory(northTerritoryId);
  if (northTerritory === undefined) {
    throw new Error("North territory not found.");
  }
  engine.applySetupAction(
    game,
    new ChooseTerritoryAction(territoryChooser, BoardSide.Front, northTerritory),
  );

  while (game.state.kind === "setupPlaceFeatureTokens") {
    const action = chooseFeaturePlacementAction(game, setupActionService.getLegalActions(game));
    engine.applySetupAction(game, action);
  }

  while (game.state.kind === "setupDeployFighters") {
    const action = chooseDeploymentAction(setupActionService.getLegalActions(game));
    engine.applySetupAction(game, action);
  }

  if (game.state.kind !== "combatReady") {
    throw new Error("Practice setup did not reach a combat-ready game state.");
  }

  return game;
}

function shuffleCards<T>(cards: readonly T[]): T[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function chooseFeaturePlacementAction(
  game: Game,
  legalActions: readonly SetupAction[],
): PlaceFeatureTokenAction {
  const featurePlacements = legalActions.filter(
    (action): action is PlaceFeatureTokenAction => action instanceof PlaceFeatureTokenAction,
  );

  if (featurePlacements.length === 0) {
    throw new Error("Expected at least one legal feature token placement.");
  }

  const preferredTerritories = getPreferredFeatureTerritories(game);

  for (const territoryId of preferredTerritories) {
    const preferredPlacement = featurePlacements.find((action) => {
      return action.hex.territory?.id === territoryId;
    });

    if (preferredPlacement !== undefined) {
      return preferredPlacement;
    }
  }

  return featurePlacements[0];
}

function chooseDeploymentAction(
  legalActions: readonly SetupAction[],
): DeployFighterAction {
  const deployments = legalActions.filter(
    (action): action is DeployFighterAction => action instanceof DeployFighterAction,
  );

  if (deployments.length === 0) {
    throw new Error("Expected at least one legal deployment action.");
  }

  return deployments[0];
}

function getPreferredFeatureTerritories(game: Game): Array<string | null> {
  if (game.board.featureTokens.length === 0) {
    return [null, northTerritoryId, southTerritoryId];
  }

  const occupiedTerritories = new Set<string>();
  for (const featureToken of game.board.featureTokens) {
    const territoryId = featureToken.hex.territory?.id;
    if (territoryId !== undefined) {
      occupiedTerritories.add(territoryId);
    }
  }

  const uncoveredTerritories = [northTerritoryId, southTerritoryId].filter(
    (territoryId) => !occupiedTerritories.has(territoryId),
  );

  if (uncoveredTerritories.length > 0) {
    return uncoveredTerritories;
  }

  return [northTerritoryId, southTerritoryId, null];
}

function requirePlayerId(playerId: string | null, label: string): string {
  if (playerId === null) {
    throw new Error(`Expected ${label} id to be available.`);
  }

  return playerId;
}
