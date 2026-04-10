import { useEffect, useMemo, useState } from "react";
import "./PracticeBattlefieldApp.css";
import PlayerHandDockShell from "./PlayerHandDockShell";
import { DockActionOverlay, type DockInteraction } from "./PlayerHandDock";
import { getLocalPlayer, LOCAL_PLAYER_ID } from "./localPlayer";
import {
  CombatActionService,
  CombatAutoResolver,
  createCombatReadySetupPracticeGame,
  deterministicFirstPlayerRollOff,
  DumbAiController,
  FocusAction,
  GameEngine,
  GameRecordKind,
  LocalPlayerController,
  CardZone,
  TurnStep,
  type CardId,
  type CombatController,
  type FeatureTokenState,
  type FighterId,
  type Game,
  type DeckDefinition,
  type HexId,
  type PlayerId,
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
import { projectBoardScene, type BoardSceneHexClickIntent, type BoardSceneQuickAction } from "./board/boardScene";
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
  getArmedPathModel,
  getAttackActionForTarget,
  getAttackPreviewByTarget,
  getAttackProfiles,
  getChargeActionForTarget,
  getChargeActionsForHex,
  getChargeOptions,
  getChargePairKey,
  getChargePreviewByTarget,
  getChargeProfiles,
  getChargeTargetIdsForHex,
  getDefaultSelectableFighterId,
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

const combatActionService = new CombatActionService();
const demoEngine = new GameEngine(
  undefined, undefined, undefined, undefined, undefined, undefined,
  new Set([LOCAL_PLAYER_ID]),
);

type PracticeBattlefieldAppProps = {
  warband?: WarbandDefinition;
  deck?: DeckDefinition | null;
  game?: Game;
};

export default function PracticeBattlefieldApp({
  warband,
  deck = null,
  game: providedGame,
}: PracticeBattlefieldAppProps = {}) {
  const [game, setGame] = useState<Game>(
    () => providedGame ?? createActionStepPracticeGame(warband, deck),
  );
  const [refreshTick, setRefreshTick] = useState(0);
  const [resultFlash, setResultFlash] = useState<BattlefieldResultFlash | null>(null);
  const [lastResolvedAction, setLastResolvedAction] = useState<BattlefieldResultFlash | null>(null);
  const boardProjection = projectBoard(game.board);
  const recentEvents = [...game.eventLog].slice(-10).reverse();
  const localPlayer = getLocalPlayer(game);
  const activePlayer = game.activePlayerId === null ? null : game.getPlayer(game.activePlayerId) ?? null;
  const legalActions = activePlayer === null ? [] : combatActionService.getLegalActions(game, activePlayer.id);
  const selectableFighters =
    activePlayer?.fighters.filter((fighter) => !fighter.isSlain && fighter.currentHexId !== null) ?? [];
  const [selectedFighterId, setSelectedFighterId] = useState<FighterId | null>(
    selectableFighters[0]?.id ?? getDefaultSelectableFighterId(game),
  );
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
  const actionLens = getFighterActionLens(game, activePlayer, selectedFighterId, legalActions);
  const powerOverlay = getPowerOverlayModel(game, activePlayer, legalActions);
  const handPowerPlayable = buildHandPowerPlayableMap(powerOverlay);
  const moveOptions = getMoveOptions(actionLens);
  const chargeOptions = getChargeOptions(game, actionLens);
  const [selectedMoveHexId, setSelectedMoveHexId] = useState<HexId | null>(null);
  const [selectedChargeKey, setSelectedChargeKey] = useState<string | null>(null);
  const [pendingMoveHexId, setPendingMoveHexId] = useState<HexId | null>(null);
  const [pendingDelveFeatureTokenId, setPendingDelveFeatureTokenId] = useState<FeatureTokenState["id"] | null>(null);
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
  const diceTrayModel = getDiceTrayModel(game);
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
  const boardTurnHeader = getBoardTurnHeaderModel({
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

  // Hover state is kept in the parent so that `projectBoardScene` can bake
  // the hover-derived highlight flags into the scene. Keeping it here (and
  // not inside BoardMap) means any alternate renderer can consume the
  // same scene without reimplementing hover tracking.
  const [hoveredChargeTargetId, setHoveredChargeTargetId] = useState<FighterId | null>(null);
  useEffect(() => {
    if (pendingChargeHexId !== null) {
      setHoveredChargeTargetId(null);
      return;
    }
    if (hoveredChargeTargetId !== null && !actionLens.chargeTargetIds.has(hoveredChargeTargetId)) {
      setHoveredChargeTargetId(null);
    }
  }, [actionLens.chargeTargetIds, hoveredChargeTargetId, pendingChargeHexId]);

  // Controller map: every player seat is driven by one `CombatController`.
  // Local player is human (the UI); every other player is currently a
  // `DumbAiController`. Swapping a seat's controller is all it takes to
  // plug in a smarter AI, a remote player, or restore hot-seat play —
  // the rest of the app (scene projection, UI gating, action handlers)
  // reads from this single source of truth via `combatAutoResolver`.
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
    () => new CombatAutoResolver(combatControllers, LOCAL_PLAYER_ID, demoEngine),
    [combatControllers],
  );

  const isHumanTurn = combatAutoResolver.isHumanTurn(game);

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
    setupLegalHexIds: undefined,
    isSetupClickEnabled: false,
    hoveredChargeTargetId,
    isInteractionEnabled: isHumanTurn,
  });

  // Map hex click intents (returned by the scene) into the existing
  // combat action handlers. The renderer doesn't know about these
  // functions — it just forwards the intent.
  function handleHexClickIntent(intent: BoardSceneHexClickIntent): void {
    switch (intent.kind) {
      case "none":
        return;
      case "select-fighter":
        selectFighter(intent.fighterId);
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
      case "setup-hex":
        // Not reachable in combat mode — setupLegalHexIds is undefined.
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
    }
  }

  function selectFighter(fighterId: FighterId | null): void {
    setSelectedFighterId(fighterId);
    setSelectedMoveHexId(null);
    setSelectedChargeKey(null);
    clearPendingInteractions();
    setSelectedAttackKeysByTarget({});
    setSelectedChargeKeysByPair({});
  }

  function refreshGame(): void {
    setRefreshTick((value) => value + 1);
  }

  // After every state change, ask the auto-resolver for one more step.
  // A small delay lets the user see each AI move instead of flashing
  // through the whole opponent turn in a single frame. The effect
  // cancels its pending timer on unmount / re-schedule, so rapid state
  // changes don't queue stale steps.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (combatAutoResolver.resolveAutomaticStep(game)) {
        refreshGame();
      }
    }, 450);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTick, combatAutoResolver]);

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

  function applyAction(action: BattlefieldAppAction): void {
    const previousActivePlayerId = game.activePlayerId;
    const previousSelectedFighterId = selectedFighterId;
    demoEngine.applyGameAction(game, action);
    const nextResolvedAction = buildBattlefieldResultFlash(game, action);
    setResultFlash(nextResolvedAction);
    setLastResolvedAction(nextResolvedAction);
    setSelectedMoveHexId(null);
    setSelectedChargeKey(null);
    clearPendingInteractions();
    setSelectedAttackKeysByTarget({});
    setSelectedChargeKeysByPair({});
    setSelectedFighterId(getNextSelectedFighterId(game, previousActivePlayerId, previousSelectedFighterId));
    refreshGame();
  }

  function scoreObjective(cardId: CardId): void {
    if (localPlayer === null) return;
    const card = localPlayer.getCard(cardId);
    if (card === undefined) return;
    // Manually score: move from hand to scored pile, add glory
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
    if (chargeActions.length === 0) {
      return;
    }

    clearPendingInteractions();
    setPendingChargeHexId(hexId);
  }

  function startChargeAgainstTarget(targetId: FighterId): void {
    const destinationHexId = getPreferredChargeDestinationForTarget(actionLens, targetId);
    if (destinationHexId === null) {
      return;
    }

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

    const selectedChargeKey =
      pendingChargeHexId === null
        ? null
        : getSelectedChargeKeyForPair(selectedChargeKeysByPair, pendingChargeHexId, targetId);
    const selectedChargeAction = getChargeActionForTarget(actionLens, pendingChargeHexId, targetId, selectedChargeKey);
    if (selectedChargeAction !== null) {
      applyAction(selectedChargeAction);
    }
  }

  function cancelPendingCharge(): void {
    clearPendingInteractions();
  }

  function delveSelectedFighter(): void {
    if (actionLens.delveAction === null || selectedFeatureToken === null) {
      return;
    }

    if (pendingDelveFeatureTokenId !== selectedFeatureToken.id) {
      clearPendingInteractions();
      setPendingDelveFeatureTokenId(selectedFeatureToken.id);
      return;
    }

    applyAction(actionLens.delveAction);
  }

  function focusHand(): void {
    if (actionLens.focusAction === null) {
      return;
    }

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
    if (actionLens.guardAction === null || selectedFighterId === null) {
      return;
    }

    if (pendingGuardFighterId !== selectedFighterId) {
      clearPendingInteractions();
      setPendingGuardFighterId(selectedFighterId);
      return;
    }

    applyAction(actionLens.guardAction);
  }

  function passTurn(): void {
    if (actionLens.passAction === null) {
      return;
    }

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
    if (pendingChargeHexId === null) {
      return;
    }

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

  // The dock hands back a card id; we either arm the single legal option
  // directly (reusing selectPowerOption for the arm→confirm flow) or stash
  // the card id so the dock can show its inline target picker for the
  // multi-target case.
  function handleDockSelectCard(cardId: CardId): void {
    const options = handPowerPlayable.get(cardId) ?? [];
    if (options.length === 0) {
      return;
    }
    if (options.length === 1) {
      selectPowerOption(options[0]);
      return;
    }
    clearPendingInteractions();
    setPendingPlayCardId(cardId);
  }

  // Defensive: if the armed card's options disappear (e.g., target died
  // mid-turn, or the power overlay regenerated without it), drop the
  // armed card id so the UI doesn't latch on a stale value.
  useEffect(() => {
    if (pendingPlayCardId === null) {
      return;
    }
    const options = handPowerPlayable.get(pendingPlayCardId);
    if (options === undefined || options.length === 0) {
      setPendingPlayCardId(null);
    }
  }, [pendingPlayCardId, handPowerPlayable]);

  useEffect(() => {
    if (
      pendingMoveHexId === null &&
      pendingDelveFeatureTokenId === null &&
      !pendingFocus &&
      pendingGuardFighterId === null &&
      !pendingPassPower &&
      pendingPowerOptionKey === null &&
      pendingPlayCardId === null &&
      pendingChargeHexId === null &&
      pendingChargeTargetId === null &&
      pendingAttackTargetId === null
    ) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        clearPendingInteractions();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingMoveHexId, pendingDelveFeatureTokenId, pendingFocus, pendingGuardFighterId, pendingPassPower, pendingPowerOptionKey, pendingPlayCardId, pendingChargeHexId, pendingChargeTargetId, pendingAttackTargetId]);

  useEffect(() => {
    if (resultFlash === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setResultFlash((current) => (current?.id === resultFlash.id ? null : current));
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [resultFlash]);

  function resetBattlefield(): void {
    const nextGame = createActionStepPracticeGame(warband, deck);
    setGame(nextGame);
    setResultFlash(null);
    setLastResolvedAction(null);
    setSelectedFighterId(getDefaultSelectableFighterId(nextGame));
    setSelectedMoveHexId(null);
    setSelectedChargeKey(null);
    clearPendingInteractions();
    setSelectedAttackKeysByTarget({});
    setSelectedChargeKeysByPair({});
  }

  // Dock always shows the local player's hand. In the previous
  // hot-seat mode this was `activePlayer`, but now that the opponent
  // can be an AI (see `combatControllers`) we don't ever want to
  // display the AI's private hand — the user is Player One and should
  // see their own cards regardless of whose turn it is.
  const dockPlayer = localPlayer;

  // Project all the interactive state down to a single union the dock can
  // consume. The dock never reads `game` directly — everything it needs
  // flows through `interaction`.
  const dockInteraction: DockInteraction = (() => {
    // During AI turns the dock is strictly read-only; we neither show
    // focus toggles nor power-card play targets because both would let
    // the user hijack the opponent's decisions.
    if (!isHumanTurn) {
      return { kind: "readonly" };
    }
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
    if (game.turnStep === TurnStep.Power && handPowerPlayable.size > 0) {
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

  return (
    <>
    <main className="battlefield-app-shell">
      <section className="battlefield-layout">
        <section className="battlefield-panel battlefield-board-panel">
          <BoardMap
            scene={boardScene}
            onHoverChargeTarget={(fighterId) =>
              setHoveredChargeTargetId(fighterId as FighterId | null)
            }
            onHexClickIntent={handleHexClickIntent}
            onQuickAction={handleQuickAction}
            onApplyPowerOption={selectPowerOption}
            onDelveInlineFeature={delveSelectedFighter}
          />
        </section>

        <aside className="battlefield-side-rail">
          <DiceTray model={diceTrayModel} />
          {diceTrayModel === null ? (
            <div className="battlefield-side-rail-empty">
              Dice results will appear here
            </div>
          ) : null}
        </aside>
      </section>

      {dockPlayer === null ? null : (
        <PlayerHandDockShell
          player={dockPlayer}
          interaction={dockInteraction}
          scorableObjectives={scorableObjectives}
          onScoreObjective={scoreObjective}
        />
      )}
    </main>
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
                <button type="button" onClick={resetBattlefield}>Reset</button>
              </div>
            </div>
            <div className="battlefield-action-notes">
              <p>
                <strong>Attack:</strong> click a crimson target to arm it, then click that same crimson target again to confirm.
              </p>
              <p>
                <strong>Attack profiles:</strong> click a profile on a target card to make the map use it for that target.
              </p>
              <p>
                <strong>Move:</strong> click a teal hex to arm it, then click the same teal hex again to confirm.
              </p>
              <p>
                <strong>Charge:</strong> click a gold destination, then click a red target to arm it, then click that same red target again to confirm. Click the armed gold hex again or press Escape to cancel.
              </p>
              <p>
                <strong>Charge profiles:</strong> after you arm a gold destination, pick a target profile card to control which charge attack the map uses.
              </p>
              <p>
                <strong>Focus:</strong> click Focus once to open the hand overlay, toggle any objective and power cards you want to discard, then click Focus again to confirm, or press Escape to cancel.
              </p>
              <p>
                <strong>Guard:</strong> the selected fighter gets a white ring when guard is legal. Click Guard once to arm it, click Guard again to confirm, or press Escape to cancel.
              </p>
              <p>
                <strong>Board buttons:</strong> guard appears on the map during action step, and pass power appears on the map during power step. Both now arm on the first click and confirm on the second.
              </p>
              <p>
                <strong>Power step cue:</strong> the active player&apos;s fighters glow teal during power step response windows.
              </p>
              <p>
                <strong>Power overlay:</strong> legal ploys, upgrades, and warscroll abilities appear on the map during power step. Click once to arm a power play, click the same option again to confirm, or press Escape to cancel.
              </p>
              <p>
                <strong>Delve:</strong> if the selected fighter is standing on a revealed feature token during power step, the feature chip and board button both become delve controls. Click once to arm, click the same control again to confirm, or press Escape to cancel.
              </p>
              <p>
                <strong>Attack targets:</strong>{" "}
                {attackTargetNames.length === 0 ? "none" : attackTargetNames.join(", ")}
              </p>
              <p>
                <strong>Charge targets:</strong>{" "}
                {chargeTargetNames.length === 0 ? "none" : chargeTargetNames.join(", ")}
              </p>
              {recentCombatTargetName === null ? null : (
                <p>
                  <strong>Recent combat target:</strong> {recentCombatTargetName}
                </p>
              )}
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
              <h2>Recent setup events</h2>
            </div>
            <ol className="battlefield-event-list">
              {recentEvents.map((event, index) => (
                <li key={`${index}-${event}`}>{event}</li>
              ))}
            </ol>
          </section>
        </div>

        <section className="battlefield-hero">
          <div>
            <p className="battlefield-eyebrow">Practice Battlefield</p>
            <h1>Combat-ready map from the real board state.</h1>
            <p className="battlefield-copy">
              The browser now renders the actual centered battlefield, including deployed
              fighters, territory ownership, starting hexes, edge hexes, and feature tokens.
            </p>
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



function createActionStepPracticeGame(
  warband?: WarbandDefinition,
  deck: DeckDefinition | null = null,
): Game {
  const game = createCombatReadySetupPracticeGame(
    "game:setup-practice:map-action-step",
    warband,
    deck,
  );
  const engine = new GameEngine();

  engine.startCombatRound(game, [deterministicFirstPlayerRollOff], LOCAL_PLAYER_ID);

  return game;
}
