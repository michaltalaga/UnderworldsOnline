import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import "./GameView.css";
import "./setup/SetupApp.css";
import PlayerHandDockShell from "./PlayerHandDockShell";
import { DockActionOverlay, type DockInteraction } from "./PlayerHandDock";
import { getLocalPlayer, LOCAL_PLAYER_ID } from "./localPlayer";
import {
  CombatActionService,
  CombatAutoResolver,
  ConfirmCombatAction,
  createSetupPracticeGame,
  DeployFighterAction,
  deterministicFirstPlayerRollOff,
  DumbAiController,
  FocusAction,
  GameEngine,
  GameRecordKind,
  LocalPlayerController,
  CardZone,
  EndActionStepAction,
  Phase,
  PlaceFeatureTokenAction,
  ResolveMulliganAction,
  SetupActionService,
  SetupAutoResolver,
  TurnStep,
  type CardId,
  type CombatController,
  type FeatureToken,
  type Fighter,
  type FighterId,
  type Game,
  type DeckDefinition,
  type HexId,
  type PlayerId,
  type Player,
  type SetupAction,
  type WarbandDefinition,
} from "./domain";
import { projectBoard } from "./board/projectBoard";
import type {
  BattlefieldAppAction,
  BattlefieldResultFlash,
  PowerOverlayOption,
} from "./board/battlefieldModels";
import {
  formatFeatureTokenSide,
  getFeatureTokenBadge,
  getFighterName,
} from "./board/battlefieldFormatters";
import BoardMap from "./board/BoardMap";
import StatusBar from "./board/StatusBar";
import type { BoardTheme } from "./board/boardTheme";
import { projectBoardScene, type ActiveActionMode, type BoardSceneHexClickIntent, type BoardSceneQuickAction } from "./board/boardScene";
import DiceTray, { getDiceTrayModel } from "./board/DiceTray";
import DebugPanel from "./DebugPanel";
import PlayerPanel from "./board/PlayerPanel";
import { buildBattlefieldResultFlash } from "./board/battlefieldResultFlash";
import {
  buildHandPowerPlayableMap,
  getBoardTurnHeaderModel,
  getCardIdFromPowerOption,
  getPowerOverlayModel,
  getPowerOverlayOptionByKey,
} from "./board/battlefieldOverlays";
import {
  createEmptyActionLens,
  getArmedPathModel,
  getAttackActionForTarget,
  getAttackPreviewByTarget,
  getAttackProfiles,
  getChargeActionForTarget,
  getChargeActionsForHex,
  getChargeDestinationHexIdsForTarget,
  getChargeOptions,
  getChargePairKey,
  getChargePreviewByTarget,
  getChargeProfiles,
  getChargeTargetIdsForHex,
  getFighterActionLens,
  getMoveActionForHex,
  getMoveOptions,
  getNextSelectedFighterId,
  getPreferredChargeDestinationForTarget,
  getProfileForTarget,
  getSelectedAttackKeyForTarget,
  getSelectedChargeKeyForPair,
  toggleFocusCardId,
} from "./board/fighterActionLens";
import TerritoryRollOffScreen from "./setup/TerritoryRollOffScreen";
import TerritoryChoiceScreen from "./setup/TerritoryChoiceScreen";

// Stateless singletons — reused across renders.
const combatActionService = new CombatActionService();
const setupActionService = new SetupActionService();
const gameEngine = new GameEngine(
  undefined, undefined, undefined, undefined, undefined, undefined,
  new Set([LOCAL_PLAYER_ID]),
);

type GameViewProps = {
  warband: WarbandDefinition;
  deck?: DeckDefinition | null;
  boardTheme?: BoardTheme | null;
};

export default function GameView({
  warband,
  deck = null,
  boardTheme = null,
}: GameViewProps) {
  // --- Core game state (owned for the entire lifecycle) ---
  const [game] = useState<Game>(() => createSetupPracticeGame(undefined, warband, deck));
  const [refreshTick, setRefreshTick] = useState(0);

  // --- Setup state ---
  const setupAutoResolver = useMemo(() => new SetupAutoResolver(LOCAL_PLAYER_ID), []);
  const combatStartedRef = useRef(false);

  // --- Combat interaction state ---
  const [resultFlash, setResultFlash] = useState<BattlefieldResultFlash | null>(null);
  const [lastResolvedAction, setLastResolvedAction] = useState<BattlefieldResultFlash | null>(null);
  const [selectedFighterId, setSelectedFighterId] = useState<FighterId | null>(null);
  const [selectedMoveHexId, setSelectedMoveHexId] = useState<HexId | null>(null);
  const [selectedChargeKey, setSelectedChargeKey] = useState<string | null>(null);
  const [pendingMoveHexId, setPendingMoveHexId] = useState<HexId | null>(null);
  const [pendingDelveFeatureTokenId, setPendingDelveFeatureTokenId] = useState<FeatureToken["id"] | null>(null);
  const [pendingFocus, setPendingFocus] = useState(false);
  const [pendingGuardFighterId, setPendingGuardFighterId] = useState<FighterId | null>(null);
  const [pendingPassPower, setPendingPassPower] = useState(false);
  const [pendingPowerOptionKey, setPendingPowerOptionKey] = useState<string | null>(null);
  const [pendingPlayCardId, setPendingPlayCardId] = useState<CardId | null>(null);
  const [pendingChargeHexId, setPendingChargeHexId] = useState<HexId | null>(null);
  const [pendingChargeTargetId, setPendingChargeTargetId] = useState<FighterId | null>(null);
  const [pendingAttackTargetId, setPendingAttackTargetId] = useState<FighterId | null>(null);
  const [selectedFocusObjectiveIds, setSelectedFocusObjectiveIds] = useState<CardId[]>([]);
  const [selectedFocusPowerIds, setSelectedFocusPowerIds] = useState<CardId[]>([]);
  const [selectedAttackKeysByTarget, setSelectedAttackKeysByTarget] = useState<Record<string, string>>({});
  const [selectedChargeKeysByPair, setSelectedChargeKeysByPair] = useState<Record<string, string>>({});
  const [activeActionMode, setActiveActionMode] = useState<ActiveActionMode>(null);
  const [hoveredChargeTargetId, setHoveredChargeTargetId] = useState<FighterId | null>(null);

  // --- Derived state ---
  const isSetup = game.phase === Phase.Setup;
  const localPlayer = getLocalPlayer(game);
  const opponentPlayer = game.players.find((p) => p.id !== LOCAL_PLAYER_ID) ?? null;
  const activePlayer = game.activePlayerId === null ? null : game.getPlayer(game.activePlayerId) ?? null;
  const boardProjection = projectBoard(game.board);
  const diceTrayModel = getDiceTrayModel(game);

  // Combat-derived state (safe to compute during setup — returns empty results)
  const legalActions = activePlayer === null || isSetup ? [] : combatActionService.getLegalActions(game, activePlayer.id);
  const selectedFighter =
    selectedFighterId === null || activePlayer === null
      ? null
      : activePlayer.getFighter(selectedFighterId) ?? null;
  const selectedFighterHex =
    selectedFighter?.currentHexId === null || selectedFighter?.currentHexId === undefined
      ? null
      : game.board.getHex(selectedFighter.currentHexId) ?? null;
  const selectedFeatureToken =
    selectedFighterHex?.featureTokenId === null || selectedFighterHex?.featureTokenId === undefined
      ? null
      : game.board.getFeatureToken(selectedFighterHex.featureTokenId) ?? null;
  const actionLens = isSetup
    ? createEmptyActionLens(null, null)
    : getFighterActionLens(game, activePlayer, selectedFighterId, legalActions);
  const powerOverlay = isSetup
    ? { ploys: [], upgrades: [], warscrollAbilities: [], hasAnyOptions: false }
    : getPowerOverlayModel(game, activePlayer, legalActions);
  const handPowerPlayable = buildHandPowerPlayableMap(powerOverlay);
  const moveOptions = getMoveOptions(actionLens);
  const chargeOptions = getChargeOptions(game, actionLens);
  const selectedMoveOption = moveOptions.find((option) => option.hexId === selectedMoveHexId) ?? moveOptions[0] ?? null;
  const selectedChargeOption = chargeOptions.find((option) => option.key === selectedChargeKey) ?? chargeOptions[0] ?? null;
  const pendingPowerOption =
    pendingPowerOptionKey === null
      ? null
      : getPowerOverlayOptionByKey(powerOverlay, pendingPowerOptionKey);
  const visibleChargeTargetIds = getChargeTargetIdsForHex(actionLens, pendingChargeHexId);
  const chargeTargetNames = [...visibleChargeTargetIds].map((fighterId) => getFighterName(game, fighterId));
  const attackTargetNames = [...actionLens.attackTargetIds].map((fighterId) => getFighterName(game, fighterId));
  const attackProfiles = getAttackProfiles(game, activePlayer, actionLens, selectedAttackKeysByTarget);
  const attackPreviewByTarget = getAttackPreviewByTarget(attackProfiles);
  const chargePreviewByTarget = getChargePreviewByTarget(activePlayer, actionLens);
  const chargeProfiles = getChargeProfiles(
    game,
    activePlayer,
    actionLens,
    pendingChargeHexId,
    selectedChargeKeysByPair,
  );
  const selectedFighterName = selectedFighter === null ? "none" : getFighterName(game, selectedFighter.id);
  const pendingChargeTargetName =
    pendingChargeTargetId === null ? null : getFighterName(game, pendingChargeTargetId);
  const pendingChargeProfile =
    pendingChargeHexId === null || pendingChargeTargetId === null
      ? null
      : getProfileForTarget(chargeProfiles, pendingChargeTargetId);
  const pendingChargeOption = pendingChargeProfile?.options.find((option) => option.key === pendingChargeProfile.selectedKey) ?? null;
  const pendingChargeBadgeLabel = pendingChargeOption?.label ?? null;
  const pendingAttackProfile =
    pendingAttackTargetId === null
      ? null
      : getProfileForTarget(attackProfiles, pendingAttackTargetId);
  const pendingAttackTargetName = pendingAttackProfile?.targetName ?? (
    pendingAttackTargetId === null ? null : getFighterName(game, pendingAttackTargetId)
  );
  const pendingAttackOption = pendingAttackProfile?.options.find((option) => option.key === pendingAttackProfile.selectedKey) ?? null;
  const pendingAttackBadgeLabel = pendingAttackOption?.label ?? null;
  const selectedFocusCardCount = selectedFocusObjectiveIds.length + selectedFocusPowerIds.length;
  const focusSelectionSummary =
    selectedFocusCardCount === 0
      ? "Discard nothing and draw 1 additional power card."
      : `Discard ${selectedFocusObjectiveIds.length} objective card${selectedFocusObjectiveIds.length === 1 ? "" : "s"} and ${selectedFocusPowerIds.length} power card${selectedFocusPowerIds.length === 1 ? "" : "s"}, then draw ${selectedFocusObjectiveIds.length} objective card${selectedFocusObjectiveIds.length === 1 ? "" : "s"} and ${selectedFocusPowerIds.length + 1} power card${selectedFocusPowerIds.length + 1 === 1 ? "" : "s"}.`;
  const latestCombat = game.getLatestRecord(GameRecordKind.Combat);
  const scorableObjectives = localPlayer === null ? [] : localPlayer.objectiveHand
    .filter((card) => card.getLegalTargets(game).length > 0)
    .map((card) => ({ cardId: card.id, cardName: card.name, gloryValue: card.gloryValue }));
  const recentCombat =
    latestCombat !== null &&
    selectedFighterId !== null &&
    latestCombat.context.attackerFighterId === selectedFighterId
      ? latestCombat
      : null;
  const recentCombatTargetId = recentCombat?.context.targetFighterId ?? null;
  const recentCombatTargetName =
    recentCombatTargetId === null ? null : getFighterName(game, recentCombatTargetId);
  const recentEvents = [...game.eventLog].slice(-10).reverse();

  // --- Setup-specific derived state ---
  const { legalHexIds: setupLegalHexIds, onHexClick: setupOnHexClick } = isSetup
    ? getSetupMapWiring(game, activePlayer, applySetupAction)
    : { legalHexIds: new Set<HexId>(), onHexClick: undefined };

  // --- Combat controllers ---
  const combatControllers = useMemo<ReadonlyMap<PlayerId, CombatController>>(() => {
    const map = new Map<PlayerId, CombatController>();
    map.set(LOCAL_PLAYER_ID, new LocalPlayerController());
    for (const player of game.players) {
      if (player.id !== LOCAL_PLAYER_ID) {
        map.set(player.id, new DumbAiController());
      }
    }
    return map;
  }, [game]);

  const combatAutoResolver = useMemo(
    () => new CombatAutoResolver(combatControllers, LOCAL_PLAYER_ID, gameEngine),
    [combatControllers],
  );

  const isHumanTurn = isSetup || combatAutoResolver.isHumanTurn(game);

  // --- Prompt text ---
  const powerPrompt =
    pendingDelveFeatureTokenId !== null && selectedFeatureToken?.id === pendingDelveFeatureTokenId
      ? `${selectedFighterName} has ${getFeatureTokenBadge(selectedFeatureToken)} armed for delve. Click the same feature chip or Delve button again to confirm, or press Escape to cancel.`
      : pendingPassPower
        ? "Pass Power is armed. Click Pass Power again to confirm, press Escape to cancel, or choose a different power response."
      : pendingPowerOption !== null
        ? `${pendingPowerOption.title} is armed. Click the same power option again to confirm, press Escape to cancel, or choose a different power play.`
      : actionLens.delveAction !== null && selectedFeatureToken !== null
        ? `${recentCombatTargetName === null ? "" : `Recent combat: ${recentCombatTargetName} remains marked on the map. `}${selectedFighterName} can delve ${getFeatureTokenBadge(selectedFeatureToken)} from the map. Click the feature chip or Delve button to arm it, then click the same control again to confirm, or pass the power step.`
        : recentCombatTargetName === null
          ? "The selected fighter has already acted. Pass the power step or reset the board."
          : `Recent combat: ${recentCombatTargetName} remains marked on the map. Pass the power step or reset the board.`;
  const actionPrompt =
    game.turnStep === TurnStep.Action
      ? pendingFocus
        ? `Focus is armed. Select any objective or power cards to discard, then click Focus again to confirm, or press Escape to cancel. ${focusSelectionSummary}`
        : pendingGuardFighterId !== null
        ? `Guard is armed for ${selectedFighterName}. Click Guard again to confirm, press Escape to cancel, or choose another action.`
        : pendingAttackTargetId !== null
        ? `${pendingAttackTargetName ?? pendingAttackTargetId} selected with ${pendingAttackOption?.label ?? "the current profile"}. Click the same crimson target again to confirm the attack, press Escape to cancel, or pick a different crimson target.`
        : pendingChargeTargetId !== null && pendingChargeHexId !== null
          ? `${pendingChargeTargetName ?? pendingChargeTargetId} selected from ${pendingChargeHexId} with ${pendingChargeOption?.label ?? "the current profile"}. Click the same red target again to confirm, press Escape to cancel, or pick a different target.`
          : pendingChargeHexId !== null
            ? `Charge from ${pendingChargeHexId} selected. Click a red target to arm it, or choose a charge profile below first.`
            : pendingMoveHexId !== null
            ? `Move to ${pendingMoveHexId} selected. Click the same teal hex again to confirm, press Escape to cancel, or choose another teal hex.`
            : "Select a fighter, then click a teal hex to move, click a gold hex and then a red target to charge, click an amber charge target to auto-arm a charge, or use Focus to cycle cards."
      : powerPrompt;

  // --- Board scene ---
  const boardTurnHeader = isSetup
    ? {
        activePlayerName: activePlayer?.name ?? "Setup",
        interactionLabel: getSetupBannerText(game),
        isArmed: false,
        tone: "neutral" as const,
        stepLabel: "Setup",
        roundLabel: null,
        scores: null,
      }
    : getBoardTurnHeaderModel({
        activePlayerName: activePlayer?.name ?? "No active player",
        game,
        pendingAttackBadgeLabel,
        pendingAttackTargetName,
        pendingChargeBadgeLabel,
        pendingChargeHexId,
        pendingChargeTargetName,
        pendingDelveFeatureTokenId,
        pendingFocus,
        pendingGuardFighterId,
        pendingMoveHexId,
        pendingPassPower,
        pendingPowerOption,
        selectedFighterName,
        selectedFeatureToken,
      });

  const armedPath = getArmedPathModel(
    actionLens,
    pendingMoveHexId,
    pendingChargeHexId,
    pendingChargeTargetId,
    selectedChargeKeysByPair,
  );

  const boardScene = projectBoardScene({
    game,
    positionedHexes: boardProjection.positionedHexes,
    actionLens,
    activePlayerId: activePlayer?.id ?? null,
    selectedFighterId,
    selectedFeatureToken,
    pendingMoveHexId,
    pendingDelveFeatureTokenId,
    pendingFocus,
    pendingGuardFighterId,
    pendingPassPower,
    pendingChargeHexId,
    pendingChargeTargetId,
    pendingAttackTargetId,
    pendingChargeBadgeLabel,
    pendingAttackBadgeLabel,
    pendingPowerOptionKey,
    recentCombatTargetId,
    attackPreviewByTarget,
    chargePreviewByTarget,
    armedPath,
    boardTurnHeader,
    lastResolvedAction,
    resultFlash,
    powerOverlay,
    setupLegalHexIds: isSetup ? setupLegalHexIds : undefined,
    isSetupClickEnabled: isSetup && setupOnHexClick !== undefined,
    hoveredChargeTargetId,
    isInteractionEnabled: isHumanTurn,
    activeActionMode,
    boardTheme: boardTheme,
    territoryIndicator: "labels",
  });

  // ===== Effects =====

  // Setup: auto-advance trivial states and opponent actions.
  useEffect(() => {
    if (!isSetup) return;
    if (setupAutoResolver.resolveAutomaticStep(game)) {
      refreshGame();
    }
  }, [game, game.state.kind, game.activePlayerId, setupAutoResolver, isSetup]);

  // Setup → Combat transition: when setup reaches combatReady, start combat.
  useEffect(() => {
    if (game.state.kind !== "combatReady" || combatStartedRef.current) return;
    combatStartedRef.current = true;
    setupAutoResolver.startCombat(game);
    refreshGame();
  }, [game, game.state.kind, setupAutoResolver]);

  // Combat: auto-resolve opponent turns with a small delay.
  useEffect(() => {
    if (isSetup) return;
    const handle = window.setTimeout(() => {
      if (combatAutoResolver.resolveAutomaticStep(game)) {
        refreshGame();
      }
    }, 450);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTick, combatAutoResolver, isSetup]);

  // Charge hover cleanup.
  useEffect(() => {
    if (pendingChargeHexId !== null) {
      setHoveredChargeTargetId(null);
      return;
    }
    if (hoveredChargeTargetId !== null && !actionLens.chargeTargetIds.has(hoveredChargeTargetId)) {
      setHoveredChargeTargetId(null);
    }
  }, [actionLens.chargeTargetIds, hoveredChargeTargetId, pendingChargeHexId]);

  // Stale pending play card cleanup.
  useEffect(() => {
    if (pendingPlayCardId === null) return;
    const options = handPowerPlayable.get(pendingPlayCardId);
    if (options === undefined || options.length === 0) {
      setPendingPlayCardId(null);
    }
  }, [pendingPlayCardId, handPowerPlayable]);

  // Escape key handler.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        if (activeActionMode !== null) {
          clearPendingInteractions();
          setActiveActionMode(null);
        } else {
          dismissSelection(null);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeActionMode]);

  // Result flash auto-clear.
  useEffect(() => {
    if (resultFlash === null) return;
    const timeoutId = window.setTimeout(() => {
      setResultFlash((current) => (current?.id === resultFlash.id ? null : current));
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [resultFlash]);

  // ===== Action handlers =====

  function refreshGame(): void {
    setRefreshTick((value) => value + 1);
  }

  function clearPendingInteractions(): void {
    setPendingMoveHexId(null);
    setPendingDelveFeatureTokenId(null);
    setPendingFocus(false);
    setPendingGuardFighterId(null);
    setPendingPassPower(false);
    setPendingPowerOptionKey(null);
    setPendingPlayCardId(null);
    setPendingChargeHexId(null);
    setPendingChargeTargetId(null);
    setPendingAttackTargetId(null);
    setSelectedFocusObjectiveIds([]);
    setSelectedFocusPowerIds([]);
  }

  // --- Setup actions ---

  function applySetupAction(action: SetupAction): void {
    setupAutoResolver.applyAction(game, action);
    refreshGame();
  }

  function autoSetupToBattle(): void {
    setupAutoResolver.drainToBattle(game);
    refreshGame();
  }

  // --- Combat actions ---

  function applyAction(action: BattlefieldAppAction): void {
    const previousActivePlayerId = game.activePlayerId;
    const previousSelectedFighterId = selectedFighterId;
    gameEngine.applyGameAction(game, action);
    const nextResolvedAction = buildBattlefieldResultFlash(game, action);
    setResultFlash(nextResolvedAction);
    setLastResolvedAction(nextResolvedAction);
    setSelectedMoveHexId(null);
    setSelectedChargeKey(null);
    clearPendingInteractions();
    setActiveActionMode(null);
    setSelectedAttackKeysByTarget({});
    setSelectedChargeKeysByPair({});
    setSelectedFighterId(getNextSelectedFighterId(game, previousActivePlayerId, previousSelectedFighterId));
    refreshGame();
  }

  function selectFighter(fighterId: FighterId | null): void {
    if (fighterId !== null) {
      game.eventLog.push(`Selected ${getFighterName(game, fighterId)}`);
    } else if (selectedFighterId !== null) {
      game.eventLog.push(`Deselected ${getFighterName(game, selectedFighterId)}`);
    }
    setSelectedFighterId(fighterId);
    setSelectedMoveHexId(null);
    setSelectedChargeKey(null);
    clearPendingInteractions();
    setActiveActionMode(null);
    setSelectedAttackKeysByTarget({});
    setSelectedChargeKeysByPair({});
    refreshGame();
  }

  function dismissSelection(event: React.MouseEvent | null): void {
    if (event !== null) {
      const target = event.target as HTMLElement;
      if (target.closest(".battlefield-map-hex") !== null) return;
      if (target.closest(".player-hand-dock-shell") !== null) return;
      if (target.closest(".status-bar-actions") !== null) return;
      if (target.closest(".battlefield-roster-rail") !== null) return;
      if (target.closest(".battlefield-context-menu") !== null) return;
    }
    selectFighter(null);
  }

  function handleContextMenuAction(mode: ActiveActionMode): void {
    if (mode === "guard") {
      setActiveActionMode("guard");
      guardSelectedFighter();
      return;
    }
    clearPendingInteractions();
    setActiveActionMode(mode);
  }

  function dismissContextMenu(): void {
    selectFighter(null);
  }

  function confirmCombat(): void {
    if (activePlayer === null || game.pendingCombat === null) return;
    applyAction(new ConfirmCombatAction(activePlayer.id));
  }

  function endActionStep(): void {
    if (activePlayer === null) return;
    applyAction(new EndActionStepAction(activePlayer.id));
  }

  function scoreObjective(cardId: CardId): void {
    if (localPlayer === null) return;
    const card = localPlayer.getCard(cardId);
    if (card === undefined) return;
    const handIndex = localPlayer.objectiveHand.findIndex((c) => c.id === cardId);
    if (handIndex === -1) return;
    localPlayer.objectiveHand.splice(handIndex, 1);
    card.zone = CardZone.ScoredObjectives;
    card.revealed = true;
    localPlayer.scoredObjectives.push(card);
    localPlayer.glory += card.gloryValue;
    game.eventLog.push(`${localPlayer.name} scored ${card.name} for ${card.gloryValue} glory.`);
    setResultFlash({
      id: Date.now(),
      tone: "power",
      title: `Scored: ${card.name}`,
      detail: `+${card.gloryValue} glory`,
    });
    setLastResolvedAction({
      id: Date.now(),
      tone: "power",
      title: `Scored: ${card.name}`,
      detail: `+${card.gloryValue} glory`,
    });
    refreshGame();
  }

  function moveToHex(hexId: HexId): void {
    if (pendingMoveHexId !== hexId) {
      clearPendingInteractions();
      setPendingMoveHexId(hexId);
      return;
    }
    const moveAction = getMoveActionForHex(actionLens, hexId);
    if (moveAction !== null) {
      applyAction(moveAction);
    }
  }

  function startChargeToHex(hexId: HexId): void {
    const chargeActions = getChargeActionsForHex(actionLens, hexId);
    if (chargeActions.length === 0) return;
    clearPendingInteractions();
    setPendingChargeHexId(hexId);
  }

  function startChargeAgainstTarget(targetId: FighterId): void {
    const validDestsForTarget = getChargeDestinationHexIdsForTarget(actionLens, targetId);
    const destinationHexId =
      pendingMoveHexId !== null && validDestsForTarget.has(pendingMoveHexId)
        ? pendingMoveHexId
        : getPreferredChargeDestinationForTarget(actionLens, targetId);
    if (destinationHexId === null) return;
    clearPendingInteractions();
    setPendingChargeHexId(destinationHexId);
    setPendingChargeTargetId(targetId);
  }

  function completeChargeAgainstTarget(targetId: FighterId): void {
    if (pendingChargeTargetId !== targetId) {
      setPendingChargeTargetId(targetId);
      setPendingAttackTargetId(null);
      return;
    }
    const chargeKey =
      pendingChargeHexId === null
        ? null
        : getSelectedChargeKeyForPair(selectedChargeKeysByPair, pendingChargeHexId, targetId);
    const selectedChargeAction = getChargeActionForTarget(actionLens, pendingChargeHexId, targetId, chargeKey);
    if (selectedChargeAction !== null) {
      applyAction(selectedChargeAction);
    }
  }

  function cancelPendingCharge(): void {
    clearPendingInteractions();
  }

  function delveSelectedFighter(): void {
    if (actionLens.delveAction === null || selectedFeatureToken === null) return;
    if (pendingDelveFeatureTokenId !== selectedFeatureToken.id) {
      clearPendingInteractions();
      setPendingDelveFeatureTokenId(selectedFeatureToken.id);
      return;
    }
    applyAction(actionLens.delveAction);
  }

  function focusHand(): void {
    if (actionLens.focusAction === null) return;
    if (!pendingFocus) {
      clearPendingInteractions();
      setPendingFocus(true);
      return;
    }
    applyAction(
      new FocusAction(
        actionLens.focusAction.playerId,
        selectedFocusObjectiveIds,
        selectedFocusPowerIds,
      ),
    );
  }

  function toggleFocusObjectiveCard(cardId: CardId): void {
    setSelectedFocusObjectiveIds((current) => toggleFocusCardId(current, cardId));
  }

  function toggleFocusPowerCard(cardId: CardId): void {
    setSelectedFocusPowerIds((current) => toggleFocusCardId(current, cardId));
  }

  function guardSelectedFighter(): void {
    if (actionLens.guardAction === null || selectedFighterId === null) return;
    if (pendingGuardFighterId !== selectedFighterId) {
      clearPendingInteractions();
      setPendingGuardFighterId(selectedFighterId);
      return;
    }
    applyAction(actionLens.guardAction);
  }

  function passTurn(): void {
    if (actionLens.passAction === null) return;
    if (game.turnStep !== TurnStep.Power) {
      applyAction(actionLens.passAction);
      return;
    }
    if (!pendingPassPower) {
      clearPendingInteractions();
      setPendingPassPower(true);
      return;
    }
    applyAction(actionLens.passAction);
  }

  function attackTarget(targetId: FighterId): void {
    if (pendingAttackTargetId !== targetId) {
      clearPendingInteractions();
      setPendingAttackTargetId(targetId);
      return;
    }
    const attackAction = getAttackActionForTarget(
      actionLens,
      targetId,
      getSelectedAttackKeyForTarget(selectedAttackKeysByTarget, targetId),
    );
    if (attackAction !== null) {
      applyAction(attackAction);
    }
  }

  function selectAttackProfile(targetId: FighterId, attackKey: string): void {
    setSelectedAttackKeysByTarget((current) => ({
      ...current,
      [targetId]: attackKey,
    }));
  }

  function selectChargeProfile(targetId: FighterId, chargeKey: string): void {
    if (pendingChargeHexId === null) return;
    setSelectedChargeKeysByPair((current) => ({
      ...current,
      [getChargePairKey(pendingChargeHexId, targetId)]: chargeKey,
    }));
  }

  function selectPowerOption(option: PowerOverlayOption): void {
    if (pendingPowerOptionKey !== option.key) {
      clearPendingInteractions();
      setPendingPowerOptionKey(option.key);
      const sourceCardId = getCardIdFromPowerOption(option);
      if (sourceCardId !== null) {
        setPendingPlayCardId(sourceCardId);
      }
      return;
    }
    applyAction(option.action);
  }

  function handleDockSelectCard(cardId: CardId): void {
    const options = handPowerPlayable.get(cardId) ?? [];
    if (options.length === 0) return;
    if (options.length === 1) {
      selectPowerOption(options[0]);
      return;
    }
    clearPendingInteractions();
    setPendingPlayCardId(cardId);
  }

  // --- Hex click routing ---

  function handleHexClickIntent(intent: BoardSceneHexClickIntent): void {
    switch (intent.kind) {
      case "none":
        return;
      case "setup-hex":
        if (setupOnHexClick !== undefined) setupOnHexClick(intent.hexId);
        return;
      case "select-fighter":
        selectFighter(intent.fighterId);
        return;
      case "deselect-fighter":
        selectFighter(null);
        return;
      case "cancel-charge":
        cancelPendingCharge();
        return;
      case "attack-target":
        attackTarget(intent.fighterId);
        return;
      case "start-charge-against-target":
        startChargeAgainstTarget(intent.fighterId);
        return;
      case "complete-charge-against-target":
        completeChargeAgainstTarget(intent.fighterId);
        return;
      case "start-charge-to-hex":
        startChargeToHex(intent.hexId);
        return;
      case "move-to-hex":
        moveToHex(intent.hexId);
        return;
    }
  }

  function handleQuickAction(action: BoardSceneQuickAction): void {
    switch (action.key) {
      case "focus":
        focusHand();
        return;
      case "delve":
        delveSelectedFighter();
        return;
      case "guard":
        guardSelectedFighter();
        return;
      case "pass-power":
        passTurn();
        return;
      case "end-action-step":
        endActionStep();
        return;
      case "confirm-combat":
        confirmCombat();
        return;
    }
  }

  // --- Dock interaction ---

  const dockPlayer = localPlayer;

  const dockInteraction: DockInteraction = (() => {
    // Setup mulligan
    if (
      isSetup &&
      localPlayer !== null &&
      game.state.kind === "setupMulligan" &&
      game.activePlayerId === LOCAL_PLAYER_ID
    ) {
      return {
        kind: "mulligan",
        onResolve: (redrawObjectives: boolean, redrawPower: boolean) =>
          applySetupAction(
            new ResolveMulliganAction(localPlayer.id, redrawObjectives, redrawPower),
          ),
      };
    }

    // During AI turns the dock is read-only.
    if (!isHumanTurn) {
      return { kind: "readonly" };
    }

    // Combat focus mode
    if (game.turnStep === TurnStep.Action && pendingFocus) {
      return {
        kind: "focus",
        selectedObjectiveIds: selectedFocusObjectiveIds,
        selectedPowerIds: selectedFocusPowerIds,
        onToggleObjective: toggleFocusObjectiveCard,
        onTogglePower: toggleFocusPowerCard,
        onConfirm: focusHand,
        onCancel: clearPendingInteractions,
        summary: focusSelectionSummary,
      };
    }

    // Combat power card play
    if (handPowerPlayable.size > 0) {
      return {
        kind: "play",
        playableByCardId: handPowerPlayable,
        pendingCardId: pendingPlayCardId,
        pendingOptionKey: pendingPowerOptionKey,
        onSelectCard: handleDockSelectCard,
        onSelectOption: selectPowerOption,
        onCancel: clearPendingInteractions,
      };
    }

    return { kind: "readonly" };
  })();

  // ===== Render =====

  return (
    <>
    <main className="battlefield-app-shell" onClick={dismissSelection}>
      <section className="battlefield-main">
        <div className="battlefield-map-center">
          <StatusBar badge={boardScene.statusBadge} />
          <div className="battlefield-board-row">
            <div className="battlefield-roster-rail battlefield-roster-rail-left">
              {localPlayer !== null && (
                <PlayerPanel
                  activePlayerId={activePlayer?.id ?? null}
                  game={game}
                  onSelectFighter={isSetup ? noop : selectFighter}
                  player={localPlayer}
                  selectedFighterId={selectedFighterId}
                />
              )}
            </div>
            <div className="battlefield-map-and-actions">
              <BoardMap
                scene={boardScene}
                onHoverChargeTarget={(fighterId) =>
                  setHoveredChargeTargetId(fighterId as FighterId | null)
                }
                onHexClickIntent={handleHexClickIntent}
                onDelveInlineFeature={delveSelectedFighter}
                onContextMenuAction={handleContextMenuAction}
                onDismissContextMenu={dismissContextMenu}
              />
              <div className="battlefield-quick-actions">
                {boardScene.quickActions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    className={`battlefield-quick-action${action.armed ? " battlefield-quick-action-armed" : ""}`}
                    onClick={() => handleQuickAction(action)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="battlefield-roster-rail battlefield-roster-rail-right">
              {isSetup ? (
                <div className="setup-roster-rail">
                  <section className="battlefield-panel setup-phase-panel">
                    {renderSetupPhaseContent(game, activePlayer, applySetupAction)}
                  </section>
                </div>
              ) : (
                opponentPlayer !== null && (
                  <PlayerPanel
                    activePlayerId={activePlayer?.id ?? null}
                    game={game}
                    onSelectFighter={noop}
                    player={opponentPlayer}
                    selectedFighterId={null}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {diceTrayModel !== null && (
        <div className="battlefield-dice-corner">
          <DiceTray model={diceTrayModel} />
        </div>
      )}

      {dockPlayer === null ? null : (
        <PlayerHandDockShell
          player={dockPlayer}
          interaction={dockInteraction}
          scorableObjectives={scorableObjectives}
          onScoreObjective={scoreObjective}
        />
      )}
    </main>

    {isSetup && (
      <button
        type="button"
        className="setup-skip-button"
        onClick={autoSetupToBattle}
        title="Auto-resolve all remaining setup actions and jump straight into combat."
      >
        Skip to battle
      </button>
    )}

    <DebugPanel>
        <div className="battlefield-side-stack">
          <section className="battlefield-panel">
            <div className="battlefield-heading">
              <p className="battlefield-eyebrow">Action Lens</p>
              <h2>Legal actions for the selected fighter</h2>
              <p className="battlefield-copy">
                Click one of {activePlayer?.name ?? "the active player"}&apos;s fighters on the board or in the roster.
              </p>
            </div>
            <dl className="battlefield-warband-stats">
              <div>
                <dt>Selected</dt>
                <dd>{selectedFighterName}</dd>
              </div>
              <div>
                <dt>Move Hexes</dt>
                <dd>{actionLens.moveCount}</dd>
              </div>
              <div>
                <dt>Attack Targets</dt>
                <dd>{actionLens.attackCount}</dd>
              </div>
              <div>
                <dt>Charge Paths</dt>
                <dd>{actionLens.chargeCount}</dd>
              </div>
              <div>
                <dt>Delve</dt>
                <dd>{actionLens.delveAvailable ? "legal" : "no"}</dd>
              </div>
              <div>
                <dt>Focus</dt>
                <dd>{actionLens.focusAvailable ? "legal" : "no"}</dd>
              </div>
              <div>
                <dt>Guard</dt>
                <dd>{actionLens.guardAvailable ? "legal" : "no"}</dd>
              </div>
            </dl>
            <p className="battlefield-action-prompt">{actionPrompt}</p>
            <div className="battlefield-attack-profile-list">
              {attackProfiles.length === 0 ? (
                <p className="battlefield-attack-profile-empty">No legal attack profiles right now.</p>
              ) : (
                attackProfiles.map((profile) => (
                  <article key={profile.targetId} className="battlefield-attack-profile-card">
                    <div className="battlefield-attack-profile-header">
                      <strong>{profile.targetName}</strong>
                      <span className="battlefield-attack-profile-chip">
                        {profile.selectedKey === profile.defaultKey ? "map default" : "custom pick"}
                      </span>
                    </div>
                    <div className="battlefield-attack-profile-option-list">
                      {profile.options.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          className={[
                            "battlefield-attack-profile-option",
                            option.key === profile.selectedKey ? "battlefield-attack-profile-option-selected" : "",
                          ].filter(Boolean).join(" ")}
                          disabled={game.turnStep !== TurnStep.Action}
                          onClick={() => selectAttackProfile(profile.targetId, option.key)}
                        >
                          <span className="battlefield-attack-profile-option-label-row">
                            <span className="battlefield-attack-profile-primary">{option.label}</span>
                            {option.isDefault ? (
                              <span className="battlefield-attack-profile-option-tag">default</span>
                            ) : null}
                          </span>
                          <span className="battlefield-attack-profile-meta">{option.stats}</span>
                        </button>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </div>
            {pendingChargeHexId === null ? null : (
              <div className="battlefield-profile-section">
                <p className="battlefield-profile-section-label">Charge Profiles from {pendingChargeHexId}</p>
                <div className="battlefield-attack-profile-list">
                  {chargeProfiles.length === 0 ? (
                    <p className="battlefield-attack-profile-empty">No legal charge profiles from this hex.</p>
                  ) : (
                    chargeProfiles.map((profile) => (
                      <article key={`${pendingChargeHexId}:${profile.targetId}`} className="battlefield-attack-profile-card">
                        <div className="battlefield-attack-profile-header">
                          <strong>{profile.targetName}</strong>
                          <span className="battlefield-attack-profile-chip">
                            {profile.selectedKey === profile.defaultKey ? "charge default" : "custom pick"}
                          </span>
                        </div>
                        <div className="battlefield-attack-profile-option-list">
                          {profile.options.map((option) => (
                            <button
                              key={option.key}
                              type="button"
                              className={[
                                "battlefield-attack-profile-option",
                                option.key === profile.selectedKey ? "battlefield-attack-profile-option-selected" : "",
                              ].filter(Boolean).join(" ")}
                              disabled={game.turnStep !== TurnStep.Action}
                              onClick={() => selectChargeProfile(profile.targetId, option.key)}
                            >
                              <span className="battlefield-attack-profile-option-label-row">
                                <span className="battlefield-attack-profile-primary">{option.label}</span>
                                {option.isDefault ? (
                                  <span className="battlefield-attack-profile-option-tag">default</span>
                                ) : null}
                              </span>
                              <span className="battlefield-attack-profile-meta">{option.stats}</span>
                            </button>
                          ))}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            )}
            <div className="battlefield-action-controls">
              <label className="battlefield-control-group">
                <span>Move</span>
                <select
                  value={selectedMoveOption?.hexId ?? ""}
                  onChange={(event) => setSelectedMoveHexId(event.target.value === "" ? null : event.target.value as HexId)}
                  disabled={selectedMoveOption === null || game.turnStep !== TurnStep.Action}
                >
                  {moveOptions.length === 0 ? (
                    <option value="">No legal move</option>
                  ) : (
                    moveOptions.map((option) => (
                      <option key={option.hexId} value={option.hexId}>
                        {option.label}
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedMoveOption !== null) {
                      applyAction(selectedMoveOption.action);
                    }
                  }}
                  disabled={selectedMoveOption === null || game.turnStep !== TurnStep.Action}
                >
                  Apply
                </button>
              </label>
              <label className="battlefield-control-group">
                <span>Charge</span>
                <select
                  value={selectedChargeOption?.key ?? ""}
                  onChange={(event) => setSelectedChargeKey(event.target.value === "" ? null : event.target.value)}
                  disabled={selectedChargeOption === null || game.turnStep !== TurnStep.Action}
                >
                  {chargeOptions.length === 0 ? (
                    <option value="">No legal charge</option>
                  ) : (
                    chargeOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedChargeOption !== null) {
                      applyAction(selectedChargeOption.action);
                    }
                  }}
                  disabled={selectedChargeOption === null || game.turnStep !== TurnStep.Action}
                >
                  Apply
                </button>
              </label>
              <div className="battlefield-button-row">
                <button
                  type="button"
                  onClick={focusHand}
                  disabled={actionLens.focusAction === null || game.turnStep !== TurnStep.Action}
                >
                  {pendingFocus ? "Confirm Focus" : "Focus"}
                </button>
                <button
                  type="button"
                  onClick={guardSelectedFighter}
                  disabled={actionLens.guardAction === null || game.turnStep !== TurnStep.Action}
                >
                  {pendingGuardFighterId === selectedFighterId && selectedFighterId !== null ? "Confirm Guard" : "Guard"}
                </button>
                <button
                  type="button"
                  onClick={passTurn}
                  disabled={actionLens.passAction === null}
                >
                  {game.turnStep === TurnStep.Power
                    ? pendingPassPower ? "Confirm Pass Power" : "Pass Power"
                    : "Pass"}
                </button>
              </div>
            </div>
          </section>

          <section className="battlefield-panel">
            <div className="battlefield-heading">
              <p className="battlefield-eyebrow">Warbands</p>
              <h2>Players and fighters</h2>
            </div>
            <div className="battlefield-warband-grid">
              {game.players.map((player) => (
                <PlayerPanel
                  key={player.id}
                  activePlayerId={activePlayer?.id ?? null}
                  game={game}
                  player={player}
                  selectedFighterId={selectedFighterId}
                  onSelectFighter={selectFighter}
                />
              ))}
            </div>
          </section>

          <section className="battlefield-panel">
            <div className="battlefield-heading">
              <p className="battlefield-eyebrow">Feature Tokens</p>
              <h2>Placed objectives and cover</h2>
            </div>
            <div className="battlefield-token-list">
              {game.board.featureTokens.map((featureToken) => (
                <article key={featureToken.id} className="battlefield-token-card">
                  <div className="battlefield-token-card-header">
                    <strong>{featureToken.id}</strong>
                    <span className={`battlefield-feature-chip battlefield-feature-${featureToken.side}`}>
                      {formatFeatureTokenSide(featureToken.side)}
                    </span>
                  </div>
                  <p className="battlefield-token-meta">Hex: {featureToken.hexId}</p>
                  <p className="battlefield-token-meta">
                    Holder: {featureToken.heldByFighterId === null ? "none" : getFighterName(game, featureToken.heldByFighterId)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="battlefield-panel">
            <div className="battlefield-heading">
              <p className="battlefield-eyebrow">Match Log</p>
              <h2>Recent events</h2>
            </div>
            <ol className="battlefield-event-list">
              {recentEvents.map((event, index) => (
                <li key={`${index}-${event}`}>{event}</li>
              ))}
            </ol>
          </section>

          <section className="battlefield-panel">
            <div className="battlefield-heading">
              <p className="battlefield-eyebrow">Debug</p>
              <h2>Game Records</h2>
            </div>
            {game.pendingCombat !== null && (
              <div style={{ background: "#2a1a00", border: "1px solid #c90", padding: "6px 8px", marginBottom: 8, fontSize: 11, fontFamily: "monospace", color: "#ffd" }}>
                <strong>pendingCombat:</strong> phase={game.pendingCombat.phase},
                attacker={game.pendingCombat.attackerFighterId},
                target={game.pendingCombat.targetFighterId},
                weapon={game.pendingCombat.weaponId},
                ability={String(game.pendingCombat.selectedAbility)},
                attackRoll=[{game.pendingCombat.attackRoll.join(",")}],
                saveRoll=[{game.pendingCombat.saveRoll.join(",")}],
                outcome={String(game.pendingCombat.outcome)},
                dmg={game.pendingCombat.damageInflicted}
              </div>
            )}
            {localPlayer !== null && (
              <div style={{ background: "#1a1a2a", border: "1px solid #669", padding: "6px 8px", marginBottom: 8, fontSize: 11, fontFamily: "monospace", color: "#ddf" }}>
                <strong>Power Hand ({localPlayer.powerHand.length} cards):</strong>
                {localPlayer.powerHand.map((card) => {
                  const targets = card.getLegalTargets(game);
                  return (
                    <div key={card.id} style={{ color: targets.length > 0 ? "#0f0" : "#666", paddingLeft: 8 }}>
                      {card.name} [{card.kind}] zone={card.zone} targets={targets.length}
                    </div>
                  );
                })}
              </div>
            )}
            <ol style={{ fontSize: 11, fontFamily: "monospace", listStyle: "none", padding: 0, margin: 0, maxHeight: 300, overflowY: "auto" }}>
              {[...game.records].reverse().slice(0, 30).map((record, index) => (
                <li key={index} style={{ padding: "2px 4px", borderBottom: "1px solid #333", color: "#ccc" }}>
                  <strong style={{ color: "#8cf" }}>{record.kind}</strong>
                  {record.invokedByPlayerId && <span> by={record.invokedByPlayerId}</span>}
                  {record.invokedByFighterId && <span> fighter={record.invokedByFighterId}</span>}
                  {record.invokedByCardId && <span> card={record.invokedByCardId}</span>}
                  {record.actionKind && <span> action={record.actionKind}</span>}
                  <span style={{ color: "#999" }}> r{record.roundNumber}</span>
                  <div style={{ color: "#aaa", paddingLeft: 8 }}>{JSON.stringify(record.data, null, 0).slice(0, 200)}</div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="battlefield-hero">
          <div>
            <p className="battlefield-eyebrow">Game State</p>
            <h1>Battlefield</h1>
          </div>
          <dl className="battlefield-hero-stats">
            <div>
              <dt>State</dt>
              <dd>{game.state.kind}</dd>
            </div>
            <div>
              <dt>Active Player</dt>
              <dd>{activePlayer?.name ?? "none"}</dd>
            </div>
            <div>
              <dt>Turn Step</dt>
              <dd>{game.turnStep ?? "n/a"}</dd>
            </div>
            <div>
              <dt>Phase</dt>
              <dd>{game.phase}</dd>
            </div>
            <div>
              <dt>Board Side</dt>
              <dd>{game.board.side}</dd>
            </div>
            <div>
              <dt>Hexes</dt>
              <dd>{game.board.hexes.length}</dd>
            </div>
            <div>
              <dt>Feature Tokens</dt>
              <dd>{game.board.featureTokens.length}</dd>
            </div>
            <div>
              <dt>Round</dt>
              <dd>{game.roundNumber}</dd>
            </div>
          </dl>
        </section>
    </DebugPanel>
    <DockActionOverlay interaction={dockInteraction} />
    </>
  );
}

// ===== Setup helpers =====

function noop(): void {}

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

function renderSetupPhaseContent(
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
      {void game}
    </>
  );
}
