import { useEffect, useRef, useState, type ReactNode } from "react";
import "./setup/SetupApp.css";
import {
  AttackDieFace,
  CompleteMusterAction,
  createSetupPracticeGame,
  DrawStartingHandsAction,
  GameEngine,
  SetupActionService,
  type DeckDefinition,
  type Game,
  type SetupAction,
  type WarbandDefinition,
} from "./domain";
import MulliganScreen from "./setup/MulliganScreen";
import TerritoryRollOffScreen from "./setup/TerritoryRollOffScreen";
import TerritoryChoiceScreen from "./setup/TerritoryChoiceScreen";
import FeaturePlacementScreen from "./setup/FeaturePlacementScreen";
import DeploymentScreen from "./setup/DeploymentScreen";
import PlayerHandDock from "./PlayerHandDock";

const setupEngine = new GameEngine();
const setupActionService = new SetupActionService();

type SetupAppProps = {
  warband: WarbandDefinition;
  deck: DeckDefinition | null;
  onSetupComplete: (game: Game) => void;
};

export default function SetupApp({ warband, deck, onSetupComplete }: SetupAppProps) {
  const [game] = useState<Game>(() => createSetupPracticeGame(undefined, warband, deck));
  const [, setRefreshTick] = useState(0);
  const handoffCompletedRef = useRef(false);

  function applySetupAction(action: SetupAction): void {
    setupEngine.applySetupAction(game, action);
    setRefreshTick((value) => value + 1);
  }

  // Auto-advance trivial states (muster + draw starting hands).
  useEffect(() => {
    if (game.state.kind === "setupMusterWarbands") {
      setupEngine.applySetupAction(game, new CompleteMusterAction());
      setRefreshTick((value) => value + 1);
      return;
    }
    if (game.state.kind === "setupDrawStartingHands") {
      setupEngine.applySetupAction(game, new DrawStartingHandsAction());
      setRefreshTick((value) => value + 1);
      return;
    }
  }, [game, game.state.kind]);

  // Hand off to combat once setup is complete.
  useEffect(() => {
    if (game.state.kind !== "combatReady" || handoffCompletedRef.current) {
      return;
    }
    handoffCompletedRef.current = true;
    setupEngine.startCombatRound(
      game,
      [{ firstFace: AttackDieFace.Hammer, secondFace: AttackDieFace.Blank }],
      "player:one",
    );
    onSetupComplete(game);
  }, [game, game.state.kind, onSetupComplete]);

  const screen = renderSetupScreen();
  const localPlayer =
    game.players.find((player) => player.id === "player:one") ?? game.players[0] ?? null;
  const showDock =
    localPlayer !== null &&
    localPlayer.objectiveHand.length + localPlayer.powerHand.length > 0;

  return (
    <>
      {screen}
      {showDock && localPlayer !== null ? <PlayerHandDock player={localPlayer} /> : null}
    </>
  );

  function renderSetupScreen(): ReactNode {
    if (
      game.state.kind === "setupMusterWarbands" ||
      game.state.kind === "setupDrawStartingHands" ||
      game.state.kind === "combatReady"
    ) {
      return <SetupTransition />;
    }

    if (game.state.kind === "setupMulligan") {
      const player = game.activePlayerId === null ? null : game.getPlayer(game.activePlayerId) ?? null;
      if (player === null) {
        return <SetupTransition />;
      }
      return <MulliganScreen player={player} onResolve={applySetupAction} />;
    }

    if (game.state.kind === "setupDetermineTerritoriesRollOff") {
      return <TerritoryRollOffScreen game={game} onResolve={applySetupAction} />;
    }

    if (game.state.kind === "setupDetermineTerritoriesChoice") {
      const player = game.activePlayerId === null ? null : game.getPlayer(game.activePlayerId) ?? null;
      if (player === null) {
        return <SetupTransition />;
      }
      return <TerritoryChoiceScreen game={game} player={player} onChoose={applySetupAction} />;
    }

    if (game.state.kind === "setupPlaceFeatureTokens") {
      const player = game.activePlayerId === null ? null : game.getPlayer(game.activePlayerId) ?? null;
      if (player === null) {
        return <SetupTransition />;
      }
      return (
        <FeaturePlacementScreen
          game={game}
          player={player}
          setupActionService={setupActionService}
          onPlace={applySetupAction}
        />
      );
    }

    if (game.state.kind === "setupDeployFighters") {
      const player = game.activePlayerId === null ? null : game.getPlayer(game.activePlayerId) ?? null;
      if (player === null) {
        return <SetupTransition />;
      }
      return (
        <DeploymentScreen
          game={game}
          player={player}
          setupActionService={setupActionService}
          onDeploy={applySetupAction}
        />
      );
    }

    return <SetupTransition />;
  }
}

function SetupTransition() {
  return (
    <main className="setup-shell">
      <header className="setup-hero">
        <h1>Preparing the battlefield...</h1>
        <p>Resolving setup actions.</p>
      </header>
    </main>
  );
}
