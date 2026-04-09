import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import "./setup/SetupApp.css";
import {
  createSetupPracticeGame,
  ResolveMulliganAction,
  SetupActionService,
  SetupAutoResolver,
  type DeckDefinition,
  type Game,
  type SetupAction,
  type WarbandDefinition,
} from "./domain";
import TerritoryRollOffScreen from "./setup/TerritoryRollOffScreen";
import TerritoryChoiceScreen from "./setup/TerritoryChoiceScreen";
import FeaturePlacementScreen from "./setup/FeaturePlacementScreen";
import DeploymentScreen from "./setup/DeploymentScreen";
import PlayerHandDockShell from "./PlayerHandDockShell";
import type { DockInteraction } from "./PlayerHandDock";
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

  // During the local player's mulligan step, the dock hosts the 4
  // mulligan buttons. Otherwise the dock is read-only.
  const dockInteraction: DockInteraction =
    localPlayer !== null &&
    game.state.kind === "setupMulligan" &&
    game.activePlayerId === LOCAL_PLAYER_ID
      ? {
          kind: "mulligan",
          onResolve: (redrawObjectives, redrawPower) =>
            applySetupAction(
              new ResolveMulliganAction(localPlayer.id, redrawObjectives, redrawPower),
            ),
        }
      : { kind: "readonly" };

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
      {localPlayer === null ? null : (
        <PlayerHandDockShell player={localPlayer} interaction={dockInteraction} />
      )}
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

    // Mulligan has no full-screen UI any more — the dock hosts all
    // controls. The setup shell just shows a hero banner so the player
    // knows which phase they're in.
    if (game.state.kind === "setupMulligan") {
      return <MulliganBanner />;
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

function MulliganBanner() {
  return (
    <main className="setup-shell">
      <header className="setup-hero">
        <span className="setup-active-player">Mulligan</span>
        <h1>Keep or redraw?</h1>
        <p>
          Set any of your starting hands aside and draw replacements. You only get one
          mulligan. Use the buttons in the hand dock below.
        </p>
      </header>
    </main>
  );
}
