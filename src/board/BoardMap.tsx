import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FeatureTokenSide, HexKind } from "../domain";
import type {
  ActiveActionMode,
  BoardSceneHex,
  BoardSceneHexClickIntent,
  BoardSceneHexVisual,
  BoardSceneModel,
} from "./boardScene";
import FighterContextMenu from "./FighterContextMenu";

// -----------------------------------------------------------------------
// BoardMap (DOM renderer)
// -----------------------------------------------------------------------
// Pure hex-grid renderer. Takes a `BoardSceneModel` and intent callbacks
// and renders the hex map, territory indicators, context menu, and
// tooltips. All chrome (status bar, dice tray, roster rails) lives in the
// parent layout.

export type BoardMapProps = {
  scene: BoardSceneModel;
  onHoverChargeTarget: (fighterId: string | null) => void;
  onHexClickIntent: (intent: BoardSceneHexClickIntent) => void;
  onDelveInlineFeature: () => void;
  onContextMenuAction?: (mode: ActiveActionMode) => void;
  onDismissContextMenu?: () => void;
};

export default function BoardMap({
  scene,
  onHoverChargeTarget,
  onHexClickIntent,
  onDelveInlineFeature,
  onContextMenuAction,
  onDismissContextMenu,
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

  const { hexes, armedPathTone } = scene;

  return (
    <div ref={frameRef} className="battlefield-board-frame">
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
          data-territory-indicator={scene.territoryIndicator}
          style={{
            width: `${scene.viewport.width}px`,
            height: `${scene.viewport.height}px`,
            transform: `scale(${mapScale})`,
            transformOrigin: "top left",
          }}
        >
          {scene.backgroundImage !== null && (
            <img
              src={scene.backgroundImage}
              alt=""
              aria-hidden="true"
              className="battlefield-board-map-bg"
              style={scene.backgroundImageStyle ?? undefined}
            />
          )}
          {scene.territoryIndicator === "labels" && scene.territoryLabels !== null && (
            <>
              <div className="battlefield-territory-glow battlefield-territory-glow-top" />
              <div className="battlefield-territory-glow battlefield-territory-glow-bottom" />
              <div className="battlefield-territory-label battlefield-territory-label-top">
                Friendly Territory
              </div>
              <div className="battlefield-territory-label battlefield-territory-label-bottom">
                Enemy Territory
              </div>
            </>
          )}
          {scene.territoryIndicator === "border" && (
            <div className="battlefield-territory-border" style={{ top: `${scene.viewport.height / 2}px` }} />
          )}
          {scene.territoryIndicator === "stripe" && (
            <>
              <div className="battlefield-territory-stripe battlefield-territory-stripe-top" />
              <div className="battlefield-territory-stripe battlefield-territory-stripe-bottom" />
            </>
          )}
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
          {scene.contextMenu.visible && onContextMenuAction !== undefined && onDismissContextMenu !== undefined && (
            <FighterContextMenu
              model={scene.contextMenu}
              mapScale={mapScale}
              onSelectAction={onContextMenuAction}
              onDismiss={onDismissContextMenu}
              onConfirmGuard={() => {
                onContextMenuAction("guard");
              }}
            />
          )}
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
          hex.visual.isStarting ? (
            <img
              src="/assets/core-ability.png"
              alt=""
              aria-hidden="true"
              className="battlefield-hex-starting-icon"
            />
          ) : (
            <span className="battlefield-empty-hex-dot" aria-hidden="true" />
          )
        ) : hex.visual.isStarting ? (
          <div className="battlefield-hex-starting-occupied">
            <img
              src="/assets/core-ability.png"
              alt=""
              aria-hidden="true"
              className="battlefield-hex-starting-icon battlefield-hex-starting-icon-small"
            />
            <div
              className={[
                "battlefield-fighter-badge",
                hex.occupant.toneClass,
                hex.visual.isSelectedHex ? "battlefield-fighter-badge-selected" : "",
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
          </div>
        ) : (
          <div
            className={[
              "battlefield-fighter-badge",
              hex.occupant.toneClass,
              hex.visual.isSelectedHex ? "battlefield-fighter-badge-selected" : "",
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
