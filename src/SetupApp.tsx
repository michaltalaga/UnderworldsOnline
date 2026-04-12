import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import "./setup/SetupApp.css";
import "./PracticeBattlefieldApp.css";
import {
  createSetupPracticeGame,
  DeployFighterAction,
  PlaceFeatureTokenAction,
  ResolveMulliganAction,
  SetupActionService,
  SetupAutoResolver,
  type DeckDefinition,
  type Fighter,
  type Game,
  type HexId,
  type Player,
  type SetupAction,
  type WarbandDefinition,
} from "./domain";
import TerritoryRollOffScreen from "./setup/TerritoryRollOffScreen";
import TerritoryChoiceScreen from "./setup/TerritoryChoiceScreen";
import BoardMap from "./board/BoardMap";
import {
  projectBoardScene,
  type BoardSceneHexClickIntent,
} from "./board/boardScene";
import DiceTray, { getDiceTrayModel } from "./board/DiceTray";
import { projectBoard } from "./board/projectBoard";
import { createEmptyActionLens } from "./board/fighterActionLens";
import type { BoardTheme } from "./board/boardTheme";
import PlayerHandDockShell from "./PlayerHandDockShell";
import { DockActionOverlay, type DockInteraction } from "./PlayerHandDock";
import { getLocalPlayer, LOCAL_PLAYER_ID } from "./localPlayer";

// `SetupActionService` is stateless; reuse a single instance across renders.
const setupActionService = new SetupActionService();

type SetupAppProps = {
  warband: WarbandDefinition;
  deck: DeckDefinition | null;
  onSetupComplete: (game: Game) => void;
  boardTheme?: BoardTheme | null;
};

export default function SetupApp({ warband, deck, onSetupComplete, boardTheme = null }: SetupAppProps) {
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

  const localPlayer = getLocalPlayer(game);
  const activePlayer = game.activePlayerId === null ? null : game.getPlayer(game.activePlayerId) ?? null;
  const dockPlayer = activePlayer ?? localPlayer;

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

  // Compute setup-phase map wiring: which hexes are legal for the
  // current setup action, and what to do when the user clicks one.
  const { legalHexIds, onHexClick } = getSetupMapWiring(game, activePlayer, applySetupAction);

  const boardProjection = projectBoard(game.board);
  const emptyLens = createEmptyActionLens(null, null);
  const diceTrayModel = getDiceTrayModel(game);

  const boardScene = projectBoardScene({
    game,
    positionedHexes: boardProjection.positionedHexes,
    actionLens: emptyLens,
    activePlayerId: activePlayer?.id ?? null,
    selectedFighterId: null,
    selectedFeatureToken: null,
    pendingMoveHexId: null,
    pendingDelveFeatureTokenId: null,
    pendingFocus: false,
    pendingGuardFighterId: null,
    pendingPassPower: false,
    pendingChargeHexId: null,
    pendingChargeTargetId: null,
    pendingAttackTargetId: null,
    pendingChargeBadgeLabel: null,
    pendingAttackBadgeLabel: null,
    pendingPowerOptionKey: null,
    recentCombatTargetId: null,
    attackPreviewByTarget: new Map(),
    chargePreviewByTarget: new Map(),
    armedPath: null,
    boardTurnHeader: {
      activePlayerName: activePlayer?.name ?? "Setup",
      interactionLabel: getSetupBannerText(game),
      isArmed: false,
      tone: "neutral",
      stepLabel: "Setup",
      roundLabel: null,
      scores: null,
    },
    lastResolvedAction: null,
    resultFlash: null,
    powerOverlay: {
      ploys: [],
      upgrades: [],
      warscrollAbilities: [],
      hasAnyOptions: false,
    },
    setupLegalHexIds: legalHexIds,
    isSetupClickEnabled: onHexClick !== undefined,
    hoveredChargeTargetId: null,
    // Setup has no AI loop; interactions are controlled by the phase
    // panel and setup-hex legality, not a per-player controller.
    isInteractionEnabled: true,
    activeActionMode: null,
    boardTheme: boardTheme,
    territoryIndicator: "labels",
  });

  function handleSetupHexClickIntent(intent: BoardSceneHexClickIntent): void {
    if (intent.kind === "setup-hex" && onHexClick !== undefined) {
      onHexClick(intent.hexId);
    }
    // Other click intents are unreachable in setup mode (actionLens is
    // empty), but the exhaustive switch keeps TypeScript happy.
  }

  return (
    <>
      <main className="battlefield-app-shell">
        <section className="battlefield-layout">
          <section className="battlefield-panel battlefield-board-panel">
            <BoardMap
              scene={boardScene}
              onHoverChargeTarget={noop}
              onHexClickIntent={handleSetupHexClickIntent}
              onQuickAction={noop}
              onApplyPowerOption={noop}
              onDelveInlineFeature={noop}
            />
          </section>

          <aside className="battlefield-side-rail">
            <DiceTray model={diceTrayModel} />
            <section className="battlefield-panel setup-phase-panel">
              {renderPhaseContent(game, activePlayer, applySetupAction)}
            </section>
          </aside>
        </section>

        {dockPlayer === null ? null : (
          <PlayerHandDockShell player={dockPlayer} interaction={dockInteraction} />
        )}
      </main>

      <button
        type="button"
        className="setup-skip-button"
        onClick={autoSetupToBattle}
        title="Auto-resolve all remaining setup actions and jump straight into combat."
      >
        Skip to battle
      </button>

      <DockActionOverlay interaction={dockInteraction} />
    </>
  );
}

// --- Setup-phase helpers -------------------------------------------------

function noop(): void {}

// Returns the legal hex ids for the current setup phase and the click
// handler that dispatches the corresponding setup action. Other phases
// (mulligan, roll-off, territory choice, etc.) have no hex interaction,
// so this returns an empty set + undefined click handler.
function getSetupMapWiring(
  game: Game,
  activePlayer: Player | null,
  applySetupAction: (action: SetupAction) => void,
): { legalHexIds: ReadonlySet<HexId>; onHexClick: ((hexId: HexId) => void) | undefined } {
  if (activePlayer === null) {
    return { legalHexIds: new Set(), onHexClick: undefined };
  }

  if (game.state.kind === "setupPlaceFeatureTokens") {
    const legalActions = setupActionService.getLegalActions(game);
    const legalHexIds = new Set<HexId>(
      legalActions
        .filter((action): action is PlaceFeatureTokenAction => action instanceof PlaceFeatureTokenAction)
        .map((action) => action.hexId),
    );
    return {
      legalHexIds,
      onHexClick: (hexId) => applySetupAction(new PlaceFeatureTokenAction(activePlayer.id, hexId)),
    };
  }

  if (game.state.kind === "setupDeployFighters") {
    const nextFighter = activePlayer.getUndeployedFighters()[0] ?? null;
    if (nextFighter === null) {
      return { legalHexIds: new Set(), onHexClick: undefined };
    }
    const legalActions = setupActionService.getLegalActions(game);
    const legalHexIds = new Set<HexId>(
      legalActions
        .filter((action): action is DeployFighterAction => action instanceof DeployFighterAction)
        .filter((action) => action.fighterId === nextFighter.id)
        .map((action) => action.hexId),
    );
    return {
      legalHexIds,
      onHexClick: (hexId) =>
        applySetupAction(new DeployFighterAction(activePlayer.id, nextFighter.id, hexId)),
    };
  }

  return { legalHexIds: new Set(), onHexClick: undefined };
}

function getSetupBannerText(game: Game): string {
  switch (game.state.kind) {
    case "setupMusterWarbands":
    case "setupDrawStartingHands":
      return "Preparing the battlefield...";
    case "setupMulligan":
      return "Mulligan — use the hand dock below.";
    case "setupDetermineTerritoriesRollOff":
      return "Roll for first pick.";
    case "setupDetermineTerritoriesChoice":
      return "Pick a territory.";
    case "setupPlaceFeatureTokens":
      return `Place feature token ${game.board.featureTokens.length + 1} of 5.`;
    case "setupDeployFighters":
      return "Deploy fighters to starting hexes.";
    case "combatReady":
      return "Combat ready.";
    default:
      return "Setup";
  }
}

function renderPhaseContent(
  game: Game,
  activePlayer: Player | null,
  applySetupAction: (action: SetupAction) => void,
): ReactNode {
  if (
    game.state.kind === "setupMusterWarbands" ||
    game.state.kind === "setupDrawStartingHands" ||
    game.state.kind === "combatReady"
  ) {
    return (
      <header className="setup-hero">
        <h1>Preparing the battlefield...</h1>
        <p>Resolving setup actions.</p>
      </header>
    );
  }

  if (game.state.kind === "setupMulligan") {
    return (
      <header className="setup-hero">
        <span className="setup-active-player">Mulligan</span>
        <h1>Keep or redraw?</h1>
        <p>
          Set any of your starting hands aside and draw replacements. You only get one
          mulligan. Use the buttons in the hand dock below.
        </p>
      </header>
    );
  }

  if (game.state.kind === "setupDetermineTerritoriesRollOff") {
    return <TerritoryRollOffScreen game={game} onResolve={applySetupAction} />;
  }

  if (game.state.kind === "setupDetermineTerritoriesChoice") {
    if (activePlayer === null) {
      return null;
    }
    return <TerritoryChoiceScreen game={game} player={activePlayer} onChoose={applySetupAction} />;
  }

  if (game.state.kind === "setupPlaceFeatureTokens") {
    const placementNumber = game.board.featureTokens.length + 1;
    return (
      <header className="setup-hero">
        <span className="setup-active-player">{activePlayer?.name ?? "Setup"} placing</span>
        <h1>Place feature token {placementNumber} of 5</h1>
        <p>
          Pick an empty neutral hex on the map. Tokens cannot sit on starting, blocked,
          stagger, or edge hexes, and must be at least 2 hexes from another token.
        </p>
      </header>
    );
  }

  if (game.state.kind === "setupDeployFighters") {
    return <DeploymentPanel game={game} player={activePlayer} />;
  }

  return null;
}

// Deployment phase panel: hero banner + warband roster showing the
// current player's fighters and which one is queued to deploy next.
function DeploymentPanel({
  game,
  player,
}: {
  game: Game;
  player: Player | null;
}) {
  if (player === null) {
    return null;
  }
  const undeployedFighters = player.getUndeployedFighters();
  const nextFighter: Fighter | null = undeployedFighters[0] ?? null;
  const nextFighterName =
    nextFighter === null
      ? null
      : player.getFighterDefinition(nextFighter.id)?.name ?? nextFighter.id;

  return (
    <>
      <header className="setup-hero">
        <span className="setup-active-player">{player.name} deploying</span>
        <h1>
          {nextFighterName === null ? "Deployment complete" : `Deploy ${nextFighterName}`}
        </h1>
        <p>
          Place each fighter on a green starting hex inside your territory. Players
          alternate until every fighter is on the board.
        </p>
      </header>
      <aside className="setup-deploy-sidebar">
        <h3>{player.name}&apos;s warband</h3>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
          {player.fighters.map((fighter) => {
            const isDeployed = fighter.currentHexId !== null;
            const isActive = !isDeployed && fighter.id === nextFighter?.id;
            const className = `setup-deploy-fighter${isActive ? " setup-deploy-fighter-active" : ""}`;
            const definition = player.getFighterDefinition(fighter.id);
            return (
              <li key={fighter.id} className={className}>
                <span>{definition?.name ?? fighter.id}</span>
                <span className="setup-card-meta">
                  {isDeployed ? "Deployed" : isActive ? "Next" : "Waiting"}
                </span>
              </li>
            );
          })}
        </ul>
      </aside>
      {/* `game` is accepted for parity with the other phase panels and for
          future roster context (current round, fighters remaining). */}
      {void game}
    </>
  );
}
