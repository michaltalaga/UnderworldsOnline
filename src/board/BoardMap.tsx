import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FeatureTokenSide, HexKind } from "../domain";
import type { PowerOverlayOption } from "./battlefieldModels";
import type {
  BoardSceneHex,
  BoardSceneHexClickIntent,
  BoardSceneHexVisual,
  BoardSceneModel,
  BoardSceneQuickAction,
} from "./boardScene";

// -----------------------------------------------------------------------
// BoardMap (DOM renderer)
// -----------------------------------------------------------------------
// This component is now a pure renderer: it takes a `BoardSceneModel` and
// a set of intent callbacks and produces DOM. It knows nothing about
// `Game`, `GameEngine`, `TurnStep`, actions, or any other domain type.
//
// To add an alternate renderer (SVG, canvas), write a sibling component
// that accepts the same `BoardMapProps` shape and renders differently.
// Both renderers consume the identical scene produced by
// `projectBoardScene` in `boardScene.ts`.

export type BoardMapProps = {
  scene: BoardSceneModel;
  // Hover reporting — the scene includes hover-derived flags because the
  // parent owns the hover state and re-projects on each change.
  onHoverChargeTarget: (fighterId: string | null) => void;
  onHexClickIntent: (intent: BoardSceneHexClickIntent) => void;
  onQuickAction: (action: BoardSceneQuickAction) => void;
  onApplyPowerOption: (option: PowerOverlayOption) => void;
  onDelveInlineFeature: () => void;
};

export default function BoardMap({
  scene,
  onHoverChargeTarget,
  onHexClickIntent,
  onQuickAction,
  onApplyPowerOption,
  onDelveInlineFeature,
}: BoardMapProps) {
  const [actionTooltip, setActionTooltip] = useState<{
    label: string;
    left: number;
    top: number;
  } | null>(null);

  const frameRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const [mapScale, setMapScale] = useState(1);

  // Scale the map to fit the surrounding frame so the whole battlefield is
  // always visible without scroll bars. The map has a fixed intrinsic
  // pixel size (`scene.viewport`); the scaler wrapper takes the scaled
  // dimensions and the inner map applies `transform: scale`.
  useEffect(() => {
    const frame = frameRef.current;
    const mapWrapper = mapWrapperRef.current;
    if (frame === null || mapWrapper === null) {
      return;
    }
    const update = () => {
      const frameRect = frame.getBoundingClientRect();
      const wrapperOffsetTop = mapWrapper.offsetTop;
      const available = {
        w: Math.max(0, frameRect.width),
        h: Math.max(0, frameRect.height - wrapperOffsetTop),
      };
      if (available.w === 0 || available.h === 0) {
        return;
      }
      const nextScale = Math.min(
        1,
        available.w / scene.viewport.width,
        available.h / scene.viewport.height,
      );
      if (Math.abs(nextScale - mapScale) > 0.005) {
        setMapScale(nextScale);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [scene.viewport.width, scene.viewport.height, mapScale]);

  const {
    hexes,
    statusBadge,
    lastResolvedAction,
    resultFlash,
    quickActions,
    showWarscrollOverlay,
    powerOverlay,
    pendingPowerOptionKey,
    armedPathTone,
  } = scene;

  return (
    <div ref={frameRef} className="battlefield-board-frame">
      <section
        className={`battlefield-board-status battlefield-board-status-${statusBadge.tone}`}
      >
        <div className="battlefield-board-status-header">
          <span
            className={`battlefield-board-status-step battlefield-board-status-step-${statusBadge.tone}`}
          >
            {statusBadge.stepLabel}
          </span>
          {statusBadge.roundLabel === null ? null : (
            <span className="battlefield-board-status-round">
              {statusBadge.roundLabel}
            </span>
          )}
          <span className="battlefield-board-status-mode">
            {statusBadge.isArmed ? "armed" : "ready"}
          </span>
        </div>
        <strong className="battlefield-board-status-player">
          {statusBadge.activePlayerName}
        </strong>
        <p className="battlefield-board-status-copy">{statusBadge.interactionLabel}</p>
        {statusBadge.scores !== null && statusBadge.scores.length > 0 ? (
          <div className="battlefield-board-status-scores">
            {statusBadge.scores.map((s) => (
              <span key={s.name} className="battlefield-board-status-score">
                {s.name}: <strong>{s.glory}</strong>
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {lastResolvedAction === null ? null : (
        <section
          className={`battlefield-board-last-action battlefield-board-last-action-${lastResolvedAction.tone}`}
          aria-live="polite"
        >
          <p className="battlefield-board-last-action-eyebrow">Last Resolved</p>
          <strong className="battlefield-board-last-action-title">
            {lastResolvedAction.title}
          </strong>
          <p className="battlefield-board-last-action-detail">{lastResolvedAction.detail}</p>
        </section>
      )}

      {quickActions.length > 0 ? (
        <div className="battlefield-board-quick-actions">
          {quickActions.map((action) => (
            <QuickActionButton
              key={action.key}
              action={action}
              onClick={() => onQuickAction(action)}
            />
          ))}
        </div>
      ) : null}

      {showWarscrollOverlay ? (
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
                  onSelect={onApplyPowerOption}
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
          width: `${scene.viewport.width * mapScale}px`,
          height: `${scene.viewport.height * mapScale}px`,
        }}
      >
        <div
          className="battlefield-board-map"
          style={{
            width: `${scene.viewport.width}px`,
            height: `${scene.viewport.height}px`,
            transform: `scale(${mapScale})`,
            transformOrigin: "top left",
          }}
        >
          {hexes.map((hex) => (
            <HexCell
              key={hex.id}
              hex={hex}
              armedPathTone={armedPathTone}
              onClickIntent={onHexClickIntent}
              onHoverChargeTarget={onHoverChargeTarget}
              onDelveInlineFeature={onDelveInlineFeature}
              onShowTooltip={setActionTooltip}
              onHideTooltip={(label) =>
                setActionTooltip((current) =>
                  current?.label === label ? null : current,
                )
              }
            />
          ))}
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
// Shared legend-item component (exported for use in the map panel footer).
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

// ---------------------------------------------------------------------------
// Quick action button (focus / delve / guard / pass power)
// ---------------------------------------------------------------------------

function QuickActionButton({
  action,
  onClick,
}: {
  action: BoardSceneQuickAction;
  onClick: () => void;
}) {
  if (action.key === "focus") {
    return (
      <button
        type="button"
        className={[
          "battlefield-board-action",
          "battlefield-board-action-focus",
          action.armed ? "battlefield-board-action-focus-armed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onClick}
      >
        {action.label}
      </button>
    );
  }
  if (action.key === "delve") {
    return (
      <button
        type="button"
        className={[
          "battlefield-board-action",
          "battlefield-board-action-delve",
          action.armed ? "battlefield-board-action-delve-armed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onClick}
      >
        {action.label} {action.featureTokenBadge}
      </button>
    );
  }
  if (action.key === "guard") {
    return (
      <button
        type="button"
        className={[
          "battlefield-board-action",
          "battlefield-board-action-guard",
          action.armed ? "battlefield-board-action-guard-armed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onClick}
      >
        {action.label} {action.selectedFighterName}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={[
        "battlefield-board-action",
        "battlefield-board-action-pass",
        action.armed ? "battlefield-board-action-pass-armed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      {action.label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Power overlay option button
// ---------------------------------------------------------------------------

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
      ]
        .filter(Boolean)
        .join(" ")}
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

// ---------------------------------------------------------------------------
// Single hex cell — renders the scene-described hex with all its overlays.
// ---------------------------------------------------------------------------

type HexCellProps = {
  hex: BoardSceneHex;
  armedPathTone: "move" | "charge" | null;
  onClickIntent: (intent: BoardSceneHexClickIntent) => void;
  onHoverChargeTarget: (fighterId: string | null) => void;
  onDelveInlineFeature: () => void;
  onShowTooltip: (tooltip: { label: string; left: number; top: number }) => void;
  onHideTooltip: (label: string) => void;
};

function HexCell({
  hex,
  armedPathTone,
  onClickIntent,
  onHoverChargeTarget,
  onDelveInlineFeature,
  onShowTooltip,
  onHideTooltip,
}: HexCellProps) {
  const style: CSSProperties = { left: `${hex.left}px`, top: `${hex.top}px` };
  const isInteractive = hex.clickIntent.kind !== "none";
  const showTooltip = () => {
    if (hex.actionBadge === null || !hex.actionBadge.detailed) {
      return;
    }
    onShowTooltip({
      label: hex.actionBadge.label,
      // Approximate the center of the hex for tooltip placement.
      left: hex.left + 40,
      top: hex.top + 10,
    });
  };
  const hideTooltip = () => {
    if (hex.actionBadge !== null) {
      onHideTooltip(hex.actionBadge.label);
    }
  };
  const showChargeHover = () => {
    if (hex.chargeTargetFighterId !== null) {
      onHoverChargeTarget(hex.chargeTargetFighterId);
    }
  };
  const clearChargeHover = () => {
    if (hex.chargeTargetFighterId !== null) {
      onHoverChargeTarget(null);
    }
  };

  const className = [
    getHexClassName(hex),
    hex.armedPathStep !== null ? "battlefield-map-hex-path" : "",
    hex.armedPathStep !== null && armedPathTone !== null
      ? `battlefield-map-hex-path-${armedPathTone}`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={className}
      onClick={() => {
        if (hex.clickIntent.kind !== "none") {
          onClickIntent(hex.clickIntent);
        }
      }}
      onBlur={() => {
        hideTooltip();
        clearChargeHover();
      }}
      onFocus={() => {
        showTooltip();
        showChargeHover();
      }}
      onKeyDown={(event) => {
        if (!isInteractive || (event.key !== "Enter" && event.key !== " ")) {
          return;
        }
        event.preventDefault();
        onClickIntent(hex.clickIntent);
      }}
      onMouseEnter={() => {
        showTooltip();
        showChargeHover();
      }}
      onMouseLeave={() => {
        hideTooltip();
        clearChargeHover();
      }}
      role={isInteractive ? "button" : undefined}
      style={style}
      tabIndex={isInteractive ? 0 : undefined}
      title={hex.title}
    >
      {hex.armedPathStep === null ? null : (
        <div className="battlefield-hex-meta-row">
          <div className="battlefield-hex-meta-tags">
            <span
              className={`battlefield-hex-path-step battlefield-hex-path-step-${hex.armedPathStep.tone}`}
            >
              {hex.armedPathStep.step}
            </span>
          </div>
        </div>
      )}

      <div className="battlefield-hex-center">
        {hex.featureToken === null
          ? null
          : hex.isDelveReadyFeature
            ? (
              <button
                type="button"
                className={[
                  "battlefield-feature-chip",
                  `battlefield-feature-${hex.featureToken.side}`,
                  "battlefield-feature-chip-button",
                  "battlefield-feature-chip-delve",
                  hex.isPendingDelveFeature ? "battlefield-feature-chip-delve-armed" : "",
                ].join(" ")}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelveInlineFeature();
                }}
              >
                {hex.isPendingDelveFeature ? "Confirm" : "Delve"} {hex.featureToken.badge}
              </button>
            )
            : (
              <span
                className={`battlefield-feature-chip battlefield-feature-${hex.featureToken.side}`}
              >
                {hex.featureToken.badge}
              </span>
            )}

        {hex.actionBadge === null ? null : (
          <span
            className={[
              "battlefield-hex-action-badge",
              `battlefield-hex-action-${hex.actionBadge.tone}`,
              hex.actionBadge.detailed ? "battlefield-hex-action-badge-detailed" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            title={hex.actionBadge.detailed ? hex.actionBadge.label : undefined}
          >
            {hex.actionBadge.label}
          </span>
        )}

        {hex.attackPreview === null ? null : (
          <div className="battlefield-hex-profile-preview-list">
            {hex.attackPreview.visible.map((label) => (
              <span
                key={label}
                className="battlefield-hex-profile-preview-chip"
                title={label}
              >
                {label}
              </span>
            ))}
            {hex.attackPreview.remaining === 0 ? null : (
              <span
                className="battlefield-hex-profile-preview-chip battlefield-hex-profile-preview-chip-more"
                title={hex.attackPreview.fullLabels.join(" | ")}
              >
                +{hex.attackPreview.remaining}
              </span>
            )}
          </div>
        )}

        {hex.chargePreview === null ? null : (
          <div className="battlefield-hex-profile-preview-list battlefield-hex-profile-preview-list-charge">
            {hex.chargePreview.visible.map((label) => (
              <span
                key={label}
                className="battlefield-hex-profile-preview-chip battlefield-hex-profile-preview-chip-charge"
                title={label}
              >
                {label}
              </span>
            ))}
            {hex.chargePreview.remaining === 0 ? null : (
              <span
                className="battlefield-hex-profile-preview-chip battlefield-hex-profile-preview-chip-charge battlefield-hex-profile-preview-chip-more"
                title={hex.chargePreview.fullLabels.join(" | ")}
              >
                +{hex.chargePreview.remaining}
              </span>
            )}
          </div>
        )}

        {hex.occupant === null ? (
          <span className="battlefield-empty-hex-dot" aria-hidden="true" />
        ) : (
          <div
            className={[
              "battlefield-fighter-badge",
              hex.occupant.toneClass,
              hex.isPowerResponseFighter ? "battlefield-fighter-badge-power-response" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span>{hex.occupant.label}</span>
            <div className="battlefield-fighter-token-row">
              {hex.occupant.statusTags.map((tag) => (
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
}

// ---------------------------------------------------------------------------
// Hex CSS-class computation. Pure function of the scene-described visual
// state — no game reference needed.
// ---------------------------------------------------------------------------

function getHexClassName(hex: BoardSceneHex): string {
  const state: BoardSceneHexVisual = hex.visual;
  const classes = ["battlefield-map-hex"];

  if (state.territoryOwner === "none") {
    classes.push("battlefield-map-hex-neutral");
  } else if (state.territoryOwner === "player-one") {
    classes.push("battlefield-map-hex-player-one");
  } else if (state.territoryOwner === "player-two") {
    classes.push("battlefield-map-hex-player-two");
  } else {
    classes.push("battlefield-map-hex-unclaimed");
  }

  if (state.isStarting) {
    classes.push("battlefield-map-hex-start");
  }

  if (state.isEdge) {
    classes.push("battlefield-map-hex-edge");
  }

  if (state.kind === HexKind.Blocked) {
    classes.push("battlefield-map-hex-blocked");
  }

  if (state.kind === HexKind.Stagger) {
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

// Re-export for any consumers that historically imported them from here.
export type { BoardSceneModel, BoardSceneHexClickIntent } from "./boardScene";
export { FeatureTokenSide };
