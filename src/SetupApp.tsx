import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import "./setup/SetupApp.css";
import {
  createSetupPracticeGame,
  SetupActionService,
  SetupAutoResolver,
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
import { getLocalPlayer, LOCAL_PLAYER_ID } from "./localPlayer";

// `SetupActionService` is stateless; reuse a single instance across renders.
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

  // Single owner of the setup auto-resolution policies. One instance per
  // SetupApp mount so the underlying engine closes over a stable game.
  const autoResolver = useMemo(
    () => new SetupAutoResolver(LOCAL_PLAYER_ID),
    [],
  );

  function refresh(): void {
    setRefreshTick((value) => value + 1);
  }

  function applySetupAction(action: SetupAction): void {
    autoResolver.applyAction(game, action);
    refresh();
  }

  function autoSetupToBattle(): void {
    autoResolver.drainToBattle(game);
    refresh();
  }

  // Auto-advance trivial states and auto-resolve opponent actions so the
  // user only interacts as the local player.
  useEffect(() => {
    if (autoResolver.resolveAutomaticStep(game)) {
      refresh();
    }
  }, [game, game.state.kind, game.activePlayerId, autoResolver]);

  // Hand off to combat once setup is complete.
  useEffect(() => {
    if (game.state.kind !== "combatReady" || handoffCompletedRef.current) {
      return;
    }
    handoffCompletedRef.current = true;
    autoResolver.startCombat(game);
    onSetupComplete(game);
  }, [game, game.state.kind, autoResolver, onSetupComplete]);

  const screen = renderSetupScreen();
  const localPlayer = getLocalPlayer(game);
  const showDock =
    localPlayer !== null &&
    localPlayer.objectiveHand.length + localPlayer.powerHand.length > 0;

  return (
    <>
      {screen}
      <button
        type="button"
        className="setup-skip-button"
        onClick={autoSetupToBattle}
        title="Auto-resolve all remaining setup actions and jump straight into combat."
      >
        Skip to battle
      </button>
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
