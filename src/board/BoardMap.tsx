import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FeatureTokenSide, HexKind } from "../domain";
import type {
  ActiveActionMode,
  BoardSceneHex,
  BoardSceneHexClickIntent,
  BoardSceneHexVisual,
  BoardSceneModel,
  BoardSceneTerritoryOwner,
  TerritoryIndicatorMode,
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
    <div ref={frameRef} className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
      <div
        ref={mapWrapperRef}
        className="relative flex-none self-center"
        style={{
          width: `${scene.viewport.width * mapScale}px`,
          height: `${scene.viewport.height * mapScale}px`,
        }}
      >
        <div
          className="relative"
          data-territory-indicator={scene.territoryIndicator}
          data-has-bg={scene.backgroundImage !== null ? "" : undefined}
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
              className="absolute pointer-events-none"
              style={scene.backgroundImageStyle ?? undefined}
            />
          )}
          {scene.territoryIndicator === "labels" && scene.territoryLabels !== null && (
            <>
              <div className="absolute left-0 right-0 h-1/2 pointer-events-none z-[1] top-0 bg-[radial-gradient(ellipse_120%_60%_at_50%_0%,rgba(80,160,220,0.18)_0%,transparent_70%)]" />
              <div className="absolute left-0 right-0 h-1/2 pointer-events-none z-[1] bottom-0 bg-[radial-gradient(ellipse_120%_60%_at_50%_100%,rgba(220,130,50,0.18)_0%,transparent_70%)]" />
              <div className="absolute left-1/2 -translate-x-1/2 py-1 px-3.5 rounded-full font-sans text-[0.65rem] font-bold leading-none tracking-[0.08em] uppercase pointer-events-none z-[3] top-1.5 bg-[rgba(80,140,200,0.55)] text-white">
                Friendly Territory
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 py-1 px-3.5 rounded-full font-sans text-[0.65rem] font-bold leading-none tracking-[0.08em] uppercase pointer-events-none z-[3] bottom-1.5 bg-[rgba(200,120,60,0.55)] text-white">
                Enemy Territory
              </div>
            </>
          )}
          {scene.territoryIndicator === "border" && (
            <div
              className="absolute left-[5%] right-[5%] h-0 border-t-[3px] border-dashed border-[rgba(255,255,255,0.5)] pointer-events-none z-[2]"
              style={{ top: `${scene.viewport.height / 2}px` }}
            />
          )}
          {scene.territoryIndicator === "stripe" && (
            <>
              <div className="absolute left-0 right-0 h-1.5 pointer-events-none z-[2] top-0 bg-[rgba(80,140,200,0.6)]" />
              <div className="absolute left-0 right-0 h-1.5 pointer-events-none z-[2] bottom-0 bg-[rgba(200,120,60,0.6)]" />
            </>
          )}
          {hexes.map((hex) => (
            <HexCell
              key={hex.id}
              hex={hex}
              armedPathTone={armedPathTone}
              hasBg={scene.backgroundImage !== null}
              territoryIndicator={scene.territoryIndicator}
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
              className="absolute w-max max-w-[160px] py-1.5 px-2 rounded-[10px] bg-[rgba(46,33,24,0.96)] text-[#fff8ee] shadow-[0_12px_24px_rgba(26,19,15,0.26)] text-[0.62rem] font-semibold leading-[1.25] text-center normal-case whitespace-normal pointer-events-none z-[8] after:content-[''] after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-[6px_6px_0] after:border-solid after:border-[rgba(46,33,24,0.96)_transparent_transparent]"
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
    <div className="flex items-center gap-2.5 text-[#5e4b3a]">
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
  hasBg: boolean;
  territoryIndicator: TerritoryIndicatorMode;
  onClickIntent: (intent: BoardSceneHexClickIntent) => void;
  onHoverChargeTarget: (fighterId: string | null) => void;
  onDelveInlineFeature: () => void;
  onShowTooltip: (tooltip: { label: string; left: number; top: number }) => void;
  onHideTooltip: (label: string) => void;
};

// -- Path step tone → Tailwind class map -----------------------------------
const PATH_STEP_TONE: Record<string, string> = {
  move: "bg-[rgba(17,103,109,0.96)] text-[#ebfffd]",
  charge: "bg-[rgba(142,95,15,0.96)] text-[#fff8e6]",
};

// -- Action-badge tone → Tailwind class map ---------------------------------
const ACTION_BADGE_TONE: Record<string, string> = {
  move: "bg-[rgba(16,96,102,0.9)] text-[#ecfffd]",
  charge: "bg-[rgba(134,93,15,0.92)] text-[#fff8e7]",
  armed: "bg-[rgba(111,66,8,0.96)] text-[#fff6db]",
  target: "bg-[rgba(134,44,24,0.92)] text-[#fff3ef]",
  attack: "bg-[rgba(123,28,58,0.94)] text-[#fff4f8]",
  confirm: "bg-[rgba(25,72,74,0.96)] text-[#f1fffe]",
  last: "bg-[rgba(94,23,46,0.94)] text-[#fff4f8]",
};

// -- Feature-chip side → Tailwind class map ---------------------------------
const FEATURE_SIDE: Record<string, string> = {
  hidden: "bg-[rgba(236,231,224,0.92)]",
  treasure: "bg-[rgba(239,223,142,0.92)]",
  cover: "bg-[rgba(196,223,177,0.92)]",
};

function HexCell({
  hex,
  armedPathTone,
  hasBg,
  territoryIndicator,
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
    getHexClassName(hex, hasBg, territoryIndicator),
    hex.armedPathStep !== null
      ? "before:content-[''] before:absolute before:inset-[14px] before:rounded-2xl before:border-2 before:border-dashed before:pointer-events-none"
      : "",
    hex.armedPathStep !== null && armedPathTone === "move"
      ? "before:border-[rgba(20,136,140,0.78)]"
      : "",
    hex.armedPathStep !== null && armedPathTone === "charge"
      ? "before:border-[rgba(178,118,17,0.82)]"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={className}
      data-hex
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
        <div className="flex justify-between items-center gap-2 text-[0.57rem] text-[#57493d]">
          <div className="flex items-center justify-end gap-1">
            <span
              className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-full text-[0.58rem] font-extrabold leading-none shadow-[0_6px_12px_rgba(36,26,18,0.14)] ${PATH_STEP_TONE[hex.armedPathStep.tone] ?? ""}`}
            >
              {hex.armedPathStep.step}
            </span>
          </div>
        </div>
      )}

      <div className="grid place-items-center gap-[5px]">
        {hex.featureToken === null
          ? null
          : hex.isDelveReadyFeature
            ? (
              <button
                type="button"
                className={[
                  "py-[3px] px-2 rounded-full text-[0.64rem] font-bold border border-[rgba(73,56,39,0.22)] text-[#2e241b] bg-[rgba(255,251,243,0.9)]",
                  FEATURE_SIDE[hex.featureToken.side] ?? "",
                  "font-[inherit] cursor-pointer shadow-[0_8px_18px_rgba(41,33,20,0.14)]",
                  "border-[rgba(109,148,54,0.32)] shadow-[inset_0_0_0_1px_rgba(250,255,244,0.84),0_0_0_3px_rgba(152,191,74,0.18),0_8px_18px_rgba(41,33,20,0.14)]",
                  hex.isPendingDelveFeature
                    ? "border-[rgba(90,132,32,0.44)] bg-[rgba(239,251,220,0.98)] shadow-[inset_0_0_0_1px_rgba(251,255,244,0.94),0_0_0_3px_rgba(125,171,47,0.24),0_8px_18px_rgba(41,33,20,0.16)]"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
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
                className={`py-[3px] px-2 rounded-full text-[0.64rem] font-bold border border-[rgba(73,56,39,0.22)] text-[#2e241b] bg-[rgba(255,251,243,0.9)] ${FEATURE_SIDE[hex.featureToken.side] ?? ""}`}
              >
                {hex.featureToken.badge}
              </span>
            )}

        {hex.actionBadge === null ? null : (
          <span
            className={[
              "inline-flex items-center justify-center relative py-[2px] px-2 rounded-full text-[0.62rem] font-bold uppercase tracking-[0.04em]",
              ACTION_BADGE_TONE[hex.actionBadge.tone] ?? "",
              hex.actionBadge.detailed
                ? "max-w-[60px] py-1 px-1.5 rounded-[12px] text-center whitespace-normal leading-[1.15] normal-case tracking-normal text-[0.48rem]"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            title={hex.actionBadge.detailed ? hex.actionBadge.label : undefined}
          >
            {hex.actionBadge.label}
          </span>
        )}

        {hex.attackPreview === null ? null : (
          <div className="flex flex-wrap justify-center gap-1 max-w-[62px]">
            {hex.attackPreview.visible.map((label) => (
              <span
                key={label}
                className="inline-flex items-center justify-center min-h-4 py-0.5 px-1.5 rounded-full bg-[rgba(113,24,54,0.94)] text-[#fff4f8] shadow-[0_6px_12px_rgba(36,26,18,0.14)] text-[0.5rem] font-extrabold leading-none tracking-[0.01em] text-center"
                title={label}
              >
                {label}
              </span>
            ))}
            {hex.attackPreview.remaining === 0 ? null : (
              <span
                className="inline-flex items-center justify-center min-h-4 py-0.5 px-1.5 rounded-full bg-[rgba(80,26,45,0.92)] text-[#fff4f8] shadow-[0_6px_12px_rgba(36,26,18,0.14)] text-[0.5rem] font-extrabold leading-none tracking-[0.01em] text-center"
                title={hex.attackPreview.fullLabels.join(" | ")}
              >
                +{hex.attackPreview.remaining}
              </span>
            )}
          </div>
        )}

        {hex.chargePreview === null ? null : (
          <div className="flex flex-wrap justify-center gap-1 max-w-[62px] -mt-px">
            {hex.chargePreview.visible.map((label) => (
              <span
                key={label}
                className="inline-flex items-center justify-center min-h-4 py-0.5 px-1.5 rounded-full bg-[rgba(146,95,13,0.94)] text-[#fff8e8] shadow-[0_6px_12px_rgba(36,26,18,0.14)] text-[0.5rem] font-extrabold leading-none tracking-[0.01em] text-center"
                title={label}
              >
                {label}
              </span>
            ))}
            {hex.chargePreview.remaining === 0 ? null : (
              <span
                className="inline-flex items-center justify-center min-h-4 py-0.5 px-1.5 rounded-full bg-[rgba(117,78,17,0.92)] text-[#fff8e8] shadow-[0_6px_12px_rgba(36,26,18,0.14)] text-[0.5rem] font-extrabold leading-none tracking-[0.01em] text-center"
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
              className={getStartingIconClassName("w-6 h-6", hasBg, territoryIndicator, hex.visual.territoryOwner)}
            />
          ) : (
            <span className="w-2 h-2 rounded-full bg-[rgba(87,73,61,0.45)]" aria-hidden="true" />
          )
        ) : hex.visual.isStarting ? (
          <div className="flex flex-col items-center">
            <img
              src="/assets/core-ability.png"
              alt=""
              aria-hidden="true"
              className={getStartingIconClassName("w-3.5 h-3.5", hasBg, territoryIndicator, hex.visual.territoryOwner)}
            />
            <div
              className={[
                "min-w-[54px] py-2 px-2 pb-1.5 rounded-2xl text-[#fffaf5] font-bold text-center shadow-[0_10px_18px_rgba(36,26,18,0.2)]",
                hex.occupant.toneClass,
                hex.visual.isSelectedHex
                  ? "shadow-[inset_0_0_0_2px_rgba(255,255,255,0.82),0_0_0_3px_rgba(255,251,243,0.5),0_0_14px_rgba(255,251,243,0.35),0_10px_18px_rgba(36,26,18,0.2)] scale-[1.08]"
                  : "",
                hex.isPowerResponseFighter
                  ? "shadow-[inset_0_0_0_2px_rgba(255,255,255,0.78),0_0_0_3px_rgba(111,178,184,0.24),0_0_16px_rgba(104,171,177,0.24),0_10px_18px_rgba(36,26,18,0.2)] animate-[battlefield-power-response-pulse_1.7s_ease-in-out_infinite]"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span>{hex.occupant.label}</span>
              <div className="flex flex-wrap justify-center gap-1 mt-1">
                {hex.occupant.statusTags.map((tag) => (
                  <span key={tag} className="py-0.5 px-1.5 rounded-full bg-[rgba(255,251,243,0.16)] border border-[rgba(255,251,243,0.2)] text-[0.63rem]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className={[
              "min-w-[54px] py-2 px-2 pb-1.5 rounded-2xl text-[#fffaf5] font-bold text-center shadow-[0_10px_18px_rgba(36,26,18,0.2)]",
              hex.occupant.toneClass,
              hex.visual.isSelectedHex
                ? "shadow-[inset_0_0_0_2px_rgba(255,255,255,0.82),0_0_0_3px_rgba(255,251,243,0.5),0_0_14px_rgba(255,251,243,0.35),0_10px_18px_rgba(36,26,18,0.2)] scale-[1.08]"
                : "",
              hex.isPowerResponseFighter
                ? "shadow-[inset_0_0_0_2px_rgba(255,255,255,0.78),0_0_0_3px_rgba(111,178,184,0.24),0_0_16px_rgba(104,171,177,0.24),0_10px_18px_rgba(36,26,18,0.2)] animate-[battlefield-power-response-pulse_1.7s_ease-in-out_infinite]"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span>{hex.occupant.label}</span>
            <div className="flex flex-wrap justify-center gap-1 mt-1">
              {hex.occupant.statusTags.map((tag) => (
                <span key={tag} className="py-0.5 px-1.5 rounded-full bg-[rgba(255,251,243,0.16)] border border-[rgba(255,251,243,0.2)] text-[0.63rem]">
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
// Starting-icon class helper.
// ---------------------------------------------------------------------------

function getStartingIconClassName(
  sizeClass: string,
  hasBg: boolean,
  territoryIndicator: TerritoryIndicatorMode,
  territoryOwner: BoardSceneTerritoryOwner,
): string {
  if (hasBg) {
    return `${sizeClass} opacity-25 pointer-events-none hidden`;
  }
  if (territoryIndicator === "markers") {
    if (territoryOwner === "player-one") {
      return `${sizeClass} block opacity-70 pointer-events-none [filter:sepia(1)_saturate(3)_hue-rotate(180deg)_brightness(1.4)]`;
    }
    if (territoryOwner === "player-two") {
      return `${sizeClass} block opacity-70 pointer-events-none [filter:sepia(1)_saturate(3)_hue-rotate(0deg)_brightness(1.2)]`;
    }
  }
  return `${sizeClass} opacity-25 pointer-events-none`;
}

// ---------------------------------------------------------------------------
// Hex CSS-class computation. Pure function of the scene-described visual
// state — no game reference needed.
// ---------------------------------------------------------------------------

// -- Hex base Tailwind class (shared by every hex) -------------------------
const HEX_BASE =
  "absolute w-[79.67px] h-[92px] p-[10px_11px_12px] box-border grid grid-rows-[auto_1fr_auto] [clip-path:polygon(50%_0%,100%_24%,100%_76%,50%_100%,0%_76%,0%_24%)] border-2 border-[rgba(62,47,31,0.34)] bg-[rgba(246,240,229,0.88)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45),0_8px_18px_rgba(48,37,28,0.14)] transition-[transform,box-shadow,border-color] duration-[120ms] ease-out";

// -- Territory background gradients ----------------------------------------
const TERRITORY_BG: Record<string, string> = {
  none: "bg-[linear-gradient(180deg,rgba(228,218,201,0.96),rgba(209,196,176,0.96))]",
  "player-one":
    "bg-[linear-gradient(180deg,rgba(206,222,231,0.96),rgba(175,198,214,0.96))]",
  "player-two":
    "bg-[linear-gradient(180deg,rgba(237,214,194,0.96),rgba(224,177,146,0.96))]",
  unclaimed:
    "bg-[linear-gradient(180deg,rgba(226,220,213,0.96),rgba(211,201,193,0.96))]",
};

function getHexClassName(hex: BoardSceneHex, hasBg: boolean, territoryIndicator: TerritoryIndicatorMode): string {
  const state: BoardSceneHexVisual = hex.visual;
  const classes = [HEX_BASE];

  // When a board background image is present, hexes are transparent
  if (hasBg) {
    classes.push("!bg-transparent !border-transparent !shadow-none hover:!bg-[rgba(255,255,255,0.12)]");
  } else if (territoryIndicator === "tint") {
    // Tint mode: subtle territory-coloured backgrounds
    if (state.territoryOwner === "player-one") {
      classes.push("bg-[rgba(80,140,200,0.18)]");
    } else if (state.territoryOwner === "player-two") {
      classes.push("bg-[rgba(200,120,60,0.18)]");
    } else {
      classes.push(TERRITORY_BG[state.territoryOwner] ?? TERRITORY_BG.unclaimed);
    }
  } else {
    // Territory background
    classes.push(TERRITORY_BG[state.territoryOwner] ?? TERRITORY_BG.unclaimed);
  }

  if (state.isStarting && !hasBg) {
    classes.push(
      "shadow-[inset_0_0_0_2px_rgba(255,248,220,0.7),0_0_0_3px_rgba(136,101,61,0.2),0_8px_18px_rgba(48,37,28,0.14)]",
    );
  }

  if (state.isEdge && !hasBg) {
    classes.push("border-[rgba(78,53,26,0.55)]");
  }

  if (state.kind === HexKind.Blocked && !hasBg) {
    classes.push(
      "after:content-[''] after:absolute after:inset-[10px] after:rounded-[14px] after:pointer-events-none after:bg-[repeating-linear-gradient(135deg,rgba(63,57,52,0.22),rgba(63,57,52,0.22)_4px,transparent_4px,transparent_9px)]",
    );
  }

  if (state.kind === HexKind.Stagger && !hasBg) {
    classes.push(
      "after:content-[''] after:absolute after:inset-[10px] after:rounded-[14px] after:pointer-events-none after:border-2 after:border-dashed after:border-[rgba(140,81,40,0.48)]",
    );
  }

  if (state.isMoveDestination) {
    classes.push(
      "border-[rgba(27,121,129,0.74)] bg-[linear-gradient(180deg,rgba(190,240,235,0.98),rgba(104,204,196,0.98))] shadow-[inset_0_0_0_2px_rgba(230,255,252,0.72),0_0_0_4px_rgba(86,175,177,0.2),0_10px_20px_rgba(48,37,28,0.18)]",
    );
  }

  if (state.isPendingMoveHex) {
    classes.push(
      "border-[rgba(11,88,94,0.96)] bg-[linear-gradient(180deg,rgba(142,245,234,1),rgba(42,184,172,1))] shadow-[inset_0_0_0_2px_rgba(235,255,252,0.88),0_0_0_4px_rgba(20,145,147,0.34),0_0_18px_rgba(24,154,148,0.4),0_10px_20px_rgba(48,37,28,0.2)]",
    );
  }

  if (state.isPendingDelveHex) {
    classes.push(
      "border-[rgba(90,132,32,0.96)] bg-[linear-gradient(180deg,rgba(235,249,206,1),rgba(165,206,88,1))] shadow-[inset_0_0_0_2px_rgba(251,255,244,0.92),0_0_0_4px_rgba(125,171,47,0.28),0_0_18px_rgba(119,166,41,0.34),0_10px_20px_rgba(48,37,28,0.2)]",
    );
  }

  if (state.isPendingGuardHex) {
    classes.push(
      "border-[rgba(111,125,139,0.9)] bg-[linear-gradient(180deg,rgba(251,252,255,1),rgba(214,220,228,1))] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.96),0_0_0_4px_rgba(192,202,212,0.32),0_0_18px_rgba(186,197,207,0.34),0_10px_20px_rgba(48,37,28,0.2)]",
    );
  }

  if (state.isChargeDestination) {
    classes.push(
      "border-[rgba(168,121,24,0.82)] bg-[linear-gradient(180deg,rgba(247,227,159,0.98),rgba(227,184,82,0.98))] shadow-[inset_0_0_0_2px_rgba(255,247,213,0.72),0_0_0_4px_rgba(204,164,55,0.2),0_10px_20px_rgba(48,37,28,0.18)]",
    );
  }

  if (state.isHoveredChargeDestination) {
    classes.push(
      "border-[rgba(133,81,6,0.96)] shadow-[inset_0_0_0_2px_rgba(255,249,224,0.84),0_0_0_4px_rgba(219,164,35,0.34),0_0_18px_rgba(220,159,26,0.38),0_10px_20px_rgba(48,37,28,0.2)]",
    );
  }

  if (state.isPendingChargeHex) {
    classes.push(
      "border-[rgba(120,71,8,0.95)] shadow-[inset_0_0_0_2px_rgba(255,251,231,0.84),0_0_0_4px_rgba(222,170,46,0.42),0_0_18px_rgba(214,157,41,0.48),0_10px_20px_rgba(48,37,28,0.2)]",
    );
  }

  if (state.isChargeTarget) {
    classes.push(
      "border-[rgba(152,61,40,0.82)] bg-[linear-gradient(180deg,rgba(247,197,184,0.98),rgba(217,117,91,0.98))] shadow-[inset_0_0_0_2px_rgba(255,229,221,0.72),0_0_0_4px_rgba(179,77,51,0.22),0_10px_20px_rgba(48,37,28,0.18)]",
    );
  }

  if (state.isHoveredChargeTarget) {
    classes.push(
      "border-[rgba(131,43,23,0.96)] shadow-[inset_0_0_0_2px_rgba(255,239,233,0.84),0_0_0_4px_rgba(197,76,44,0.32),0_0_18px_rgba(198,79,47,0.34),0_10px_20px_rgba(48,37,28,0.2)]",
    );
  }

  if (state.isPendingAttackTarget) {
    classes.push(
      "border-[rgba(112,17,44,0.96)] bg-[linear-gradient(180deg,rgba(255,174,203,1),rgba(200,46,97,1))] shadow-[inset_0_0_0_2px_rgba(255,235,242,0.86),0_0_0_4px_rgba(168,33,80,0.36),0_0_18px_rgba(180,38,88,0.42),0_10px_20px_rgba(48,37,28,0.2)]",
    );
  }

  if (state.isPendingChargeTarget) {
    classes.push(
      "border-[rgba(124,31,13,0.96)] bg-[linear-gradient(180deg,rgba(255,170,149,1),rgba(221,82,49,1))] shadow-[inset_0_0_0_2px_rgba(255,236,229,0.86),0_0_0_4px_rgba(205,66,35,0.36),0_0_18px_rgba(203,67,37,0.42),0_10px_20px_rgba(48,37,28,0.2)]",
    );
  }

  if (state.isAttackTarget) {
    classes.push(
      "border-[rgba(140,34,61,0.88)] bg-[linear-gradient(180deg,rgba(246,187,208,0.98),rgba(211,89,131,0.98))] shadow-[inset_0_0_0_2px_rgba(255,230,239,0.76),0_0_0_4px_rgba(181,70,112,0.24),0_10px_20px_rgba(48,37,28,0.18)]",
    );
  }

  if (state.isRecentCombatTarget) {
    classes.push(
      "border-[rgba(109,24,48,0.96)] shadow-[inset_0_0_0_2px_rgba(255,236,242,0.82),0_0_0_4px_rgba(150,45,77,0.34),0_0_20px_rgba(170,54,91,0.38),0_10px_20px_rgba(48,37,28,0.2)]",
    );
  }

  if (state.isPowerResponseHex) {
    classes.push(
      "border-[rgba(72,124,130,0.76)] shadow-[inset_0_0_0_2px_rgba(249,255,254,0.84),0_0_0_4px_rgba(92,154,160,0.18),0_0_18px_rgba(98,169,175,0.24),0_10px_20px_rgba(48,37,28,0.18)]",
    );
  }

  if (state.isDelveReadyHex) {
    classes.push(
      "border-[rgba(109,148,54,0.82)] shadow-[inset_0_0_0_2px_rgba(247,255,235,0.9),0_0_0_4px_rgba(152,191,74,0.22),0_0_18px_rgba(140,184,60,0.28),0_10px_20px_rgba(48,37,28,0.18)]",
    );
  }

  if (state.isSelectedHex) {
    classes.push(
      "shadow-[inset_0_0_0_2px_rgba(255,251,243,0.7),0_0_0_4px_rgba(83,58,38,0.18),0_10px_20px_rgba(48,37,28,0.18)]",
    );
  }

  if (state.isSelectableHex) {
    classes.push("cursor-pointer hover:-translate-y-0.5");
  }

  if (state.isClickableHex) {
    classes.push("cursor-pointer hover:-translate-y-0.5");
    if (hasBg) {
      classes.push("hover:!bg-[rgba(255,255,255,0.18)]");
    }
  }

  if (state.isSelectableHex && hasBg) {
    classes.push("hover:!bg-[rgba(255,255,255,0.18)]");
  }

  if (state.isGuardReadyHex) {
    classes.push(
      "shadow-[inset_0_0_0_2px_rgba(255,255,255,0.84),0_0_0_4px_rgba(255,255,255,0.28),0_10px_20px_rgba(48,37,28,0.18)]",
    );
  }

  if (state.isSetupLegalHex) {
    classes.push(
      "cursor-pointer border-[rgba(82,129,68,0.8)] bg-[linear-gradient(180deg,rgba(214,246,196,0.96),rgba(150,209,126,0.96))] shadow-[inset_0_0_0_2px_rgba(240,255,228,0.72),0_0_0_4px_rgba(108,172,82,0.26),0_10px_20px_rgba(48,37,28,0.18)] hover:brightness-[1.06]",
    );
  }

  return classes.join(" ");
}

// Re-export for any consumers that historically imported them from here.
export type { BoardSceneModel, BoardSceneHexClickIntent } from "./boardScene";
export { FeatureTokenSide };
