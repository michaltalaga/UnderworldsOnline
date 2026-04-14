import { useEffect, useMemo, useRef, useState } from "react";
import { getLocalPlayer, LOCAL_PLAYER_ID } from "../localPlayer";
import {
  CombatActionService,
  CombatAutoResolver,
  ConfirmCombatAction,
  createSetupPracticeGame,
  DeployFighterAction,
  DumbAiController,
  FocusAction,
  GameEngine,
  GameRecordKind,
  LocalPlayerController,
  CardZone,
  EndActionStepAction,
  Phase,
  PlaceFeatureTokenAction,
  SetupActionService,
  SetupAutoResolver,
  TurnStep,
  type Card,
  type CardId,
  type CombatController,
  type FeatureToken,
  type FighterId,
  type Game,
  type DeckDefinition,
  type HexId,
  type PlayerId,
  type Player,
  type SetupAction,
  type WarbandDefinition,
} from "../domain";
import type {
  BattlefieldAppAction,
  BattlefieldResultFlash,
  PowerOverlayOption,
} from "../board/battlefieldModels";
import {
  getFighterName,
} from "../board/battlefieldFormatters";
import { buildBattlefieldResultFlash } from "../board/battlefieldResultFlash";
import {
  buildHandPowerPlayableMap,
  getCardIdFromPowerOption,
  getPowerOverlayModel,
  getPowerOverlayOptionByKey,
} from "../board/battlefieldOverlays";
import { getActiveCombatState } from "../domain/rules/CombatStateProjection";
import {
  createEmptyActionLens,
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
} from "../board/fighterActionLens";
import type { ActiveActionMode, BoardSceneHexClickIntent, BoardSceneQuickAction } from "../board/boardScene";

// Stateless singletons -- reused across renders.
const combatActionService = new CombatActionService();
const setupActionService = new SetupActionService();
const gameEngine = new GameEngine(
  undefined, undefined, undefined, undefined, undefined, undefined,
  new Set([LOCAL_PLAYER_ID]),
);

export type UseGameEngineOptions = {
  warband: WarbandDefinition;
  deck?: DeckDefinition | null;
};

export function useGameEngine({ warband, deck = null }: UseGameEngineOptions) {
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

  // Combat-derived state (safe to compute during setup -- returns empty results)
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

  // ===== Effects =====

  // Setup: auto-advance trivial states and opponent actions.
  useEffect(() => {
    if (!isSetup) return;
    if (setupAutoResolver.resolveAutomaticStep(game)) {
      refreshGame();
    }
  }, [game, game.state.kind, game.activePlayerId, setupAutoResolver, isSetup]);

  // Setup -> Combat transition: when setup reaches combatReady, start combat.
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
      if (target.closest("[data-hex]") !== null) return;
      if (target.closest(".player-hand-dock-shell") !== null) return;
      if (target.closest(".status-bar-actions") !== null) return;
      if (target.closest("[data-roster-rail]") !== null) return;
      if (target.closest("[data-context-menu]") !== null) return;
      if (target.closest("[data-quick-actions]") !== null) return;
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
    if (activePlayer === null || getActiveCombatState(game) === null) return;
    applyAction(new ConfirmCombatAction(activePlayer));
  }

  function endActionStep(): void {
    if (activePlayer === null) return;
    applyAction(new EndActionStepAction(activePlayer));
  }

  function scoreObjective(cardId: CardId): void {
    if (localPlayer === null) return;
    const card = localPlayer.getCard(cardId);
    if (card === undefined) return;
    const handIndex = localPlayer.objectiveHand.indexOf(card);
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
    const focusPlayer = actionLens.focusAction.player;
    const objectiveCards = selectedFocusObjectiveIds
      .map((cardId) => focusPlayer.objectiveHand.find((c) => c.id === cardId))
      .filter((c): c is Card => c !== undefined);
    const powerCards = selectedFocusPowerIds
      .map((cardId) => focusPlayer.powerHand.find((c) => c.id === cardId))
      .filter((c): c is Card => c !== undefined);
    applyAction(new FocusAction(focusPlayer, objectiveCards, powerCards));
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

  return {
    // Core game state
    game,
    refreshTick,
    isSetup,
    isHumanTurn,
    localPlayer,
    opponentPlayer,
    activePlayer,

    // Selected / pending UI state
    selectedFighterId,
    selectedFighter,
    selectedFighterHex,
    selectedFeatureToken,
    selectedMoveHexId,
    selectedMoveOption,
    selectedChargeKey,
    selectedChargeOption,
    selectedFighterName,
    selectedFocusObjectiveIds,
    selectedFocusPowerIds,
    selectedAttackKeysByTarget,
    selectedChargeKeysByPair,
    activeActionMode,
    hoveredChargeTargetId,
    setHoveredChargeTargetId,

    // Pending interactions
    pendingMoveHexId,
    pendingDelveFeatureTokenId,
    pendingFocus,
    pendingGuardFighterId,
    pendingPassPower,
    pendingPowerOptionKey,
    pendingPowerOption,
    pendingPlayCardId,
    pendingChargeHexId,
    pendingChargeTargetId,
    pendingChargeTargetName,
    pendingChargeBadgeLabel,
    pendingAttackTargetId,
    pendingAttackTargetName,
    pendingAttackBadgeLabel,

    // Computed / derived
    actionLens,
    powerOverlay,
    handPowerPlayable,
    moveOptions,
    chargeOptions,
    attackProfiles,
    attackPreviewByTarget,
    chargePreviewByTarget,
    chargeProfiles,
    visibleChargeTargetIds,
    chargeTargetNames,
    attackTargetNames,
    focusSelectionSummary,
    scorableObjectives,
    recentCombat,
    recentCombatTargetId,
    recentCombatTargetName,
    recentEvents,
    resultFlash,
    lastResolvedAction,
    actionPrompt,

    // Setup-specific
    setupLegalHexIds,
    setupOnHexClick,

    // Actions
    applySetupAction,
    autoSetupToBattle,
    applyAction,
    selectFighter,
    dismissSelection,
    handleContextMenuAction,
    dismissContextMenu,
    confirmCombat,
    endActionStep,
    scoreObjective,
    moveToHex,
    startChargeToHex,
    startChargeAgainstTarget,
    completeChargeAgainstTarget,
    cancelPendingCharge,
    delveSelectedFighter,
    focusHand,
    toggleFocusObjectiveCard,
    toggleFocusPowerCard,
    guardSelectedFighter,
    passTurn,
    attackTarget,
    selectAttackProfile,
    selectChargeProfile,
    selectPowerOption,
    handleDockSelectCard,
    handleHexClickIntent,
    handleQuickAction,
    clearPendingInteractions,
    setSelectedMoveHexId,
    setSelectedChargeKey,
  };
}

// ===== Setup helpers =====

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
        .map((action) => action.hex.id),
    );
    return {
      legalHexIds,
      onHexClick: (hexId) => {
        const hex = game.getHex(hexId);
        if (hex === undefined) return;
        applySetupAction(new PlaceFeatureTokenAction(activePlayer, hex));
      },
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
        .filter((action) => action.fighter.id === nextFighter.id)
        .map((action) => action.hex.id),
    );
    return {
      legalHexIds,
      onHexClick: (hexId) => {
        const hex = game.getHex(hexId);
        if (hex === undefined) return;
        applySetupAction(new DeployFighterAction(activePlayer, nextFighter, hex));
      },
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

// Re-export for use by GameView's board scene projection
import {
  getFeatureTokenBadge,
} from "../board/battlefieldFormatters";
import {
  getBoardTurnHeaderModel,
} from "../board/battlefieldOverlays";
import {
  getArmedPathModel,
} from "../board/fighterActionLens";

export { getSetupBannerText, getBoardTurnHeaderModel, getArmedPathModel, getFeatureTokenBadge };
