import {
  FeatureTokenSide,
  HexKind,
  TurnStep,
  type AttackDieFace,
  type FeatureToken,
  type FighterId,
  type Game,
  type HexId,
  type SaveDieFace,
} from "../domain";
import { getActiveCombatState } from "../domain/rules/CombatStateProjection";
import { LOCAL_PLAYER_ID } from "../localPlayer";
import type { BoardTheme } from "./boardTheme";
import {
  hexHeight as hexPixelHeight,
  hexWidth as hexPixelWidth,
  boardPadding,
  type PositionedHex,
} from "./projectBoard";
import {
  getChargeDestinationHexIdsForTarget,
  getChargeTargetHexIdsForHex,
} from "./fighterActionLens";
import type {
  ArmedPathModel,
  BattlefieldResultFlash,
  BoardTurnHeaderModel,
  FighterActionLens,
  PowerOverlayModel,
  ProfilePreviewModel,
} from "./battlefieldModels";
import {
  buildHexTitle,
  getFeatureTokenBadge,
  getFighterMapLabel,
  getFighterName,
  getFighterStatusTags,
  getPlayerToneClass,
} from "./battlefieldFormatters";

// ---------------------------------------------------------------------------
// BoardSceneModel
// ---------------------------------------------------------------------------
// A rendering-agnostic, fully-resolved description of everything on the map
// at a single point in time. It is the ONLY thing a renderer (DOM/SVG/canvas)
// needs to draw the board — it contains no references to Game, GameEngine,
// TurnStep, or any other domain type that would bind a renderer to the
// engine.
//
// Produced by `projectBoardScene`, which is the single place that pulls
// data out of the Game and flattens it for the view. Swapping renderers is
// a matter of writing a new component that consumes `BoardSceneModel`.

export type BoardSceneTerritoryOwner =
  | "none"
  | "player-one"
  | "player-two"
  | "unclaimed";

export type TerritoryIndicatorMode =
  | "none"
  | "tint"
  | "border"
  | "labels"
  | "markers"
  | "stripe";

export const territoryIndicatorModes: readonly TerritoryIndicatorMode[] = [
  "none", "tint", "border", "labels", "markers", "stripe",
];

export type BoardSceneFighter = {
  id: FighterId;
  ownerPlayerId: string;
  label: string;
  name: string;
  toneClass: string;
  statusTags: readonly string[];
};

export type BoardSceneFeatureToken = {
  id: string;
  side: FeatureTokenSide;
  badge: string;
};

// ---------------------------------------------------------------------------
// Action mode: the user picks an action from the context menu, then hex
// visuals and click intents are filtered to only that action.
// ---------------------------------------------------------------------------

export type ActiveActionMode = "move" | "charge" | "attack" | "guard" | null;

export type FighterContextMenuAction = {
  mode: "move" | "charge" | "attack" | "guard";
  label: string;
  count: number;
};

export type FighterContextMenuModel = {
  visible: boolean;
  left: number;
  top: number;
  fighterName: string;
  actions: FighterContextMenuAction[];
  guardArmed: boolean;
};

// Flattened state flags a renderer uses to decide how to paint a hex and
// its occupants. Mirrors the `HexRenderState` used internally by the DOM
// renderer, but is now the shared contract.
export type BoardSceneHexVisual = {
  territoryOwner: BoardSceneTerritoryOwner;
  kind: HexKind;
  isStarting: boolean;
  isEdge: boolean;
  isAttackTarget: boolean;
  isChargeDestination: boolean;
  isHoveredChargeDestination: boolean;
  isPendingDelveHex: boolean;
  isPendingGuardHex: boolean;
  isPendingAttackTarget: boolean;
  isPendingChargeHex: boolean;
  isPendingChargeTarget: boolean;
  isChargeTarget: boolean;
  isHoveredChargeTarget: boolean;
  isClickableHex: boolean;
  isDelveReadyHex: boolean;
  isPendingMoveHex: boolean;
  isMoveDestination: boolean;
  isPowerResponseHex: boolean;
  isRecentCombatTarget: boolean;
  isSelectedHex: boolean;
  isSelectableHex: boolean;
  isGuardReadyHex: boolean;
  isSetupLegalHex: boolean;
};

export type HexActionBadgeModel = {
  tone: "move" | "charge" | "armed" | "target" | "confirm" | "attack" | "last";
  label: string;
  detailed: boolean;
};

// Click "intent" = what the renderer should tell the parent to do when a
// hex is clicked. The renderer itself does NOT know about Move/Attack
// actions — it just forwards the intent and the parent turns it into a
// game action.
export type BoardSceneHexClickIntent =
  | { kind: "none" }
  | { kind: "select-fighter"; fighterId: FighterId }
  | { kind: "deselect-fighter" }
  | { kind: "cancel-charge" }
  | { kind: "attack-target"; fighterId: FighterId }
  | { kind: "start-charge-against-target"; fighterId: FighterId }
  | { kind: "complete-charge-against-target"; fighterId: FighterId }
  | { kind: "start-charge-to-hex"; hexId: HexId }
  | { kind: "move-to-hex"; hexId: HexId }
  | { kind: "setup-hex"; hexId: HexId };

export type BoardSceneArmedPathStep = {
  step: number;
  tone: "move" | "charge";
};

export type BoardSceneAttackPreview = {
  visible: readonly string[];
  remaining: number;
  fullLabels: readonly string[];
};

export type BoardSceneHex = {
  id: HexId;
  left: number;
  top: number;
  title: string;
  visual: BoardSceneHexVisual;
  occupant: BoardSceneFighter | null;
  featureToken: BoardSceneFeatureToken | null;
  actionBadge: HexActionBadgeModel | null;
  armedPathStep: BoardSceneArmedPathStep | null;
  clickIntent: BoardSceneHexClickIntent;
  keyboardClickIntent: BoardSceneHexClickIntent;
  chargeTargetFighterId: FighterId | null;
  isPowerResponseFighter: boolean;
  isDelveReadyFeature: boolean;
  isPendingDelveFeature: boolean;
  attackPreview: BoardSceneAttackPreview | null;
  chargePreview: BoardSceneAttackPreview | null;
  isSelectableFighter: boolean;
};

export type BoardSceneQuickAction =
  | { key: "focus"; armed: boolean; label: string }
  | {
      key: "delve";
      armed: boolean;
      label: string;
      featureTokenBadge: string;
      featureTokenId: string;
    }
  | {
      key: "guard";
      armed: boolean;
      label: string;
      selectedFighterName: string;
    }
  | { key: "pass-power"; armed: boolean; label: string }
  | { key: "end-action-step"; armed: boolean; label: string }
  | { key: "confirm-combat"; armed: boolean; label: string };

export type BoardSceneViewport = {
  width: number;
  height: number;
};

export type BoardSceneModel = {
  viewport: BoardSceneViewport;
  hexes: readonly BoardSceneHex[];
  selectedFighterName: string | null;
  backgroundImage: string | null;
  backgroundImageStyle: { left: string; top: string; width: string; height: string } | null;
  territoryIndicator: TerritoryIndicatorMode;
  territoryLabels: { playerOne: string; playerTwo: string } | null;
  statusBadge: BoardTurnHeaderModel;
  lastResolvedAction: BattlefieldResultFlash | null;
  resultFlash: BattlefieldResultFlash | null;
  quickActions: readonly BoardSceneQuickAction[];
  powerOverlay: PowerOverlayModel;
  showWarscrollOverlay: boolean;
  pendingPowerOptionKey: string | null;
  armedPathTone: "move" | "charge" | null;
  contextMenu: FighterContextMenuModel;
  pendingCombatRolls: {
    attackRoll: readonly AttackDieFace[];
    saveRoll: readonly SaveDieFace[];
  } | null;
};

// ---------------------------------------------------------------------------
// projectBoardScene
// ---------------------------------------------------------------------------

export type ProjectBoardSceneParams = {
  game: Game;
  positionedHexes: readonly PositionedHex[];
  actionLens: FighterActionLens;
  activePlayerId: string | null;
  selectedFighterId: FighterId | null;
  selectedFeatureToken: FeatureToken | null;
  pendingMoveHexId: HexId | null;
  pendingDelveFeatureTokenId: string | null;
  pendingFocus: boolean;
  pendingGuardFighterId: FighterId | null;
  pendingPassPower: boolean;
  pendingChargeHexId: HexId | null;
  pendingChargeTargetId: FighterId | null;
  pendingAttackTargetId: FighterId | null;
  pendingChargeBadgeLabel: string | null;
  pendingAttackBadgeLabel: string | null;
  pendingPowerOptionKey: string | null;
  recentCombatTargetId: FighterId | null;
  attackPreviewByTarget: ProfilePreviewModel;
  chargePreviewByTarget: ProfilePreviewModel;
  armedPath: ArmedPathModel | null;
  boardTurnHeader: BoardTurnHeaderModel;
  lastResolvedAction: BattlefieldResultFlash | null;
  resultFlash: BattlefieldResultFlash | null;
  powerOverlay: PowerOverlayModel;
  setupLegalHexIds?: ReadonlySet<HexId>;
  isSetupClickEnabled: boolean;
  hoveredChargeTargetId: FighterId | null;
  // When false, every hex click intent is `"none"` and the quick-action
  // row is empty. Used to lock the UI during AI turns so the user
  // doesn't accidentally play for the opponent.
  isInteractionEnabled: boolean;
  activeActionMode: ActiveActionMode;
  boardTheme?: BoardTheme | null;
  territoryIndicator?: TerritoryIndicatorMode;
};

export function projectBoardScene(params: ProjectBoardSceneParams): BoardSceneModel {
  const {
    game,
    positionedHexes,
    actionLens,
    activePlayerId,
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
    setupLegalHexIds,
    isSetupClickEnabled,
    hoveredChargeTargetId,
    isInteractionEnabled,
    activeActionMode,
  } = params;

  const isActionStep = game.turnStep === TurnStep.Action;
  const isPowerStep = game.turnStep === TurnStep.Power;

  const visibleChargeTargetHexIds = getChargeTargetHexIdsForHex(
    game,
    actionLens,
    pendingChargeHexId,
  );
  const hoveredChargeDestinationHexIds =
    pendingChargeHexId === null
      ? getChargeDestinationHexIdsForTarget(actionLens, hoveredChargeTargetId)
      : new Set<HexId>();

  const selectedFighterName =
    selectedFighterId === null ? null : getFighterName(game, selectedFighterId);

  // --- Viewport ---
  const viewport: BoardSceneViewport = {
    width:
      positionedHexes.length === 0
        ? boardPadding * 2
        : Math.max(...positionedHexes.map((hex) => hex.left + hexPixelWidth)) + boardPadding,
    height:
      positionedHexes.length === 0
        ? boardPadding * 2
        : Math.max(...positionedHexes.map((hex) => hex.top + hexPixelHeight)) + boardPadding,
  };

  // --- Hexes ---
  const hexes: BoardSceneHex[] = positionedHexes.map(({ hex, left, top }) => {
    const featureTokenState =
      hex.featureTokenId === null
        ? null
        : game.board.getFeatureToken(hex.featureTokenId) ?? null;
    const fighterState =
      hex.occupantFighterId === null
        ? null
        : game.getFighter(hex.occupantFighterId) ?? null;

    const occupant: BoardSceneFighter | null =
      fighterState === null
        ? null
        : {
            id: fighterState.id,
            ownerPlayerId: fighterState.ownerPlayerId,
            label: getFighterMapLabel(game, fighterState),
            name: getFighterName(game, fighterState.id),
            toneClass: getPlayerToneClass(fighterState.ownerPlayerId),
            statusTags: getFighterStatusTags(fighterState),
          };

    const featureToken: BoardSceneFeatureToken | null =
      featureTokenState === null
        ? null
        : {
            id: featureTokenState.id,
            side: featureTokenState.side,
            badge: getFeatureTokenBadge(featureTokenState),
          };

    const territoryOwnerId =
      hex.territoryId === null
        ? null
        : game.board.getTerritory(hex.territoryId)?.ownerPlayerId ?? null;
    const territoryOwner: BoardSceneTerritoryOwner =
      hex.territoryId === null
        ? "none"
        : territoryOwnerId === LOCAL_PLAYER_ID
          ? "player-one"
          : territoryOwnerId !== null
            ? "player-two"
            : "unclaimed";

    const isSelectableFighter =
      occupant !== null && occupant.ownerPlayerId === activePlayerId;
    const isSelectedHex = occupant !== null && occupant.id === selectedFighterId;
    const isMoveDestination = actionLens.moveHexIds.has(hex.id);
    const isPendingMoveHex = pendingMoveHexId === hex.id;
    const isChargeDestination = actionLens.chargeHexIds.has(hex.id);
    const isHoveredChargeDestination = hoveredChargeDestinationHexIds.has(hex.id);
    const isPendingChargeHex = pendingChargeHexId === hex.id;
    const isChargeTarget = visibleChargeTargetHexIds.has(hex.id);
    const isHoveredChargeTarget =
      pendingChargeHexId === null &&
      occupant !== null &&
      occupant.id === hoveredChargeTargetId &&
      isChargeTarget;
    const isPendingChargeTarget =
      occupant !== null && occupant.id === pendingChargeTargetId;
    const isAttackTarget =
      pendingChargeHexId === null &&
      isActionStep &&
      actionLens.attackTargetHexIds.has(hex.id);
    const isPendingAttackTarget =
      occupant !== null && occupant.id === pendingAttackTargetId;

    const attackPreviewLabels =
      occupant === null ? [] : attackPreviewByTarget.get(occupant.id) ?? [];
    const visibleAttackPreviewLabels = attackPreviewLabels.slice(0, 2);
    const remainingAttackPreviewCount = Math.max(
      0,
      attackPreviewLabels.length - visibleAttackPreviewLabels.length,
    );
    const shouldShowAttackPreview =
      isAttackTarget &&
      pendingAttackTargetId === null &&
      pendingChargeHexId === null &&
      attackPreviewLabels.length > 0;

    const chargePreviewLabels =
      occupant === null ? [] : chargePreviewByTarget.get(occupant.id) ?? [];
    const visibleChargePreviewLabels = chargePreviewLabels.slice(0, 2);
    const remainingChargePreviewCount = Math.max(
      0,
      chargePreviewLabels.length - visibleChargePreviewLabels.length,
    );
    const shouldShowChargePreview =
      isChargeTarget &&
      !isAttackTarget &&
      pendingChargeHexId === null &&
      chargePreviewLabels.length > 0;

    const armedPathRawStep = armedPath?.stepByHexId.get(hex.id) ?? null;
    const armedPathStep: BoardSceneArmedPathStep | null =
      armedPathRawStep === null || armedPath === null
        ? null
        : { step: armedPathRawStep, tone: armedPath.tone };

    const isRecentCombatTarget =
      pendingChargeHexId === null &&
      isPowerStep &&
      occupant !== null &&
      occupant.id === recentCombatTargetId;

    const isPowerResponseFighter =
      isPowerStep && occupant !== null && occupant.ownerPlayerId === activePlayerId;

    const isDelveReadyFeature =
      isPowerStep &&
      featureTokenState !== null &&
      actionLens.delveAction !== null &&
      actionLens.delveAction.featureTokenId === featureTokenState.id &&
      occupant !== null &&
      occupant.id === selectedFighterId;

    const isPendingGuardHex =
      isActionStep &&
      occupant !== null &&
      occupant.id === pendingGuardFighterId &&
      occupant.id === selectedFighterId;

    const isPendingDelveFeature =
      isDelveReadyFeature &&
      featureToken !== null &&
      featureToken.id === pendingDelveFeatureTokenId;

    // --- Action-mode gating ---
    // When an action mode is active, only the relevant visuals and click
    // intents are enabled. When null (context menu showing), hex action
    // highlights are suppressed — only fighter selection works.
    const showMoveVisuals = activeActionMode === "move" || activeActionMode === "charge";
    const showChargeVisuals = activeActionMode === "charge";
    const showAttackVisuals = activeActionMode === "attack";

    const isClickableMoveDestination = isMoveDestination && isActionStep && showMoveVisuals;
    const isClickableChargeTarget =
      pendingChargeHexId !== null &&
      isChargeTarget &&
      showChargeVisuals &&
      occupant !== null &&
      occupant.ownerPlayerId !== activePlayerId;
    const isClickableTargetFirstChargeTarget =
      pendingChargeHexId === null &&
      isChargeTarget &&
      showChargeVisuals &&
      occupant !== null &&
      occupant.ownerPlayerId !== activePlayerId;
    const isClickableAttackTarget =
      pendingChargeHexId === null &&
      isAttackTarget &&
      showAttackVisuals &&
      occupant !== null &&
      occupant.ownerPlayerId !== activePlayerId;
    const isSetupLegalHex = setupLegalHexIds?.has(hex.id) ?? false;
    const isClickableSetupHex = isSetupLegalHex && isSetupClickEnabled;
    const isInteractiveHex =
      isSelectableFighter ||
      isClickableAttackTarget ||
      isClickableChargeTarget ||
      isClickableTargetFirstChargeTarget ||
      isClickableMoveDestination ||
      isClickableSetupHex;

    const visual: BoardSceneHexVisual = {
      territoryOwner,
      kind: hex.kind,
      isStarting: hex.isStartingHex,
      isEdge: hex.isEdgeHex,
      isAttackTarget: showAttackVisuals && isAttackTarget && isInteractionEnabled,
      isChargeDestination: showChargeVisuals && isChargeDestination && isMoveDestination && isInteractionEnabled,
      isHoveredChargeDestination: showChargeVisuals && isHoveredChargeDestination,
      isPendingDelveHex: isPendingDelveFeature,
      isPendingGuardHex,
      isPendingAttackTarget: showAttackVisuals && isPendingAttackTarget,
      isPendingChargeHex: showChargeVisuals && isPendingChargeHex,
      isPendingChargeTarget: showChargeVisuals && isPendingChargeTarget,
      isChargeTarget: showChargeVisuals && isChargeTarget && isInteractionEnabled,
      isHoveredChargeTarget: showChargeVisuals && isHoveredChargeTarget,
      isClickableHex: isInteractiveHex && isInteractionEnabled,
      isDelveReadyHex: isDelveReadyFeature,
      isPendingMoveHex: showMoveVisuals && isPendingMoveHex,
      isMoveDestination: showMoveVisuals && isMoveDestination && isInteractionEnabled,
      isPowerResponseHex: isPowerResponseFighter,
      isRecentCombatTarget,
      isSelectedHex,
      isSelectableHex: isSelectableFighter && isInteractionEnabled,
      isGuardReadyHex: isSelectedHex && activeActionMode === "guard" && actionLens.guardAvailable && isInteractionEnabled,
      isSetupLegalHex,
    };

    const actionBadge = buildHexActionBadge({
      isAttackTarget: showAttackVisuals && isAttackTarget,
      isChargeDestination: showChargeVisuals && isChargeDestination,
      isPendingDelveHex: isPendingDelveFeature,
      isPendingGuardHex,
      isPendingAttackTarget: showAttackVisuals && isPendingAttackTarget,
      isPendingChargeHex: showChargeVisuals && isPendingChargeHex,
      pendingChargeBadgeLabel,
      pendingAttackBadgeLabel,
      isPendingChargeTarget: showChargeVisuals && isPendingChargeTarget,
      isChargeTarget: showChargeVisuals && isChargeTarget,
      isPendingMoveHex: showMoveVisuals && isPendingMoveHex,
      isMoveDestination: showMoveVisuals && isMoveDestination,
      isRecentCombatTarget,
    });

    // Click intent priority — gated by activeActionMode.
    // When `isInteractionEnabled` is false (AI turn), every hex reports
    // `"none"` and renders as non-interactive.
    const clickIntent: BoardSceneHexClickIntent = (() => {
      if (!isInteractionEnabled) return { kind: "none" };
      if (isClickableSetupHex) return { kind: "setup-hex", hexId: hex.id };
      if (isSelectableFighter && occupant !== null) {
        return isSelectedHex
          ? { kind: "deselect-fighter" }
          : { kind: "select-fighter", fighterId: occupant.id };
      }
      if (isPendingChargeHex) return { kind: "cancel-charge" };
      if (isClickableAttackTarget && occupant !== null) {
        return { kind: "attack-target", fighterId: occupant.id };
      }
      if (isClickableTargetFirstChargeTarget && occupant !== null) {
        return { kind: "start-charge-against-target", fighterId: occupant.id };
      }
      if (isClickableChargeTarget && occupant !== null) {
        return { kind: "complete-charge-against-target", fighterId: occupant.id };
      }
      if (isClickableMoveDestination) {
        return { kind: "move-to-hex", hexId: hex.id };
      }
      return { kind: "none" };
    })();

    // The hex for charge-target hover tracking — if the occupant is a
    // valid charge target, renderers report it as the "charge hover" id.
    const chargeTargetFighterId: FighterId | null =
      pendingChargeHexId === null &&
      occupant !== null &&
      isChargeTarget &&
      occupant.ownerPlayerId !== activePlayerId
        ? occupant.id
        : null;

    const title = buildHexTitle(game, hex, fighterState, featureTokenState);

    return {
      id: hex.id,
      left,
      top,
      title,
      visual,
      occupant,
      featureToken,
      actionBadge,
      armedPathStep,
      clickIntent,
      keyboardClickIntent: clickIntent,
      chargeTargetFighterId,
      isPowerResponseFighter,
      isDelveReadyFeature,
      isPendingDelveFeature,
      attackPreview: shouldShowAttackPreview
        ? {
            visible: visibleAttackPreviewLabels,
            remaining: remainingAttackPreviewCount,
            fullLabels: attackPreviewLabels,
          }
        : null,
      chargePreview: shouldShowChargePreview
        ? {
            visible: visibleChargePreviewLabels,
            remaining: remainingChargePreviewCount,
            fullLabels: chargePreviewLabels,
          }
        : null,
      isSelectableFighter,
    };
  });

  // --- Quick actions ---
  // Quick actions disappear entirely when interaction is locked (AI
  // turn) so the user can't click "Pass Power" or similar on the
  // opponent's behalf.
  // Guard is now in the context menu, not here.
  const quickActions: BoardSceneQuickAction[] = [];
  const activeCombat = getActiveCombatState(game);
  if (isInteractionEnabled) {
    if (isActionStep && actionLens.focusAction !== null) {
      quickActions.push({
        key: "focus",
        armed: pendingFocus,
        label: pendingFocus ? "Confirm Focus" : "Focus",
      });
    }
    if (isPowerStep && actionLens.delveAction !== null && selectedFeatureToken !== null) {
      const armed = pendingDelveFeatureTokenId === selectedFeatureToken.id;
      quickActions.push({
        key: "delve",
        armed,
        label: armed ? "Confirm" : "Delve",
        featureTokenBadge: getFeatureTokenBadge(selectedFeatureToken),
        featureTokenId: selectedFeatureToken.id,
      });
    }
    if (activeCombat !== null) {
      const phaseLabels: Record<string, string> = {
        "attack-rolled": "Roll Save Dice",
        "save-rolled": "Determine Outcome",
        "resolved": "Apply Damage",
      };
      quickActions.push({
        key: "confirm-combat",
        armed: false,
        label: phaseLabels[activeCombat.phase] ?? "Continue",
      });
    }
    if (isActionStep && activeCombat === null) {
      quickActions.push({
        key: "end-action-step",
        armed: false,
        label: "End Action Step",
      });
    }
    if (isPowerStep && actionLens.passAction !== null) {
      quickActions.push({
        key: "pass-power",
        armed: pendingPassPower,
        label: pendingPassPower ? "Confirm Pass Power" : "Pass Power",
      });
    }
  }

  // --- Context menu ---
  // Shown when a fighter is selected but no action mode is active yet.
  const guardArmed =
    pendingGuardFighterId !== null &&
    pendingGuardFighterId === selectedFighterId;
  const contextMenu: FighterContextMenuModel = (() => {
    if (
      !isInteractionEnabled ||
      selectedFighterId === null ||
      !isActionStep ||
      activeActionMode !== null
    ) {
      // When an action mode IS set, hide the context menu — the user
      // has already picked their action and is interacting with hexes.
      // Exception: guard mode keeps the menu visible for confirm/cancel.
      if (activeActionMode === "guard") {
        const selectedHex = hexes.find((h) => h.visual.isSelectedHex);
        return {
          visible: true,
          left: (selectedHex?.left ?? 0) + hexPixelWidth + 8,
          top: selectedHex?.top ?? 0,
          fighterName: selectedFighterName ?? "",
          actions: [],
          guardArmed,
        };
      }
      return {
        visible: false,
        left: 0,
        top: 0,
        fighterName: "",
        actions: [],
        guardArmed: false,
      };
    }

    const selectedHex = hexes.find((h) => h.visual.isSelectedHex);
    if (selectedHex === undefined) {
      return {
        visible: false,
        left: 0,
        top: 0,
        fighterName: "",
        actions: [],
        guardArmed: false,
      };
    }

    const actions: FighterContextMenuAction[] = [];
    if (actionLens.moveCount > 0) {
      actions.push({ mode: "move", label: "Move", count: actionLens.moveCount });
    }
    if (actionLens.chargeCount > 0) {
      actions.push({ mode: "charge", label: "Charge", count: actionLens.chargeCount });
    }
    if (actionLens.attackCount > 0) {
      actions.push({ mode: "attack", label: "Attack", count: actionLens.attackCount });
    }
    if (actionLens.guardAvailable) {
      actions.push({ mode: "guard", label: "Guard", count: 0 });
    }

    return {
      visible: true,
      left: selectedHex.left + hexPixelWidth + 8,
      top: selectedHex.top,
      fighterName: selectedFighterName ?? "",
      actions,
      guardArmed: false,
    };
  })();

  return {
    viewport,
    hexes,
    selectedFighterName,
    ...computeBackgroundImage(params.boardTheme ?? null, positionedHexes),
    territoryIndicator: params.territoryIndicator ?? "none",
    territoryLabels: (() => {
      const territories = game.board.territories;
      const p1 = territories.find((t) => t.ownerPlayerId === LOCAL_PLAYER_ID);
      const p2 = territories.find((t) => t.ownerPlayerId !== null && t.ownerPlayerId !== LOCAL_PLAYER_ID);
      if (p1 === undefined || p2 === undefined) return null;
      return { playerOne: p1.name, playerTwo: p2.name };
    })(),
    statusBadge: boardTurnHeader,
    lastResolvedAction,
    resultFlash,
    quickActions,
    powerOverlay,
    showWarscrollOverlay:
      isPowerStep && powerOverlay.warscrollAbilities.length > 0,
    pendingPowerOptionKey,
    armedPathTone: armedPath?.tone ?? null,
    contextMenu,
    pendingCombatRolls: activeCombat !== null ? {
      attackRoll: [...activeCombat.attackRoll],
      saveRoll: [...activeCombat.saveRoll],
    } : null,
  };
}

// ---------------------------------------------------------------------------
// Background image alignment. Computes the exact CSS to overlay a board
// image so its hexes align with the grid hexes. The theme provides the
// image's natural dimensions and the padding from image edges to the hex
// grid edges (in image pixels). This function derives scale + offset from
// the grid's own hex bounds.
// ---------------------------------------------------------------------------

function computeBackgroundImage(
  theme: BoardTheme | null,
  positionedHexes: readonly PositionedHex[],
): Pick<BoardSceneModel, "backgroundImage" | "backgroundImageStyle"> {
  if (theme === null || positionedHexes.length === 0) {
    return { backgroundImage: null, backgroundImageStyle: null };
  }

  // Grid hex bounding box (in grid pixels).
  const gridLeft = Math.min(...positionedHexes.map((h) => h.left));
  const gridTop = Math.min(...positionedHexes.map((h) => h.top));
  const gridRight = Math.max(...positionedHexes.map((h) => h.left + hexPixelWidth));
  const gridBottom = Math.max(...positionedHexes.map((h) => h.top + hexPixelHeight));
  const gridContentW = gridRight - gridLeft;
  const gridContentH = gridBottom - gridTop;

  // Image hex content area (in image pixels).
  const pad = theme.imagePadding;
  const imgContentW = theme.imageWidth - pad.left - pad.right;
  const imgContentH = theme.imageHeight - pad.top - pad.bottom;

  // Scale so image hex area matches grid hex area. Average both axes
  // to handle tiny aspect-ratio differences from measurement imprecision.
  const scale = (gridContentW / imgContentW + gridContentH / imgContentH) / 2;

  const renderedW = theme.imageWidth * scale;
  const renderedH = theme.imageHeight * scale;
  const left = gridLeft - pad.left * scale;
  const top = gridTop - pad.top * scale;

  return {
    backgroundImage: theme.backgroundImage,
    backgroundImageStyle: {
      left: `${left.toFixed(1)}px`,
      top: `${top.toFixed(1)}px`,
      width: `${renderedW.toFixed(1)}px`,
      height: `${renderedH.toFixed(1)}px`,
    },
  };
}

// ---------------------------------------------------------------------------
// Action badge (tone + label) — moved here from BoardMap.tsx so the DOM
// renderer doesn't own the logic; any renderer can consume it.
// ---------------------------------------------------------------------------

type HexActionBadgeInputs = {
  isAttackTarget: boolean;
  isChargeDestination: boolean;
  isPendingDelveHex: boolean;
  isPendingGuardHex: boolean;
  isPendingAttackTarget: boolean;
  isPendingChargeHex: boolean;
  pendingChargeBadgeLabel: string | null;
  pendingAttackBadgeLabel: string | null;
  isPendingChargeTarget: boolean;
  isChargeTarget: boolean;
  isPendingMoveHex: boolean;
  isMoveDestination: boolean;
  isRecentCombatTarget: boolean;
};

function buildHexActionBadge(state: HexActionBadgeInputs): HexActionBadgeModel | null {
  if (state.isPendingAttackTarget) {
    return {
      tone: "confirm",
      label: state.pendingAttackBadgeLabel ?? "confirm",
      detailed: state.pendingAttackBadgeLabel !== null,
    };
  }
  if (state.isPendingDelveHex) {
    return { tone: "confirm", label: "confirm", detailed: false };
  }
  if (state.isPendingGuardHex) {
    return { tone: "confirm", label: "confirm", detailed: false };
  }
  if (state.isPendingChargeTarget) {
    return {
      tone: "confirm",
      label: state.pendingChargeBadgeLabel ?? "confirm",
      detailed: state.pendingChargeBadgeLabel !== null,
    };
  }
  if (state.isChargeTarget) {
    return { tone: "target", label: "target", detailed: false };
  }
  if (state.isPendingChargeHex) {
    return { tone: "armed", label: "armed", detailed: false };
  }
  if (state.isPendingMoveHex) {
    return { tone: "confirm", label: "confirm", detailed: false };
  }
  if (state.isChargeDestination) {
    return { tone: "charge", label: "charge", detailed: false };
  }
  if (state.isAttackTarget) {
    return { tone: "attack", label: "attack", detailed: false };
  }
  if (state.isRecentCombatTarget) {
    return { tone: "last", label: "last", detailed: false };
  }
  if (state.isMoveDestination) {
    return { tone: "move", label: "move", detailed: false };
  }
  return null;
}
