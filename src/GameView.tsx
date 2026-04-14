import PlayerHandDockShell from "./PlayerHandDockShell";
import { DockActionOverlay } from "./PlayerHandDock";
import { projectBoard } from "./board/projectBoard";
import type { BoardTheme } from "./board/boardTheme";
import { projectBoardScene } from "./board/boardScene";
import DiceTray, { getDiceTrayModel } from "./board/DiceTray";
import BoardMap from "./board/BoardMap";
import StatusBar from "./board/StatusBar";
import DebugPanel from "./DebugPanel";
import PlayerPanel from "./board/PlayerPanel";
import GameDebugContent from "./GameDebugContent";
import SetupPhasePanel from "./setup/SetupPhasePanel";
import { useGameEngine, getSetupBannerText, getBoardTurnHeaderModel, getArmedPathModel } from "./hooks/useGameEngine";
import { useDockInteraction } from "./hooks/useDockInteraction";
import type { FighterId, DeckDefinition, WarbandDefinition } from "./domain";

type GameViewProps = {
  warband: WarbandDefinition;
  deck?: DeckDefinition | null;
  boardTheme?: BoardTheme | null;
};

export default function GameView({ warband, deck = null, boardTheme = null }: GameViewProps) {
  const e = useGameEngine({ warband, deck });

  // --- Board projection (stays here -- feeds directly into the render) ---
  const boardProjection = projectBoard(e.game.board);
  const diceTrayModel = getDiceTrayModel(e.game);

  const boardTurnHeader = e.isSetup
    ? { activePlayerName: e.activePlayer?.name ?? "Setup", interactionLabel: getSetupBannerText(e.game), isArmed: false, tone: "neutral" as const, stepLabel: "Setup", roundLabel: null, scores: null }
    : getBoardTurnHeaderModel({
        activePlayerName: e.activePlayer?.name ?? "No active player", game: e.game,
        pendingAttackBadgeLabel: e.pendingAttackBadgeLabel, pendingAttackTargetName: e.pendingAttackTargetName,
        pendingChargeBadgeLabel: e.pendingChargeBadgeLabel, pendingChargeHexId: e.pendingChargeHexId,
        pendingChargeTargetName: e.pendingChargeTargetName, pendingDelveFeatureTokenId: e.pendingDelveFeatureTokenId,
        pendingFocus: e.pendingFocus, pendingGuardFighterId: e.pendingGuardFighterId,
        pendingMoveHexId: e.pendingMoveHexId, pendingPassPower: e.pendingPassPower,
        pendingPowerOption: e.pendingPowerOption, selectedFighterName: e.selectedFighterName,
        selectedFeatureToken: e.selectedFeatureToken,
      });

  const armedPath = getArmedPathModel(e.actionLens, e.pendingMoveHexId, e.pendingChargeHexId, e.pendingChargeTargetId, e.selectedChargeKeysByPair);

  const boardScene = projectBoardScene({
    game: e.game, positionedHexes: boardProjection.positionedHexes, actionLens: e.actionLens,
    activePlayerId: e.activePlayer?.id ?? null, selectedFighterId: e.selectedFighterId,
    selectedFeatureToken: e.selectedFeatureToken, pendingMoveHexId: e.pendingMoveHexId,
    pendingDelveFeatureTokenId: e.pendingDelveFeatureTokenId, pendingFocus: e.pendingFocus,
    pendingGuardFighterId: e.pendingGuardFighterId, pendingPassPower: e.pendingPassPower,
    pendingChargeHexId: e.pendingChargeHexId, pendingChargeTargetId: e.pendingChargeTargetId,
    pendingAttackTargetId: e.pendingAttackTargetId, pendingChargeBadgeLabel: e.pendingChargeBadgeLabel,
    pendingAttackBadgeLabel: e.pendingAttackBadgeLabel, pendingPowerOptionKey: e.pendingPowerOptionKey,
    recentCombatTargetId: e.recentCombatTargetId, attackPreviewByTarget: e.attackPreviewByTarget,
    chargePreviewByTarget: e.chargePreviewByTarget, armedPath, boardTurnHeader,
    lastResolvedAction: e.lastResolvedAction, resultFlash: e.resultFlash, powerOverlay: e.powerOverlay,
    setupLegalHexIds: e.isSetup ? e.setupLegalHexIds : undefined,
    isSetupClickEnabled: e.isSetup && e.setupOnHexClick !== undefined,
    hoveredChargeTargetId: e.hoveredChargeTargetId, isInteractionEnabled: e.isHumanTurn,
    activeActionMode: e.activeActionMode, boardTheme, territoryIndicator: "labels",
  });

  // --- Dock interaction ---
  const dockInteraction = useDockInteraction({
    game: e.game, isSetup: e.isSetup, isHumanTurn: e.isHumanTurn, localPlayer: e.localPlayer,
    pendingFocus: e.pendingFocus, selectedFocusObjectiveIds: e.selectedFocusObjectiveIds,
    selectedFocusPowerIds: e.selectedFocusPowerIds, focusSelectionSummary: e.focusSelectionSummary,
    handPowerPlayable: e.handPowerPlayable, pendingPlayCardId: e.pendingPlayCardId,
    pendingPowerOptionKey: e.pendingPowerOptionKey, applySetupAction: e.applySetupAction,
    toggleFocusObjectiveCard: e.toggleFocusObjectiveCard, toggleFocusPowerCard: e.toggleFocusPowerCard,
    focusHand: e.focusHand, clearPendingInteractions: e.clearPendingInteractions,
    handleDockSelectCard: e.handleDockSelectCard, selectPowerOption: e.selectPowerOption,
  });

  // ===== Render =====
  // Layout: top bar → 5-column grid → bottom dock.
  // Columns: gutter | panel | map (auto) | panel | gutter.
  // Panels use minmax(12rem,20vw). Map sizes to intrinsic width (auto).
  // Outer gutters (1fr) absorb all leftover horizontal space.
  return (
    <>
    <main className="h-screen m-0 p-0 grid grid-rows-[auto_1fr_auto] overflow-hidden" onClick={e.dismissSelection}>
      {/* ── Row 1: top bar ──────────────────────────────────── */}
      <StatusBar badge={boardScene.statusBadge} />

      {/* ── Row 2: 5-column game area ───────────────────────── */}
      <div className="min-h-0 grid grid-cols-[1fr_minmax(12rem,min(20vw,256px))_auto_minmax(12rem,min(20vw,256px))_1fr] gap-0 overflow-hidden">
        {/* Col 1: left side (future: extra widgets) */}
        <div className="min-h-0 overflow-hidden" />

        {/* Col 2: left roster */}
        <div className="min-h-0 overflow-y-auto bg-[rgba(253,249,242,0.5)] border-r border-[rgba(85,66,40,0.06)]">
          {e.localPlayer !== null && (
            <PlayerPanel activePlayerId={e.activePlayer?.id ?? null} game={e.game}
              onSelectFighter={e.isSetup ? noop : e.selectFighter} player={e.localPlayer}
              selectedFighterId={e.selectedFighterId} />
          )}
        </div>

        {/* Col 3: map + quick actions */}
        <div className="min-h-0 overflow-hidden relative"
          style={{ aspectRatio: `${boardScene.viewport.width} / ${boardScene.viewport.height}` }}>
          <BoardMap scene={boardScene}
            onHoverChargeTarget={(fighterId) => e.setHoveredChargeTargetId(fighterId as FighterId | null)}
            onHexClickIntent={e.handleHexClickIntent} onDelveInlineFeature={e.delveSelectedFighter}
            onContextMenuAction={e.handleContextMenuAction} onDismissContextMenu={e.dismissContextMenu} />
          <div data-quick-actions className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 py-1.5 pointer-events-none [&>*]:pointer-events-auto">
            {boardScene.quickActions.map((action) => (
              <button key={action.key} type="button"
                className={`border border-[rgba(84,63,45,0.2)] rounded-pill py-1.5 px-4 font-[inherit] text-[0.75rem] font-bold cursor-pointer bg-[rgba(255,251,245,0.95)] text-[#3a2e24] shadow-button whitespace-nowrap hover:bg-[rgba(245,238,225,1)]${action.armed ? " bg-[rgba(141,92,13,0.2)] border-[rgba(141,92,13,0.35)]" : ""}`}
                onClick={() => e.handleQuickAction(action)}>{action.label}</button>
            ))}
          </div>
        </div>

        {/* Col 4: right roster / setup panel */}
        <div className="min-h-0 overflow-y-auto bg-[rgba(253,249,242,0.5)] border-l border-[rgba(85,66,40,0.06)]">
          {e.isSetup ? (
            <SetupPhasePanel game={e.game} activePlayer={e.activePlayer} applySetupAction={e.applySetupAction} />
          ) : (
            e.opponentPlayer !== null && (
              <PlayerPanel activePlayerId={e.activePlayer?.id ?? null} game={e.game}
                onSelectFighter={noop} player={e.opponentPlayer} selectedFighterId={null} />
            )
          )}
        </div>

        {/* Col 5: right side (future: extra widgets) */}
        <div className="min-h-0 overflow-hidden" />
      </div>

      {/* ── Row 3: bottom dock ──────────────────────────────── */}
      {e.localPlayer !== null && (
        <PlayerHandDockShell player={e.localPlayer} interaction={dockInteraction}
          scorableObjectives={e.scorableObjectives} onScoreObjective={e.scoreObjective} />
      )}
    </main>

    {diceTrayModel !== null && (
      <div className="fixed bottom-[calc(28vh+12px)] right-3 w-[280px] max-h-[40vh] overflow-y-auto z-20 pointer-events-none [&>*]:pointer-events-auto">
        <DiceTray model={diceTrayModel} />
      </div>
    )}

    {e.isSetup && (
      <button type="button"
        className="fixed top-4 right-4 z-40 py-2 px-4 rounded-pill border border-[rgba(85,66,40,0.3)] bg-[rgba(253,249,242,0.96)] text-[#4a3a25] font-[inherit] text-[0.82rem] font-bold tracking-[0.04em] cursor-pointer shadow-[0_10px_22px_rgba(63,46,29,0.18)] backdrop-blur-[10px] transition-all duration-[120ms] ease-in-out hover:-translate-y-px hover:bg-parchment-dark hover:shadow-[0_14px_26px_rgba(63,46,29,0.22)]"
        onClick={e.autoSetupToBattle} title="Auto-resolve all remaining setup actions and jump straight into combat.">
        Skip to battle
      </button>
    )}

    <DebugPanel>
      <GameDebugContent game={e.game} localPlayer={e.localPlayer} activePlayer={e.activePlayer}
        selectedFighterId={e.selectedFighterId} selectedFighterName={e.selectedFighterName}
        selectedMoveHexId={e.selectedMoveHexId} selectedMoveOption={e.selectedMoveOption}
        selectedChargeOption={e.selectedChargeOption} actionLens={e.actionLens} actionPrompt={e.actionPrompt}
        attackProfiles={e.attackProfiles} chargeProfiles={e.chargeProfiles}
        pendingChargeHexId={e.pendingChargeHexId} pendingFocus={e.pendingFocus}
        pendingGuardFighterId={e.pendingGuardFighterId} pendingPassPower={e.pendingPassPower}
        moveOptions={e.moveOptions} chargeOptions={e.chargeOptions} recentEvents={e.recentEvents}
        selectFighter={e.selectFighter} selectAttackProfile={e.selectAttackProfile}
        selectChargeProfile={e.selectChargeProfile} focusHand={e.focusHand}
        guardSelectedFighter={e.guardSelectedFighter} passTurn={e.passTurn} applyAction={e.applyAction}
        setSelectedMoveHexId={e.setSelectedMoveHexId} setSelectedChargeKey={e.setSelectedChargeKey} />
    </DebugPanel>
    <DockActionOverlay interaction={dockInteraction} />
    </>
  );
}

function noop(): void {}
