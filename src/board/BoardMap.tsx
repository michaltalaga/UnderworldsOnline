import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  HexKind,
  TurnStep,
  type FeatureTokenState,
  type FighterId,
  type FighterState,
  type Game,
  type HexCell,
  type HexId,
} from "../domain";
import { LOCAL_PLAYER_ID } from "../localPlayer";
import {
  boardPadding,
  hexHeight,
  hexWidth,
  type PositionedHex,
} from "./projectBoard";
import {
  buildHexTitle,
  getFeatureTokenBadge,
  getFighterMapLabel,
  getFighterName,
  getFighterStatusTags,
  getPlayerToneClass,
} from "./battlefieldFormatters";
import { getChargeDestinationHexIdsForTarget, getChargeTargetHexIdsForHex } from "./fighterActionLens";
import type {
  ArmedPathModel,
  BattlefieldResultFlash,
  BoardTurnHeaderModel,
  FighterActionLens,
  PowerOverlayModel,
  PowerOverlayOption,
  ProfilePreviewModel,
} from "./battlefieldModels";

// ---------------------------------------------------------------------------
// BoardMap
// The hex grid component that owns all in-board UI: status header, last-
// action banner, quick-action bar, warscroll overlay, and the hex tiles
// themselves. All game logic arrives pre-digested via `actionLens`, the view
// models in `./battlefieldOverlays`, and the formatters in
// `./battlefieldFormatters` — this component does no domain work itself.
//
// Card interactions (mulligan, focus discards, ploy/upgrade plays) live in
// `PlayerHandDock`; this component does not render card UI.
// ---------------------------------------------------------------------------

export type BoardMapProps = {
  activePlayerId: FighterState["ownerPlayerId"] | null;
  actionLens: FighterActionLens;
  game: Game;
  pendingMoveHexId: HexId | null;
  pendingDelveFeatureTokenId: FeatureTokenState["id"] | null;
  pendingFocus: boolean;
  pendingGuardFighterId: FighterId | null;
  pendingPassPower: boolean;
  pendingPowerOptionKey: string | null;
  pendingChargeHexId: HexId | null;
  pendingChargeTargetId: FighterId | null;
  pendingAttackTargetId: FighterId | null;
  pendingChargeBadgeLabel: string | null;
  pendingAttackBadgeLabel: string | null;
  powerOverlay: PowerOverlayModel;
  boardTurnHeader: BoardTurnHeaderModel;
  recentCombatTargetId: FighterId | null;
  attackPreviewByTarget: ProfilePreviewModel;
  chargePreviewByTarget: ProfilePreviewModel;
  armedPath: ArmedPathModel | null;
  lastResolvedAction: BattlefieldResultFlash | null;
  resultFlash: BattlefieldResultFlash | null;
  selectedFeatureToken: FeatureTokenState | null;
  onApplyPowerAction: (option: PowerOverlayOption) => void;
  onDelveSelectedFighter: () => void;
  onFocusHand: () => void;
  onGuardSelectedFighter: () => void;
  onPassTurn: () => void;
  onAttackTarget: (targetId: FighterId) => void;
  onCancelPendingCharge: () => void;
  onCompleteChargeAgainstTarget: (targetId: FighterId) => void;
  onMoveToHex: (hexId: HexId) => void;
  onStartChargeAgainstTarget: (targetId: FighterId) => void;
  onStartChargeToHex: (hexId: HexId) => void;
  onSelectFighter: (fighterId: FighterId | null) => void;
  positionedHexes: PositionedHex[];
  selectedFighterId: FighterId | null;
  // Setup-mode overlay: when provided, these hexes are highlighted as
  // legal placement/deployment targets and clicking one calls
  // `onSetupHexClick` instead of any combat handler. This lets the same
  // map render during setup phases without teaching it about specific
  // setup actions.
  setupLegalHexIds?: ReadonlySet<HexId>;
  onSetupHexClick?: (hexId: HexId) => void;
};

export default function BoardMap({
  activePlayerId,
  actionLens,
  game,
  pendingMoveHexId,
  pendingDelveFeatureTokenId,
  pendingFocus,
  pendingGuardFighterId,
  pendingPassPower,
  pendingPowerOptionKey,
  pendingChargeHexId,
  pendingChargeTargetId,
  pendingAttackTargetId,
  pendingChargeBadgeLabel,
  pendingAttackBadgeLabel,
  powerOverlay,
  boardTurnHeader,
  recentCombatTargetId,
  attackPreviewByTarget,
  chargePreviewByTarget,
  armedPath,
  lastResolvedAction,
  resultFlash,
  selectedFeatureToken,
  onApplyPowerAction,
  onDelveSelectedFighter,
  onFocusHand,
  onGuardSelectedFighter,
  onPassTurn,
  onAttackTarget,
  onCancelPendingCharge,
  onCompleteChargeAgainstTarget,
  onMoveToHex,
  onStartChargeAgainstTarget,
  onStartChargeToHex,
  onSelectFighter,
  positionedHexes,
  selectedFighterId,
  setupLegalHexIds,
  onSetupHexClick,
}: BoardMapProps) {
  const width = Math.max(...positionedHexes.map((hex) => hex.left + hexWidth)) + boardPadding;
  const height = Math.max(...positionedHexes.map((hex) => hex.top + hexHeight)) + boardPadding;

  // The map has a fixed intrinsic pixel size driven by the hex grid
  // (width × height above). We scale it to fit the surrounding frame
  // so the whole battlefield is always visible without scroll bars.
  const frameRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const [mapScale, setMapScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    const mapWrapper = mapWrapperRef.current;
    if (frame === null || mapWrapper === null) {
      return;
    }
    const update = () => {
      const frameRect = frame.getBoundingClientRect();
      // Space above the map inside the frame (status/action buttons).
      const wrapperOffsetTop = mapWrapper.offsetTop;
      const available = {
        w: Math.max(0, frameRect.width),
        h: Math.max(0, frameRect.height - wrapperOffsetTop),
      };
      if (available.w === 0 || available.h === 0) {
        return;
      }
      const nextScale = Math.min(1, available.w / width, available.h / height);
      if (Math.abs(nextScale - mapScale) > 0.005) {
        setMapScale(nextScale);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [width, height, mapScale]);
  const visibleChargeTargetHexIds = getChargeTargetHexIdsForHex(game, actionLens, pendingChargeHexId);
  const selectedFighterName =
    selectedFighterId === null ? null : getFighterName(game, selectedFighterId);
  const [actionTooltip, setActionTooltip] = useState<{ label: string; left: number; top: number } | null>(null);
  const [hoveredChargeTargetId, setHoveredChargeTargetId] = useState<FighterId | null>(null);
  const hoveredChargeDestinationHexIds =
    pendingChargeHexId === null
      ? getChargeDestinationHexIdsForTarget(actionLens, hoveredChargeTargetId)
      : new Set<HexId>();

  useEffect(() => {
    if (actionTooltip === null) {
      return;
    }

    const nextLabel = pendingChargeBadgeLabel ?? pendingAttackBadgeLabel;

    if (nextLabel === null) {
      setActionTooltip(null);
      return;
    }

    if (actionTooltip.label !== nextLabel) {
      setActionTooltip({
        ...actionTooltip,
        label: nextLabel,
      });
    }
  }, [actionTooltip, pendingAttackBadgeLabel, pendingChargeBadgeLabel]);

  useEffect(() => {
    if (pendingChargeHexId !== null) {
      setHoveredChargeTargetId(null);
      return;
    }

    if (hoveredChargeTargetId !== null && !actionLens.chargeTargetIds.has(hoveredChargeTargetId)) {
      setHoveredChargeTargetId(null);
    }
  }, [actionLens.chargeTargetIds, hoveredChargeTargetId, pendingChargeHexId]);

  return (
    <div ref={frameRef} className="battlefield-board-frame">
      <section className={`battlefield-board-status battlefield-board-status-${boardTurnHeader.tone}`}>
        <div className="battlefield-board-status-header">
          <span className={`battlefield-board-status-step battlefield-board-status-step-${boardTurnHeader.tone}`}>
            {boardTurnHeader.stepLabel}
          </span>
          <span className="battlefield-board-status-mode">
            {boardTurnHeader.isArmed ? "armed" : "ready"}
          </span>
        </div>
        <strong className="battlefield-board-status-player">{boardTurnHeader.activePlayerName}</strong>
        <p className="battlefield-board-status-copy">{boardTurnHeader.interactionLabel}</p>
      </section>
      {lastResolvedAction === null ? null : (
        <section
          className={`battlefield-board-last-action battlefield-board-last-action-${lastResolvedAction.tone}`}
          aria-live="polite"
        >
          <p className="battlefield-board-last-action-eyebrow">Last Resolved</p>
          <strong className="battlefield-board-last-action-title">{lastResolvedAction.title}</strong>
          <p className="battlefield-board-last-action-detail">{lastResolvedAction.detail}</p>
        </section>
      )}
      {(game.turnStep === TurnStep.Action && actionLens.focusAction !== null) ||
      (game.turnStep === TurnStep.Power && actionLens.passAction !== null) ||
      (game.turnStep === TurnStep.Power && actionLens.delveAction !== null && selectedFeatureToken !== null) ||
      (game.turnStep === TurnStep.Action && actionLens.guardAction !== null && selectedFighterName !== null) ? (
        <div className="battlefield-board-quick-actions">
          {game.turnStep === TurnStep.Action && actionLens.focusAction !== null ? (
            <button
              type="button"
              className={[
                "battlefield-board-action",
                "battlefield-board-action-focus",
                pendingFocus ? "battlefield-board-action-focus-armed" : "",
              ].filter(Boolean).join(" ")}
              onClick={onFocusHand}
            >
              {pendingFocus ? "Confirm Focus" : "Focus"}
            </button>
          ) : null}
          {game.turnStep === TurnStep.Power && actionLens.delveAction !== null && selectedFeatureToken !== null ? (
            <button
              type="button"
              className={[
                "battlefield-board-action",
                "battlefield-board-action-delve",
                pendingDelveFeatureTokenId === selectedFeatureToken.id ? "battlefield-board-action-delve-armed" : "",
              ].filter(Boolean).join(" ")}
              onClick={onDelveSelectedFighter}
            >
              {pendingDelveFeatureTokenId === selectedFeatureToken.id ? "Confirm" : "Delve"} {getFeatureTokenBadge(selectedFeatureToken)}
            </button>
          ) : null}
          {game.turnStep === TurnStep.Action && actionLens.guardAction !== null && selectedFighterName !== null ? (
            <button
              type="button"
              className={[
                "battlefield-board-action",
                "battlefield-board-action-guard",
                pendingGuardFighterId === selectedFighterId && selectedFighterId !== null
                  ? "battlefield-board-action-guard-armed"
                  : "",
              ].filter(Boolean).join(" ")}
              onClick={onGuardSelectedFighter}
            >
              {pendingGuardFighterId === selectedFighterId && selectedFighterId !== null ? "Confirm Guard" : "Guard"} {selectedFighterName}
            </button>
          ) : null}
          {game.turnStep === TurnStep.Power && actionLens.passAction !== null ? (
            <button
              type="button"
              className={[
                "battlefield-board-action",
                "battlefield-board-action-pass",
                pendingPassPower ? "battlefield-board-action-pass-armed" : "",
              ].filter(Boolean).join(" ")}
              onClick={onPassTurn}
            >
              {pendingPassPower ? "Confirm Pass Power" : "Pass Power"}
            </button>
          ) : null}
        </div>
      ) : null}
      {game.turnStep === TurnStep.Power && powerOverlay.warscrollAbilities.length > 0 ? (
        <section className="battlefield-power-overlay">
          <div className="battlefield-power-overlay-header">
            <p className="battlefield-power-overlay-eyebrow">Warscroll</p>
            <strong>Warscroll abilities</strong>
          </div>
          <div className="battlefield-power-overlay-section">
            <div className="battlefield-power-option-list">
              {powerOverlay.warscrollAbilities.map((option) => (
                <PowerOverlayOptionButton
                  key={option.key}
                  option={option}
                  isPending={pendingPowerOptionKey === option.key}
                  onSelect={onApplyPowerAction}
                  toneClassName="battlefield-power-option-warscroll"
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {resultFlash === null ? null : (
        <div
          key={resultFlash.id}
          className={`battlefield-board-flash battlefield-board-flash-${resultFlash.tone}`}
          aria-live="polite"
        >
          <p className="battlefield-board-flash-title">{resultFlash.title}</p>
          <p className="battlefield-board-flash-detail">{resultFlash.detail}</p>
        </div>
      )}
      <div
        ref={mapWrapperRef}
        className="battlefield-board-map-scaler"
        style={{
          width: `${width * mapScale}px`,
          height: `${height * mapScale}px`,
        }}
      >
      <div
        className="battlefield-board-map"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${mapScale})`,
          transformOrigin: "top left",
        }}
      >
        {positionedHexes.map(({ hex, left, top }) => {
          const featureToken = hex.featureTokenId === null ? null : game.board.getFeatureToken(hex.featureTokenId) ?? null;
          const fighter = hex.occupantFighterId === null ? null : game.getFighter(hex.occupantFighterId) ?? null;
          const isSelectableFighter = fighter !== null && fighter.ownerPlayerId === activePlayerId;
          const isSelectedHex = fighter?.id === selectedFighterId;
          const isMoveDestination = actionLens.moveHexIds.has(hex.id);
          const isPendingMoveHex = pendingMoveHexId === hex.id;
          const isChargeDestination = actionLens.chargeHexIds.has(hex.id);
          const isHoveredChargeDestination = hoveredChargeDestinationHexIds.has(hex.id);
          const isPendingChargeHex = pendingChargeHexId === hex.id;
          const isChargeTarget = visibleChargeTargetHexIds.has(hex.id);
          const isHoveredChargeTarget =
            pendingChargeHexId === null &&
            fighter?.id !== undefined &&
            fighter.id === hoveredChargeTargetId &&
            isChargeTarget;
          const isPendingChargeTarget = fighter?.id === pendingChargeTargetId;
          const isAttackTarget =
            pendingChargeHexId === null &&
            game.turnStep === TurnStep.Action &&
            actionLens.attackTargetHexIds.has(hex.id);
          const isPendingAttackTarget = fighter?.id === pendingAttackTargetId;
          const attackPreviewLabels = fighter === null ? [] : attackPreviewByTarget.get(fighter.id) ?? [];
          const visibleAttackPreviewLabels = attackPreviewLabels.slice(0, 2);
          const remainingAttackPreviewCount = Math.max(0, attackPreviewLabels.length - visibleAttackPreviewLabels.length);
          const shouldShowAttackPreview =
            isAttackTarget &&
            pendingAttackTargetId === null &&
            pendingChargeHexId === null &&
            attackPreviewLabels.length > 0;
          const chargePreviewLabels = fighter === null ? [] : chargePreviewByTarget.get(fighter.id) ?? [];
          const visibleChargePreviewLabels = chargePreviewLabels.slice(0, 2);
          const remainingChargePreviewCount = Math.max(0, chargePreviewLabels.length - visibleChargePreviewLabels.length);
          const shouldShowChargePreview =
            isChargeTarget &&
            !isAttackTarget &&
            pendingChargeHexId === null &&
            chargePreviewLabels.length > 0;
          const armedPathStep = armedPath?.stepByHexId.get(hex.id) ?? null;
          const isArmedPathHex = armedPathStep !== null;
          const isRecentCombatTarget =
            pendingChargeHexId === null &&
            game.turnStep === TurnStep.Power &&
            fighter?.id === recentCombatTargetId;
          const isPowerResponseFighter =
            game.turnStep === TurnStep.Power &&
            fighter !== null &&
            fighter.ownerPlayerId === activePlayerId;
          const isDelveReadyFeature =
            game.turnStep === TurnStep.Power &&
            featureToken !== null &&
            actionLens.delveAction?.featureTokenId === featureToken.id &&
            fighter?.id === selectedFighterId;
          const isPendingGuardHex =
            game.turnStep === TurnStep.Action &&
            fighter?.id !== undefined &&
            fighter.id === pendingGuardFighterId &&
            fighter.id === selectedFighterId;
          const isPendingDelveFeature =
            isDelveReadyFeature &&
            featureToken !== null &&
            featureToken.id === pendingDelveFeatureTokenId;
          const isClickableMoveDestination = isMoveDestination && game.turnStep === TurnStep.Action;
          const isClickableChargeDestination = isChargeDestination && game.turnStep === TurnStep.Action;
          const isClickableChargeTarget =
            pendingChargeHexId !== null &&
            isChargeTarget &&
            fighter !== null &&
            fighter.ownerPlayerId !== activePlayerId;
          const isClickableTargetFirstChargeTarget =
            pendingChargeHexId === null &&
            isChargeTarget &&
            !isAttackTarget &&
            fighter !== null &&
            fighter.ownerPlayerId !== activePlayerId;
          const isClickableAttackTarget =
            pendingChargeHexId === null &&
            isAttackTarget &&
            fighter !== null &&
            fighter.ownerPlayerId !== activePlayerId;
          const isSetupLegalHex = setupLegalHexIds?.has(hex.id) ?? false;
          const isClickableSetupHex = isSetupLegalHex && onSetupHexClick !== undefined;
          const isInteractiveHex =
            isSelectableFighter ||
            isClickableAttackTarget ||
            isClickableChargeTarget ||
            isClickableTargetFirstChargeTarget ||
            isClickableChargeDestination ||
            isClickableMoveDestination ||
            isClickableSetupHex;
          const actionBadge = getHexActionBadge({
            isAttackTarget,
            isChargeDestination,
            isPendingDelveHex: isPendingDelveFeature,
            isPendingGuardHex,
            isPendingAttackTarget,
            isPendingChargeHex,
            pendingChargeBadgeLabel,
            pendingAttackBadgeLabel,
            isPendingChargeTarget,
            isChargeTarget,
            isPendingMoveHex,
            isMoveDestination,
            isRecentCombatTarget,
          });
          const style: CSSProperties = {
            left: `${left}px`,
            top: `${top}px`,
          };
          const showActionTooltip = () => {
            if (!actionBadge?.detailed) {
              return;
            }

            setActionTooltip({
              label: actionBadge.label,
              left: left + hexWidth / 2,
              top: top + 10,
            });
          };
          const hideActionTooltip = () => {
            setActionTooltip((current) => (current?.label === actionBadge?.label ? null : current));
          };
          const showHoveredChargeTarget = () => {
            if (pendingChargeHexId !== null || fighter === null || !isChargeTarget || fighter.ownerPlayerId === activePlayerId) {
              return;
            }

            setHoveredChargeTargetId(fighter.id);
          };
          const clearHoveredChargeTarget = () => {
            if (fighter === null) {
              return;
            }

            setHoveredChargeTargetId((current) => (current === fighter.id ? null : current));
          };

          return (
            <article
              key={hex.id}
              className={[
                getHexClassName(game, hex, {
                  isAttackTarget,
                  isChargeDestination,
                  isHoveredChargeDestination,
                  isPendingDelveHex: isPendingDelveFeature,
                  isPendingGuardHex,
                  isPendingAttackTarget,
                  isPendingChargeHex,
                  isPendingChargeTarget,
                  isChargeTarget,
                  isHoveredChargeTarget,
                  isSetupLegalHex,
                  isClickableHex: isInteractiveHex,
                  isPendingMoveHex,
                  isMoveDestination,
                  isDelveReadyHex: isDelveReadyFeature,
                  isPowerResponseHex: isPowerResponseFighter,
                  isRecentCombatTarget,
                  isSelectedHex,
                  isSelectableHex: isSelectableFighter,
                  isGuardReadyHex: isSelectedHex && actionLens.guardAvailable,
                }),
                isArmedPathHex ? "battlefield-map-hex-path" : "",
                isArmedPathHex && armedPath !== null ? `battlefield-map-hex-path-${armedPath.tone}` : "",
              ].filter(Boolean).join(" ")}
              onClick={() => {
                if (isClickableSetupHex && onSetupHexClick !== undefined) {
                  onSetupHexClick(hex.id);
                  return;
                }

                if (isSelectableFighter) {
                  onSelectFighter(fighter.id);
                  return;
                }

                if (isPendingChargeHex) {
                  onCancelPendingCharge();
                  return;
                }

                if (isClickableAttackTarget && fighter !== null) {
                  onAttackTarget(fighter.id);
                  return;
                }

                if (isClickableTargetFirstChargeTarget && fighter !== null) {
                  onStartChargeAgainstTarget(fighter.id);
                  return;
                }

                if (isClickableChargeTarget && fighter !== null) {
                  onCompleteChargeAgainstTarget(fighter.id);
                  return;
                }

                if (isClickableChargeDestination) {
                  onStartChargeToHex(hex.id);
                  return;
                }

                if (isClickableMoveDestination) {
                  onMoveToHex(hex.id);
                }
              }}
              onBlur={() => {
                hideActionTooltip();
                clearHoveredChargeTarget();
              }}
              onFocus={() => {
                showActionTooltip();
                showHoveredChargeTarget();
              }}
              onKeyDown={(event) => {
                if (!isInteractiveHex || (event.key !== "Enter" && event.key !== " ")) {
                  return;
                }

                event.preventDefault();

                if (isClickableSetupHex && onSetupHexClick !== undefined) {
                  onSetupHexClick(hex.id);
                  return;
                }

                if (isSelectableFighter) {
                  onSelectFighter(fighter.id);
                  return;
                }

                if (isPendingChargeHex) {
                  onCancelPendingCharge();
                  return;
                }

                if (isClickableAttackTarget && fighter !== null) {
                  onAttackTarget(fighter.id);
                  return;
                }

                if (isClickableTargetFirstChargeTarget && fighter !== null) {
                  onStartChargeAgainstTarget(fighter.id);
                  return;
                }

                if (isClickableChargeTarget && fighter !== null) {
                  onCompleteChargeAgainstTarget(fighter.id);
                  return;
                }

                if (isClickableChargeDestination) {
                  onStartChargeToHex(hex.id);
                  return;
                }

                if (isClickableMoveDestination) {
                  onMoveToHex(hex.id);
                }
              }}
              onMouseEnter={() => {
                showActionTooltip();
                showHoveredChargeTarget();
              }}
              onMouseLeave={() => {
                hideActionTooltip();
                clearHoveredChargeTarget();
              }}
              role={isInteractiveHex ? "button" : undefined}
              style={style}
              tabIndex={isInteractiveHex ? 0 : undefined}
              title={buildHexTitle(game, hex, fighter, featureToken)}
            >
              {armedPathStep === null || armedPath === null ? null : (
                <div className="battlefield-hex-meta-row">
                  <div className="battlefield-hex-meta-tags">
                    <span className={`battlefield-hex-path-step battlefield-hex-path-step-${armedPath.tone}`}>
                      {armedPathStep}
                    </span>
                  </div>
                </div>
              )}

              <div className="battlefield-hex-center">
                {featureToken === null ? null : (
                  isDelveReadyFeature ? (
                    <button
                      type="button"
                      className={[
                        "battlefield-feature-chip",
                        `battlefield-feature-${featureToken.side}`,
                        "battlefield-feature-chip-button",
                        "battlefield-feature-chip-delve",
                        isPendingDelveFeature ? "battlefield-feature-chip-delve-armed" : "",
                      ].join(" ")}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelveSelectedFighter();
                      }}
                    >
                      {isPendingDelveFeature ? "Confirm" : "Delve"} {getFeatureTokenBadge(featureToken)}
                    </button>
                  ) : (
                    <span className={`battlefield-feature-chip battlefield-feature-${featureToken.side}`}>
                      {getFeatureTokenBadge(featureToken)}
                    </span>
                  )
                )}
                {actionBadge === null ? null : (
                  <span
                    className={[
                      "battlefield-hex-action-badge",
                      `battlefield-hex-action-${actionBadge.tone}`,
                      actionBadge.detailed ? "battlefield-hex-action-badge-detailed" : "",
                    ].filter(Boolean).join(" ")}
                    title={actionBadge.detailed ? actionBadge.label : undefined}
                  >
                    {actionBadge.label}
                  </span>
                )}
                {shouldShowAttackPreview ? (
                  <div className="battlefield-hex-profile-preview-list">
                    {visibleAttackPreviewLabels.map((label) => (
                      <span
                        key={label}
                        className="battlefield-hex-profile-preview-chip"
                        title={label}
                      >
                        {label}
                      </span>
                    ))}
                    {remainingAttackPreviewCount === 0 ? null : (
                      <span
                        className="battlefield-hex-profile-preview-chip battlefield-hex-profile-preview-chip-more"
                        title={attackPreviewLabels.join(" | ")}
                      >
                        +{remainingAttackPreviewCount}
                      </span>
                    )}
                  </div>
                ) : null}
                {shouldShowChargePreview ? (
                  <div className="battlefield-hex-profile-preview-list battlefield-hex-profile-preview-list-charge">
                    {visibleChargePreviewLabels.map((label) => (
                      <span
                        key={label}
                        className="battlefield-hex-profile-preview-chip battlefield-hex-profile-preview-chip-charge"
                        title={label}
                      >
                        {label}
                      </span>
                    ))}
                    {remainingChargePreviewCount === 0 ? null : (
                      <span
                        className="battlefield-hex-profile-preview-chip battlefield-hex-profile-preview-chip-charge battlefield-hex-profile-preview-chip-more"
                        title={chargePreviewLabels.join(" | ")}
                      >
                        +{remainingChargePreviewCount}
                      </span>
                    )}
                  </div>
                ) : null}
                {fighter === null ? (
                  <span className="battlefield-empty-hex-dot" aria-hidden="true" />
                ) : (
                  <div
                    className={[
                      "battlefield-fighter-badge",
                      getPlayerToneClass(fighter.ownerPlayerId),
                      isPowerResponseFighter ? "battlefield-fighter-badge-power-response" : "",
                    ].filter(Boolean).join(" ")}
                  >
                    <span>{getFighterMapLabel(game, fighter)}</span>
                    <div className="battlefield-fighter-token-row">
                      {getFighterStatusTags(fighter).map((tag) => (
                        <span key={tag} className="battlefield-fighter-token">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </article>
          );
        })}
        {actionTooltip === null ? null : (
          <div
            className="battlefield-board-tooltip"
            style={{
              left: `${actionTooltip.left}px`,
              top: `${actionTooltip.top}px`,
            }}
          >
            {actionTooltip.label}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small child components + hex helpers. Kept in this module because nothing
// else on the board needs them and they're tiny.
// ---------------------------------------------------------------------------

export function LegendItem({
  swatchClassName,
  label,
}: {
  swatchClassName: string;
  label: string;
}) {
  return (
    <div className="battlefield-legend-item">
      <span className={swatchClassName} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

function PowerOverlayOptionButton({
  isPending,
  onSelect,
  option,
  toneClassName,
}: {
  isPending: boolean;
  onSelect: (option: PowerOverlayOption) => void;
  option: PowerOverlayOption;
  toneClassName: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={isPending}
      className={[
        "battlefield-power-option",
        toneClassName,
        isPending ? "battlefield-power-option-armed" : "",
      ].filter(Boolean).join(" ")}
      onClick={() => onSelect(option)}
    >
      <span className="battlefield-power-option-title-row">
        <strong>{option.title}</strong>
        {isPending ? <span className="battlefield-power-option-chip">confirm</span> : null}
      </span>
      <span>{option.detail}</span>
      {isPending ? (
        <span className="battlefield-power-option-confirm-copy">Click again to confirm.</span>
      ) : null}
    </button>
  );
}

type HexRenderState = {
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

function getHexClassName(game: Game, hex: HexCell, state: HexRenderState): string {
  const territoryOwnerId =
    hex.territoryId === null ? null : game.board.getTerritory(hex.territoryId)?.ownerPlayerId ?? null;

  const classes = ["battlefield-map-hex"];
  if (hex.territoryId === null) {
    classes.push("battlefield-map-hex-neutral");
  } else if (territoryOwnerId === LOCAL_PLAYER_ID) {
    classes.push("battlefield-map-hex-player-one");
  } else if (territoryOwnerId !== null) {
    classes.push("battlefield-map-hex-player-two");
  } else {
    classes.push("battlefield-map-hex-unclaimed");
  }

  if (hex.isStartingHex) {
    classes.push("battlefield-map-hex-start");
  }

  if (hex.isEdgeHex) {
    classes.push("battlefield-map-hex-edge");
  }

  if (hex.kind === HexKind.Blocked) {
    classes.push("battlefield-map-hex-blocked");
  }

  if (hex.kind === HexKind.Stagger) {
    classes.push("battlefield-map-hex-stagger");
  }

  if (state.isMoveDestination) {
    classes.push("battlefield-map-hex-move");
  }

  if (state.isPendingMoveHex) {
    classes.push("battlefield-map-hex-move-armed");
  }

  if (state.isPendingDelveHex) {
    classes.push("battlefield-map-hex-delve-armed");
  }

  if (state.isPendingGuardHex) {
    classes.push("battlefield-map-hex-guard-armed");
  }

  if (state.isChargeDestination) {
    classes.push("battlefield-map-hex-charge");
  }

  if (state.isHoveredChargeDestination) {
    classes.push("battlefield-map-hex-charge-planned");
  }

  if (state.isPendingChargeHex) {
    classes.push("battlefield-map-hex-charge-armed");
  }

  if (state.isChargeTarget) {
    classes.push("battlefield-map-hex-charge-target");
  }

  if (state.isHoveredChargeTarget) {
    classes.push("battlefield-map-hex-charge-target-hovered");
  }

  if (state.isPendingAttackTarget) {
    classes.push("battlefield-map-hex-attack-target-armed");
  }

  if (state.isPendingChargeTarget) {
    classes.push("battlefield-map-hex-charge-target-armed");
  }

  if (state.isAttackTarget) {
    classes.push("battlefield-map-hex-attack-target");
  }

  if (state.isRecentCombatTarget) {
    classes.push("battlefield-map-hex-combat-target");
  }

  if (state.isPowerResponseHex) {
    classes.push("battlefield-map-hex-power-response");
  }

  if (state.isDelveReadyHex) {
    classes.push("battlefield-map-hex-delve-ready");
  }

  if (state.isSelectedHex) {
    classes.push("battlefield-map-hex-selected");
  }

  if (state.isSelectableHex) {
    classes.push("battlefield-map-hex-selectable");
  }

  if (state.isClickableHex) {
    classes.push("battlefield-map-hex-clickable");
  }

  if (state.isGuardReadyHex) {
    classes.push("battlefield-map-hex-guard-ready");
  }

  if (state.isSetupLegalHex) {
    classes.push("battlefield-map-hex-setup-legal");
  }

  return classes.join(" ");
}

function getHexActionBadge(state: {
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
}): {
  tone: "move" | "charge" | "armed" | "target" | "confirm" | "attack" | "last";
  label: string;
  detailed: boolean;
} | null {
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
