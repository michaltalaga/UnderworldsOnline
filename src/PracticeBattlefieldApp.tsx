import { useEffect, useState, type CSSProperties } from "react";
import "./PracticeBattlefieldApp.css";
import {
  AttackDieFace,
  AttackAction,
  ChargeAction,
  CombatActionService,
  createCombatReadySetupPracticeGame,
  DelveAction,
  FeatureTokenSide,
  GameAction,
  GameEngine,
  GameRecordKind,
  GuardAction,
  HexKind,
  MoveAction,
  PassAction,
  PlayPloyAction,
  PlayUpgradeAction,
  TurnStep,
  UseWarscrollAbilityAction,
  type BoardState,
  type CombatResult,
  type FeatureTokenState,
  type FighterState,
  type FighterId,
  type Game,
  type HexCell,
  type HexId,
  type PlayerState,
} from "./domain";

const combatActionService = new CombatActionService();
const demoEngine = new GameEngine();
const hexRadius = 46;
const hexWidth = Math.sqrt(3) * hexRadius;
const hexHeight = hexRadius * 2;
const boardPadding = 28;

type PositionedHex = {
  hex: HexCell;
  left: number;
  top: number;
};

type FighterActionLens = {
  fighter: FighterState | null;
  attackTargetHexIds: Set<HexId>;
  attackTargetIds: Set<FighterId>;
  moveHexIds: Set<HexId>;
  chargeHexIds: Set<HexId>;
  chargeTargetHexIds: Set<HexId>;
  chargeTargetIds: Set<FighterId>;
  attackActions: AttackAction[];
  moveActions: MoveAction[];
  chargeActions: ChargeAction[];
  delveAction: DelveAction | null;
  guardAction: GuardAction | null;
  passAction: PassAction | null;
  attackCount: number;
  moveCount: number;
  chargeCount: number;
  delveAvailable: boolean;
  guardAvailable: boolean;
};

type AttackProfileSummary = {
  targetId: FighterId;
  targetName: string;
  defaultKey: string;
  selectedKey: string;
  options: AttackProfileOptionSummary[];
};

type AttackProfileOptionSummary = {
  key: string;
  label: string;
  stats: string;
  isDefault: boolean;
};

type ChargeProfileSummary = {
  targetId: FighterId;
  targetName: string;
  defaultKey: string;
  selectedKey: string;
  options: AttackProfileOptionSummary[];
};

type BattlefieldResultFlash = {
  id: number;
  tone: "move" | "attack" | "charge" | "power";
  title: string;
  detail: string;
};

type BattlefieldAppAction =
  | MoveAction
  | ChargeAction
  | AttackAction
  | DelveAction
  | GuardAction
  | PassAction
  | PlayPloyAction
  | PlayUpgradeAction
  | UseWarscrollAbilityAction;

type PowerOverlayOption = {
  key: string;
  title: string;
  detail: string;
  action: PlayPloyAction | PlayUpgradeAction | UseWarscrollAbilityAction;
};

type PowerOverlayModel = {
  ploys: PowerOverlayOption[];
  upgrades: PowerOverlayOption[];
  warscrollAbilities: PowerOverlayOption[];
  hasAnyOptions: boolean;
};

type BoardTurnHeaderModel = {
  activePlayerName: string;
  interactionLabel: string;
  isArmed: boolean;
  tone: "action" | "power" | "neutral";
  stepLabel: string;
};

type ArmedPathModel = {
  tone: "move" | "charge";
  stepByHexId: Map<HexId, number>;
};

type ProfilePreviewModel = Map<FighterId, string[]>;

export default function PracticeBattlefieldApp() {
  const [game, setGame] = useState<Game>(() => createActionStepPracticeGame());
  const [, setRefreshTick] = useState(0);
  const [resultFlash, setResultFlash] = useState<BattlefieldResultFlash | null>(null);
  const [lastResolvedAction, setLastResolvedAction] = useState<BattlefieldResultFlash | null>(null);
  const boardProjection = projectBoard(game.board);
  const recentEvents = [...game.eventLog].slice(-10).reverse();
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
  const moveOptions = getMoveOptions(actionLens);
  const chargeOptions = getChargeOptions(game, actionLens);
  const [selectedMoveHexId, setSelectedMoveHexId] = useState<HexId | null>(null);
  const [selectedChargeKey, setSelectedChargeKey] = useState<string | null>(null);
  const [pendingMoveHexId, setPendingMoveHexId] = useState<HexId | null>(null);
  const [pendingDelveFeatureTokenId, setPendingDelveFeatureTokenId] = useState<FeatureTokenState["id"] | null>(null);
  const [pendingGuardFighterId, setPendingGuardFighterId] = useState<FighterId | null>(null);
  const [pendingPassPower, setPendingPassPower] = useState(false);
  const [pendingPowerOptionKey, setPendingPowerOptionKey] = useState<string | null>(null);
  const [pendingChargeHexId, setPendingChargeHexId] = useState<HexId | null>(null);
  const [pendingChargeTargetId, setPendingChargeTargetId] = useState<FighterId | null>(null);
  const [pendingAttackTargetId, setPendingAttackTargetId] = useState<FighterId | null>(null);
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
      : getChargeProfileForTarget(chargeProfiles, pendingChargeTargetId);
  const pendingChargeOption = pendingChargeProfile?.options.find((option) => option.key === pendingChargeProfile.selectedKey) ?? null;
  const pendingChargeBadgeLabel = pendingChargeOption?.label ?? null;
  const pendingAttackProfile =
    pendingAttackTargetId === null
      ? null
      : getAttackProfileForTarget(attackProfiles, pendingAttackTargetId);
  const pendingAttackTargetName = pendingAttackProfile?.targetName ?? (
    pendingAttackTargetId === null ? null : getFighterName(game, pendingAttackTargetId)
  );
  const pendingAttackOption = pendingAttackProfile?.options.find((option) => option.key === pendingAttackProfile.selectedKey) ?? null;
  const pendingAttackBadgeLabel = pendingAttackOption?.label ?? null;
  const latestCombat = game.getLatestRecord(GameRecordKind.Combat);
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
      ? pendingGuardFighterId !== null
        ? `Guard is armed for ${selectedFighterName}. Click Guard again to confirm, press Escape to cancel, or choose another action.`
        : pendingAttackTargetId !== null
        ? `${pendingAttackTargetName ?? pendingAttackTargetId} selected with ${pendingAttackOption?.label ?? "the current profile"}. Click the same crimson target again to confirm the attack, press Escape to cancel, or pick a different crimson target.`
        : pendingChargeTargetId !== null && pendingChargeHexId !== null
          ? `${pendingChargeTargetName ?? pendingChargeTargetId} selected from ${pendingChargeHexId} with ${pendingChargeOption?.label ?? "the current profile"}. Click the same red target again to confirm, press Escape to cancel, or pick a different target.`
          : pendingChargeHexId !== null
            ? `Charge from ${pendingChargeHexId} selected. Click a red target to arm it, or choose a charge profile below first.`
            : pendingMoveHexId !== null
            ? `Move to ${pendingMoveHexId} selected. Click the same teal hex again to confirm, press Escape to cancel, or choose another teal hex.`
            : "Select a fighter, then click a teal hex to move, click a gold hex and then a red target to charge, or click an amber charge target to auto-arm a charge."
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

  function clearPendingInteractions(): void {
    setPendingMoveHexId(null);
    setPendingDelveFeatureTokenId(null);
    setPendingGuardFighterId(null);
    setPendingPassPower(false);
    setPendingPowerOptionKey(null);
    setPendingChargeHexId(null);
    setPendingChargeTargetId(null);
    setPendingAttackTargetId(null);
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
      return;
    }

    applyAction(option.action);
  }

  useEffect(() => {
    if (
      pendingMoveHexId === null &&
      pendingDelveFeatureTokenId === null &&
      pendingGuardFighterId === null &&
      !pendingPassPower &&
      pendingPowerOptionKey === null &&
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
  }, [pendingMoveHexId, pendingDelveFeatureTokenId, pendingGuardFighterId, pendingPassPower, pendingPowerOptionKey, pendingChargeHexId, pendingChargeTargetId, pendingAttackTargetId]);

  useEffect(() => {
    if (resultFlash === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setResultFlash((current) => (current?.id === resultFlash.id ? null : current));
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [resultFlash]);

  function resetBattlefield(): void {
    const nextGame = createActionStepPracticeGame();
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

  return (
    <main className="battlefield-app-shell">
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

      <section className="battlefield-layout">
        <section className="battlefield-panel battlefield-board-panel">
          <div className="battlefield-heading">
            <p className="battlefield-eyebrow">Board Map</p>
            <h2>Centered Battlefield</h2>
            <p className="battlefield-copy">
              Blue territory belongs to Player One, ember territory belongs to Player Two,
              and the middle band stays neutral.
            </p>
          </div>

          <BoardMap
            game={game}
            activePlayerId={activePlayer?.id ?? null}
            selectedFighterId={selectedFighterId}
            selectedFeatureToken={selectedFeatureToken}
            actionLens={actionLens}
            pendingMoveHexId={pendingMoveHexId}
            pendingDelveFeatureTokenId={pendingDelveFeatureTokenId}
            pendingGuardFighterId={pendingGuardFighterId}
            pendingPassPower={pendingPassPower}
            pendingPowerOptionKey={pendingPowerOptionKey}
            pendingChargeHexId={pendingChargeHexId}
            pendingChargeTargetId={pendingChargeTargetId}
            pendingAttackTargetId={pendingAttackTargetId}
            pendingChargeBadgeLabel={pendingChargeBadgeLabel}
            pendingAttackBadgeLabel={pendingAttackBadgeLabel}
            powerOverlay={powerOverlay}
            boardTurnHeader={boardTurnHeader}
            recentCombatTargetId={recentCombatTargetId}
            attackPreviewByTarget={attackPreviewByTarget}
            chargePreviewByTarget={chargePreviewByTarget}
            armedPath={armedPath}
            lastResolvedAction={lastResolvedAction}
            resultFlash={resultFlash}
            onApplyPowerAction={selectPowerOption}
            onDelveSelectedFighter={delveSelectedFighter}
            onGuardSelectedFighter={guardSelectedFighter}
            onPassTurn={passTurn}
            onAttackTarget={attackTarget}
            onCancelPendingCharge={cancelPendingCharge}
            onCompleteChargeAgainstTarget={completeChargeAgainstTarget}
            onMoveToHex={moveToHex}
            onStartChargeAgainstTarget={startChargeAgainstTarget}
            onStartChargeToHex={startChargeToHex}
            onSelectFighter={selectFighter}
            positionedHexes={boardProjection.positionedHexes}
          />

          <div className="battlefield-legend-grid">
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-player-one" label="Player One territory" />
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-player-two" label="Player Two territory" />
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-neutral" label="Neutral hex" />
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-start" label="Starting hex" />
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-edge" label="Edge hex" />
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-feature" label="Feature token" />
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-move" label="Move destination" />
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-charge" label="Charge destination" />
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-target" label="Charge target" />
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-attack" label="Attack target" />
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-combat" label="Recent combat target" />
          </div>
        </section>

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
      </section>
    </main>
  );
}

function BoardMap({
  activePlayerId,
  actionLens,
  game,
  pendingMoveHexId,
  pendingDelveFeatureTokenId,
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
}: {
  activePlayerId: FighterState["ownerPlayerId"] | null;
  actionLens: FighterActionLens;
  game: Game;
  pendingMoveHexId: HexId | null;
  pendingDelveFeatureTokenId: FeatureTokenState["id"] | null;
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
}) {
  const width = Math.max(...positionedHexes.map((hex) => hex.left + hexWidth)) + boardPadding;
  const height = Math.max(...positionedHexes.map((hex) => hex.top + hexHeight)) + boardPadding;
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
    <div className="battlefield-board-frame">
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
      {(game.turnStep === TurnStep.Power && actionLens.passAction !== null) ||
      (game.turnStep === TurnStep.Power && actionLens.delveAction !== null && selectedFeatureToken !== null) ||
      (game.turnStep === TurnStep.Action && actionLens.guardAction !== null && selectedFighterName !== null) ? (
        <div className="battlefield-board-quick-actions">
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
      {game.turnStep === TurnStep.Power && powerOverlay.hasAnyOptions ? (
        <section className="battlefield-power-overlay">
          <div className="battlefield-power-overlay-header">
            <p className="battlefield-power-overlay-eyebrow">Power Window</p>
            <strong>Board-side power plays</strong>
          </div>
          {powerOverlay.warscrollAbilities.length === 0 ? null : (
            <div className="battlefield-power-overlay-section">
              <p className="battlefield-power-overlay-label">Warscroll</p>
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
          )}
          {powerOverlay.ploys.length === 0 ? null : (
            <div className="battlefield-power-overlay-section">
              <p className="battlefield-power-overlay-label">Ploys</p>
              <div className="battlefield-power-option-list">
                {powerOverlay.ploys.map((option) => (
                  <PowerOverlayOptionButton
                    key={option.key}
                    option={option}
                    isPending={pendingPowerOptionKey === option.key}
                    onSelect={onApplyPowerAction}
                    toneClassName="battlefield-power-option-ploy"
                  />
                ))}
              </div>
            </div>
          )}
          {powerOverlay.upgrades.length === 0 ? null : (
            <div className="battlefield-power-overlay-section">
              <p className="battlefield-power-overlay-label">Upgrades</p>
              <div className="battlefield-power-option-list">
                {powerOverlay.upgrades.map((option) => (
                  <PowerOverlayOptionButton
                    key={option.key}
                    option={option}
                    isPending={pendingPowerOptionKey === option.key}
                    onSelect={onApplyPowerAction}
                    toneClassName="battlefield-power-option-upgrade"
                  />
                ))}
              </div>
            </div>
          )}
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
        className="battlefield-board-map"
        style={{
          width: `${width}px`,
          height: `${height}px`,
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
          const isInteractiveHex =
            isSelectableFighter ||
            isClickableAttackTarget ||
            isClickableChargeTarget ||
            isClickableTargetFirstChargeTarget ||
            isClickableChargeDestination ||
            isClickableMoveDestination;
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
              <div className="battlefield-hex-meta-row">
                <span className="battlefield-hex-id">{compactHexId(hex.id)}</span>
                <div className="battlefield-hex-meta-tags">
                  {armedPathStep === null || armedPath === null ? null : (
                    <span className={`battlefield-hex-path-step battlefield-hex-path-step-${armedPath.tone}`}>
                      {armedPathStep}
                    </span>
                  )}
                  {hex.isStartingHex ? <span className="battlefield-hex-tag">start</span> : null}
                </div>
              </div>

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

              <div className="battlefield-hex-footer">
                <span>{formatTerritoryLabel(game, hex)}</span>
                <span>{formatHexKind(hex.kind)}</span>
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
  );
}

function PlayerPanel({
  activePlayerId,
  game,
  onSelectFighter,
  player,
  selectedFighterId,
}: {
  activePlayerId: PlayerState["id"] | null;
  game: Game;
  onSelectFighter: (fighterId: FighterId | null) => void;
  player: PlayerState;
  selectedFighterId: FighterId | null;
}) {
  const territoryName =
    player.territoryId === null ? "unclaimed" : game.board.getTerritory(player.territoryId)?.name ?? player.territoryId;
  const isActivePlayer = player.id === activePlayerId;

  return (
    <article className={`battlefield-warband-card ${getPlayerToneClass(player.id)}`}>
      <div className="battlefield-warband-header">
        <div>
          <p className="battlefield-eyebrow">{player.warband.name}</p>
          <h3>{player.name}</h3>
        </div>
        <span className="battlefield-warband-territory">{territoryName}</span>
      </div>

      <dl className="battlefield-warband-stats">
        <div>
          <dt>Glory</dt>
          <dd>{player.glory}</dd>
        </div>
        <div>
          <dt>Objectives</dt>
          <dd>{player.objectiveHand.length}</dd>
        </div>
        <div>
          <dt>Power</dt>
          <dd>{player.powerHand.length}</dd>
        </div>
        <div>
          <dt>Scored</dt>
          <dd>{player.scoredObjectives.length}</dd>
        </div>
      </dl>

      <div className="battlefield-fighter-list">
        {player.fighters.map((fighter) => {
          const definition = player.getFighterDefinition(fighter.id);
          const health = definition?.health ?? 0;
          const tokenTags = getFighterStatusTags(fighter);
          const isSelected = fighter.id === selectedFighterId;
          const isSelectable = isActivePlayer && !fighter.isSlain && fighter.currentHexId !== null;

          return (
            <article
              key={fighter.id}
              className={[
                "battlefield-fighter-card",
                isSelectable ? "battlefield-fighter-card-selectable" : "",
                isSelected ? "battlefield-fighter-card-selected" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => {
                if (isSelectable) {
                  onSelectFighter(fighter.id);
                }
              }}
            >
              <div className="battlefield-fighter-card-header">
                <div>
                  <h4>{definition?.name ?? fighter.id}</h4>
                  <p className="battlefield-fighter-meta">{fighter.currentHexId ?? "off-board"}</p>
                </div>
                <span className="battlefield-fighter-health">
                  {fighter.damage}/{health}
                </span>
              </div>
              <p className="battlefield-fighter-meta">
                Move {definition?.move ?? "-"} | Save {definition?.saveDice ?? "-"} {definition?.saveSymbol ?? ""}
              </p>
              <div className="battlefield-weapon-list">
                {definition?.weapons.length ? (
                  definition.weapons.map((weapon) => (
                    <div key={weapon.id} className="battlefield-weapon-card">
                      <div className="battlefield-weapon-header">
                        <strong>{weapon.name}</strong>
                        <span className="battlefield-weapon-damage">Dmg {weapon.damage}</span>
                      </div>
                      <p className="battlefield-weapon-profile">
                        Range {weapon.range} | {weapon.dice} dice | {formatWeaponAccuracy(weapon.accuracy)}
                      </p>
                      {weapon.abilities.length === 0 ? null : (
                        <div className="battlefield-fighter-chip-row">
                          {weapon.abilities.map((ability) => (
                            <span key={ability.displayName} className="battlefield-fighter-chip">
                              {ability.displayName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="battlefield-weapon-empty">No weapons</p>
                )}
              </div>
              <div className="battlefield-fighter-chip-row">
                {tokenTags.length === 0 ? (
                  <span className="battlefield-fighter-chip battlefield-fighter-chip-idle">ready</span>
                ) : (
                  tokenTags.map((tag) => (
                    <span key={tag} className="battlefield-fighter-chip">
                      {tag}
                    </span>
                  ))
                )}
              </div>
            </article>
          );
        })}
      </div>
    </article>
  );
}

function LegendItem({
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

function projectBoard(board: BoardState): { positionedHexes: PositionedHex[] } {
  const rawHexes = board.hexes.map((hex) => {
    const centerX = hexRadius * Math.sqrt(3) * (hex.q + hex.r / 2);
    const centerY = hexRadius * 1.5 * hex.r;

    return {
      hex,
      left: centerX - hexWidth / 2,
      top: centerY - hexHeight / 2,
    };
  });

  const minLeft = Math.min(...rawHexes.map((hex) => hex.left));
  const minTop = Math.min(...rawHexes.map((hex) => hex.top));

  return {
    positionedHexes: rawHexes.map((hex) => ({
      ...hex,
      left: hex.left - minLeft + boardPadding,
      top: hex.top - minTop + boardPadding,
    })),
  };
}

function getHexClassName(
  game: Game,
  hex: HexCell,
  state: {
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
  },
): string {
  const territoryOwnerId =
    hex.territoryId === null ? null : game.board.getTerritory(hex.territoryId)?.ownerPlayerId ?? null;

  const classes = ["battlefield-map-hex"];
  if (hex.territoryId === null) {
    classes.push("battlefield-map-hex-neutral");
  } else if (territoryOwnerId === "player:one") {
    classes.push("battlefield-map-hex-player-one");
  } else if (territoryOwnerId === "player:two") {
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

  return classes.join(" ");
}

function formatWeaponAccuracy(accuracy: string): string {
  return accuracy.charAt(0).toUpperCase() + accuracy.slice(1);
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

function getFighterActionLens(
  game: Game,
  activePlayer: PlayerState | null,
  selectedFighterId: FighterId | null,
  legalActions: GameAction[],
): FighterActionLens {
  const passAction = legalActions.find(
    (action): action is PassAction => action instanceof PassAction,
  ) ?? null;

  if (activePlayer === null || selectedFighterId === null) {
    return createEmptyActionLens(passAction);
  }

  const fighter = activePlayer.getFighter(selectedFighterId) ?? null;
  if (fighter === null) {
    return createEmptyActionLens(passAction);
  }

  const attackActions = legalActions.filter(
    (action): action is AttackAction => action instanceof AttackAction && action.attackerId === selectedFighterId,
  );
  const moveActions = legalActions.filter(
    (action): action is MoveAction => action instanceof MoveAction && action.fighterId === selectedFighterId,
  );
  const chargeActions = legalActions.filter(
    (action): action is ChargeAction => action instanceof ChargeAction && action.fighterId === selectedFighterId,
  );
  const delveAction = legalActions.find(
    (action): action is DelveAction => action instanceof DelveAction && action.fighterId === selectedFighterId,
  ) ?? null;
  const guardAction = legalActions.find(
    (action): action is GuardAction => action instanceof GuardAction && action.fighterId === selectedFighterId,
  ) ?? null;

  const attackTargetIds = new Set<FighterId>(attackActions.map((action) => action.targetId));
  const attackTargetHexIds = new Set<HexId>(
    [...attackTargetIds].flatMap((fighterId) => {
      const target = game.getFighter(fighterId);
      return target?.currentHexId === null || target?.currentHexId === undefined
        ? []
        : [target.currentHexId];
    }),
  );
  const moveHexIds = new Set<HexId>(
    moveActions.flatMap((action) => {
      const destinationHexId = action.path[action.path.length - 1];
      return destinationHexId === undefined ? [] : [destinationHexId];
    }),
  );
  const chargeHexIds = new Set<HexId>(
    chargeActions.flatMap((action) => {
      const destinationHexId = action.path[action.path.length - 1];
      return destinationHexId === undefined ? [] : [destinationHexId];
    }),
  );
  const chargeTargetIds = new Set<FighterId>(chargeActions.map((action) => action.targetId));
  const chargeTargetHexIds = new Set<HexId>(
    [...chargeTargetIds].flatMap((fighterId) => {
      const target = game.getFighter(fighterId);
      return target?.currentHexId === null || target?.currentHexId === undefined
        ? []
        : [target.currentHexId];
    }),
  );
  const uniqueChargeOptions = new Set(
    chargeActions.flatMap((action) => {
      const destinationHexId = action.path[action.path.length - 1];
      return destinationHexId === undefined ? [] : [`${destinationHexId}:${action.targetId}`];
    }),
  );

  return {
    fighter,
    attackTargetHexIds,
    attackTargetIds,
    moveHexIds,
    chargeHexIds,
    chargeTargetHexIds,
    chargeTargetIds,
    attackActions,
    moveActions,
    chargeActions,
    delveAction,
    guardAction,
    passAction,
    attackCount: attackTargetIds.size,
    moveCount: moveHexIds.size,
    chargeCount: uniqueChargeOptions.size,
    delveAvailable: delveAction !== null,
    guardAvailable: guardAction !== null,
  };
}

function buildBattlefieldResultFlash(
  game: Game,
  action: BattlefieldAppAction,
): BattlefieldResultFlash | null {
  const detail = game.eventLog[game.eventLog.length - 1];
  if (detail === undefined) {
    return null;
  }

  if (action instanceof MoveAction) {
    const destinationHexId = action.path[action.path.length - 1];
    return {
      id: Date.now(),
      tone: "move",
      title: `Moved to ${destinationHexId === undefined ? "destination" : compactHexId(destinationHexId)}`,
      detail,
    };
  }

  if (action instanceof AttackAction) {
    const combatResult = game.getLatestRecord(GameRecordKind.Combat);
    if (combatResult === null) {
      return null;
    }

    return {
      id: Date.now(),
      tone: "attack",
      title: buildCombatFlashTitle("attack", combatResult.damageInflicted, combatResult.outcome, combatResult.targetSlain),
      detail,
    };
  }

  if (action instanceof ChargeAction) {
    const combatResult = game.getLatestRecord(GameRecordKind.Combat);
    if (combatResult === null) {
      return null;
    }

    return {
      id: Date.now(),
      tone: "charge",
      title: buildCombatFlashTitle("charge", combatResult.damageInflicted, combatResult.outcome, combatResult.targetSlain),
      detail,
    };
  }

  if (action instanceof DelveAction) {
    const delveResult = game.getLatestRecord(GameRecordKind.Delve);
    return {
      id: Date.now(),
      tone: "power",
      title: delveResult === null
        ? "Delved feature token"
        : `Delved to ${formatFeatureTokenSide(delveResult.sideAfterDelve)}`,
      detail,
    };
  }

  if (action instanceof PlayPloyAction) {
    const player = game.getPlayer(action.playerId);
    const cardWithDefinition = player?.getCardWithDefinition(action.cardId);
    return {
      id: Date.now(),
      tone: "power",
      title: `Played ${cardWithDefinition?.definition.name ?? "ploy"}`,
      detail,
    };
  }

  if (action instanceof PlayUpgradeAction) {
    const player = game.getPlayer(action.playerId);
    const cardWithDefinition = player?.getCardWithDefinition(action.cardId);
    return {
      id: Date.now(),
      tone: "power",
      title: `Equipped ${cardWithDefinition?.definition.name ?? "upgrade"}`,
      detail,
    };
  }

  if (action instanceof UseWarscrollAbilityAction) {
    const player = game.getPlayer(action.playerId);
    const ability = player?.getWarscrollDefinition()?.getAbility(action.abilityIndex);
    return {
      id: Date.now(),
      tone: "power",
      title: `Used ${ability?.name ?? "warscroll ability"}`,
      detail,
    };
  }

  return null;
}

function buildCombatFlashTitle(
  actionLabel: "attack" | "charge",
  damageInflicted: number,
  outcome: CombatResult["outcome"],
  targetSlain: boolean,
): string {
  const capitalizedAction = actionLabel[0].toUpperCase() + actionLabel.slice(1);

  if (targetSlain) {
    return `${capitalizedAction} slew target`;
  }

  if (outcome === "success") {
    return damageInflicted === 0
      ? `${capitalizedAction} landed`
      : `${capitalizedAction} hit for ${damageInflicted}`;
  }

  if (outcome === "draw") {
    return `${capitalizedAction} drawn`;
  }

  return `${capitalizedAction} missed`;
}

function getPowerOverlayOptionByKey(
  powerOverlay: PowerOverlayModel,
  key: string,
): PowerOverlayOption | null {
  return [
    ...powerOverlay.warscrollAbilities,
    ...powerOverlay.ploys,
    ...powerOverlay.upgrades,
  ].find((option) => option.key === key) ?? null;
}

function getBoardTurnHeaderModel({
  activePlayerName,
  game,
  pendingAttackBadgeLabel,
  pendingAttackTargetName,
  pendingChargeBadgeLabel,
  pendingChargeHexId,
  pendingChargeTargetName,
  pendingDelveFeatureTokenId,
  pendingGuardFighterId,
  pendingMoveHexId,
  pendingPassPower,
  pendingPowerOption,
  selectedFighterName,
  selectedFeatureToken,
}: {
  activePlayerName: string;
  game: Game;
  pendingAttackBadgeLabel: string | null;
  pendingAttackTargetName: string | null;
  pendingChargeBadgeLabel: string | null;
  pendingChargeHexId: HexId | null;
  pendingChargeTargetName: string | null;
  pendingDelveFeatureTokenId: FeatureTokenState["id"] | null;
  pendingGuardFighterId: FighterId | null;
  pendingMoveHexId: HexId | null;
  pendingPassPower: boolean;
  pendingPowerOption: PowerOverlayOption | null;
  selectedFighterName: string;
  selectedFeatureToken: FeatureTokenState | null;
}): BoardTurnHeaderModel {
  if (game.turnStep === TurnStep.Action) {
    if (pendingGuardFighterId !== null) {
      return {
        activePlayerName,
        interactionLabel: `Guard is armed for ${selectedFighterName}`,
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
      };
    }

    if (pendingAttackTargetName !== null) {
      return {
        activePlayerName,
        interactionLabel:
          pendingAttackBadgeLabel === null
            ? `Attack ${pendingAttackTargetName}`
            : `Attack ${pendingAttackTargetName} with ${pendingAttackBadgeLabel}`,
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
      };
    }

    if (pendingChargeTargetName !== null && pendingChargeHexId !== null) {
      return {
        activePlayerName,
        interactionLabel:
          pendingChargeBadgeLabel === null
            ? `Charge from ${compactHexId(pendingChargeHexId)} into ${pendingChargeTargetName}`
            : `Charge ${pendingChargeTargetName} from ${compactHexId(pendingChargeHexId)} with ${pendingChargeBadgeLabel}`,
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
      };
    }

    if (pendingChargeHexId !== null) {
      return {
        activePlayerName,
        interactionLabel: `Charge path armed at ${compactHexId(pendingChargeHexId)}`,
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
      };
    }

    if (pendingMoveHexId !== null) {
      return {
        activePlayerName,
        interactionLabel: `Move armed to ${compactHexId(pendingMoveHexId)}`,
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
      };
    }

    return {
      activePlayerName,
      interactionLabel: "Choose move, charge, guard, or attack.",
      isArmed: false,
      stepLabel: "Action Step",
      tone: "action",
    };
  }

  if (game.turnStep === TurnStep.Power) {
    if (pendingDelveFeatureTokenId !== null && selectedFeatureToken?.id === pendingDelveFeatureTokenId) {
      return {
        activePlayerName,
        interactionLabel: `Delve ${getFeatureTokenBadge(selectedFeatureToken)} is armed`,
        isArmed: true,
        stepLabel: "Power Step",
        tone: "power",
      };
    }

    if (pendingPassPower) {
      return {
        activePlayerName,
        interactionLabel: "Pass Power is armed",
        isArmed: true,
        stepLabel: "Power Step",
        tone: "power",
      };
    }

    if (pendingPowerOption !== null) {
      return {
        activePlayerName,
        interactionLabel: `${pendingPowerOption.title} is armed`,
        isArmed: true,
        stepLabel: "Power Step",
        tone: "power",
      };
    }

    return {
      activePlayerName,
      interactionLabel: "Choose a power play, delve, or pass.",
      isArmed: false,
      stepLabel: "Power Step",
      tone: "power",
    };
  }

  return {
    activePlayerName,
    interactionLabel: "Board is waiting for the next step.",
    isArmed: false,
    stepLabel: "Board State",
    tone: "neutral",
  };
}

function getPowerOverlayModel(
  game: Game,
  activePlayer: PlayerState | null,
  legalActions: GameAction[],
): PowerOverlayModel {
  if (activePlayer === null || game.turnStep !== TurnStep.Power) {
    return {
      ploys: [],
      upgrades: [],
      warscrollAbilities: [],
      hasAnyOptions: false,
    };
  }

  const ploys = legalActions.flatMap((action) => {
    if (!(action instanceof PlayPloyAction)) {
      return [];
    }

    const cardWithDefinition = activePlayer.getCardWithDefinition(action.cardId);
    if (cardWithDefinition === undefined) {
      return [];
    }

    return [{
      key: `ploy:${action.cardId}:${action.targetFighterId ?? "none"}`,
      title: cardWithDefinition.definition.name,
      detail:
        action.targetFighterId === null
          ? cardWithDefinition.definition.text || "Play this ploy."
          : `Target ${getFighterName(game, action.targetFighterId)}`,
      action,
    }];
  });

  const upgrades = legalActions.flatMap((action) => {
    if (!(action instanceof PlayUpgradeAction)) {
      return [];
    }

    const cardWithDefinition = activePlayer.getCardWithDefinition(action.cardId);
    if (cardWithDefinition === undefined) {
      return [];
    }

    return [{
      key: `upgrade:${action.cardId}:${action.fighterId}`,
      title: cardWithDefinition.definition.name,
      detail: `Attach to ${getFighterName(game, action.fighterId)} • ${cardWithDefinition.definition.gloryValue} glory`,
      action,
    }];
  });

  const warscrollAbilities = legalActions.flatMap((action) => {
    if (!(action instanceof UseWarscrollAbilityAction)) {
      return [];
    }

    const ability = activePlayer.getWarscrollDefinition()?.getAbility(action.abilityIndex);
    if (ability === undefined) {
      return [];
    }

    return [{
      key: `warscroll:${action.abilityIndex}`,
      title: ability.name,
      detail: ability.text,
      action,
    }];
  });

  return {
    ploys,
    upgrades,
    warscrollAbilities,
    hasAnyOptions: ploys.length > 0 || upgrades.length > 0 || warscrollAbilities.length > 0,
  };
}

function createEmptyActionLens(passAction: PassAction | null): FighterActionLens {
  return {
    fighter: null,
    attackTargetHexIds: new Set<HexId>(),
    attackTargetIds: new Set<FighterId>(),
    moveHexIds: new Set<HexId>(),
    chargeHexIds: new Set<HexId>(),
    chargeTargetHexIds: new Set<HexId>(),
    chargeTargetIds: new Set<FighterId>(),
    attackActions: [],
    moveActions: [],
    chargeActions: [],
    delveAction: null,
    guardAction: null,
    passAction,
    attackCount: 0,
    moveCount: 0,
    chargeCount: 0,
    delveAvailable: false,
    guardAvailable: false,
  };
}

function getMoveOptions(actionLens: FighterActionLens): Array<{
  action: MoveAction;
  hexId: HexId;
  label: string;
}> {
  return actionLens.moveActions
    .flatMap((action) => {
      const destinationHexId = action.path[action.path.length - 1];
      return destinationHexId === undefined
        ? []
        : [{
          action,
          hexId: destinationHexId,
          label: `Move to ${destinationHexId} (${action.path.length} step${action.path.length === 1 ? "" : "s"})`,
        }];
    })
    .sort((left, right) => left.hexId.localeCompare(right.hexId));
}

function getMoveActionForHex(actionLens: FighterActionLens, hexId: HexId): MoveAction | null {
  let bestAction: MoveAction | null = null;

  for (const action of actionLens.moveActions) {
    const destinationHexId = action.path[action.path.length - 1];
    if (destinationHexId !== hexId) {
      continue;
    }

    if (bestAction === null || action.path.length < bestAction.path.length) {
      bestAction = action;
    }
  }

  return bestAction;
}

function getChargePreviewActionForHex(
  actionLens: FighterActionLens,
  hexId: HexId,
): ChargeAction | null {
  let bestAction: ChargeAction | null = null;

  for (const action of getChargeActionsForHex(actionLens, hexId)) {
    if (
      bestAction === null ||
      action.path.length < bestAction.path.length ||
      (action.path.length === bestAction.path.length &&
        bestAction.selectedAbility !== null &&
        action.selectedAbility === null)
    ) {
      bestAction = action;
    }
  }

  return bestAction;
}

function getChargeActionsForHex(actionLens: FighterActionLens, hexId: HexId): ChargeAction[] {
  return actionLens.chargeActions.filter((action) => action.path[action.path.length - 1] === hexId);
}

function getChargeTargetIdsForHex(
  actionLens: FighterActionLens,
  hexId: HexId | null,
): Set<FighterId> {
  if (hexId === null) {
    return actionLens.chargeTargetIds;
  }

  return new Set(getChargeActionsForHex(actionLens, hexId).map((action) => action.targetId));
}

function getChargeTargetHexIdsForHex(
  game: Game,
  actionLens: FighterActionLens,
  hexId: HexId | null,
): Set<HexId> {
  const targetIds = getChargeTargetIdsForHex(actionLens, hexId);

  return new Set(
    [...targetIds].flatMap((fighterId) => {
      const target = game.getFighter(fighterId);
      return target?.currentHexId === null || target?.currentHexId === undefined
        ? []
        : [target.currentHexId];
    }),
  );
}

function getChargeDestinationHexIdsForTarget(
  actionLens: FighterActionLens,
  targetId: FighterId | null,
): Set<HexId> {
  if (targetId === null) {
    return new Set();
  }

  return new Set(
    actionLens.chargeActions.flatMap((action) => {
      if (action.targetId !== targetId) {
        return [];
      }

      const destinationHexId = action.path[action.path.length - 1];
      return destinationHexId === undefined ? [] : [destinationHexId];
    }),
  );
}

function getPreferredChargeDestinationForTarget(
  actionLens: FighterActionLens,
  targetId: FighterId,
): HexId | null {
  let bestAction: ChargeAction | null = null;

  for (const action of actionLens.chargeActions) {
    if (action.targetId !== targetId) {
      continue;
    }

    const destinationHexId = action.path[action.path.length - 1];
    if (destinationHexId === undefined) {
      continue;
    }

    const bestDestinationHexId = bestAction?.path[bestAction.path.length - 1];
    if (
      bestAction === null ||
      action.path.length < bestAction.path.length ||
      (action.path.length === bestAction.path.length &&
        bestAction.selectedAbility !== null &&
        action.selectedAbility === null) ||
      (action.path.length === bestAction.path.length &&
        bestAction.selectedAbility === action.selectedAbility &&
        bestDestinationHexId !== undefined &&
        destinationHexId.localeCompare(bestDestinationHexId) < 0)
    ) {
      bestAction = action;
    }
  }

  return bestAction?.path[bestAction.path.length - 1] ?? null;
}

function getChargeActionForTarget(
  actionLens: FighterActionLens,
  hexId: HexId | null,
  targetId: FighterId,
  preferredChargeKey: string | null = null,
): ChargeAction | null {
  if (hexId === null) {
    return null;
  }

  if (preferredChargeKey !== null) {
    const preferredAction = getChargeActionsForHex(actionLens, hexId).find(
      (action) => action.targetId === targetId && getChargeActionKey(action) === preferredChargeKey,
    );
    if (preferredAction !== undefined) {
      return preferredAction;
    }
  }

  let bestAction: ChargeAction | null = null;

  for (const action of getChargeActionsForHex(actionLens, hexId)) {
    if (action.targetId !== targetId) {
      continue;
    }

    if (bestAction === null || (bestAction.selectedAbility !== null && action.selectedAbility === null)) {
      bestAction = action;
    }
  }

  return bestAction;
}

function getChargeActionKey(action: ChargeAction): string {
  const destinationHexId = action.path[action.path.length - 1] ?? "unknown";
  return `${action.fighterId}:${destinationHexId}:${action.targetId}:${action.weaponId}:${action.selectedAbility ?? "base"}`;
}

function getChargePairKey(
  destinationHexId: HexId,
  targetId: FighterId,
): string {
  return `${destinationHexId}:${targetId}`;
}

function getSelectedChargeKeyForPair(
  selectedChargeKeysByPair: Record<string, string>,
  destinationHexId: HexId,
  targetId: FighterId,
): string | null {
  return selectedChargeKeysByPair[getChargePairKey(destinationHexId, targetId)] ?? null;
}

function getAttackActionForTarget(
  actionLens: FighterActionLens,
  targetId: FighterId,
  preferredAttackKey: string | null = null,
): AttackAction | null {
  if (preferredAttackKey !== null) {
    const preferredAction = actionLens.attackActions.find(
      (action) => action.targetId === targetId && getAttackActionKey(action) === preferredAttackKey,
    );
    if (preferredAction !== undefined) {
      return preferredAction;
    }
  }

  let bestAction: AttackAction | null = null;

  for (const action of actionLens.attackActions) {
    if (action.targetId !== targetId) {
      continue;
    }

    if (bestAction === null || (bestAction.selectedAbility !== null && action.selectedAbility === null)) {
      bestAction = action;
    }
  }

  return bestAction;
}

function getAttackActionKey(action: AttackAction): string {
  return `${action.attackerId}:${action.targetId}:${action.weaponId}:${action.selectedAbility ?? "base"}`;
}

function getSelectedAttackKeyForTarget(
  selectedAttackKeysByTarget: Record<string, string>,
  targetId: FighterId,
): string | null {
  return selectedAttackKeysByTarget[targetId] ?? null;
}

function getArmedPathModel(
  actionLens: FighterActionLens,
  pendingMoveHexId: HexId | null,
  pendingChargeHexId: HexId | null,
  pendingChargeTargetId: FighterId | null,
  selectedChargeKeysByPair: Record<string, string>,
): ArmedPathModel | null {
  const moveAction =
    pendingMoveHexId === null ? null : getMoveActionForHex(actionLens, pendingMoveHexId);

  if (moveAction !== null) {
    return {
      tone: "move",
      stepByHexId: new Map(moveAction.path.map((hexId, index) => [hexId, index + 1])),
    };
  }

  if (pendingChargeHexId === null) {
    return null;
  }

  const selectedChargeAction =
    pendingChargeTargetId === null
      ? getChargePreviewActionForHex(actionLens, pendingChargeHexId)
      : getChargeActionForTarget(
          actionLens,
          pendingChargeHexId,
          pendingChargeTargetId,
          getSelectedChargeKeyForPair(selectedChargeKeysByPair, pendingChargeHexId, pendingChargeTargetId),
        );

  if (selectedChargeAction === null) {
    return null;
  }

  return {
    tone: "charge",
    stepByHexId: new Map(selectedChargeAction.path.map((hexId, index) => [hexId, index + 1])),
  };
}

function getAttackPreviewByTarget(
  attackProfiles: AttackProfileSummary[],
): ProfilePreviewModel {
  return new Map(
    attackProfiles.map((profile) => {
      const labels = [...new Set(profile.options.map((option) => formatProfilePreviewLabel(option.label)))];
      return [profile.targetId, labels];
    }),
  );
}

function getChargePreviewByTarget(
  activePlayer: PlayerState | null,
  actionLens: FighterActionLens,
): ProfilePreviewModel {
  if (activePlayer === null || actionLens.fighter === null || actionLens.chargeActions.length === 0) {
    return new Map();
  }

  const labelsByTarget = new Map<FighterId, Set<string>>();

  for (const action of actionLens.chargeActions) {
    const label = formatProfilePreviewLabel(
      describeWeaponProfile(activePlayer, action.fighterId, action.weaponId, action.selectedAbility).label,
    );
    const existingLabels = labelsByTarget.get(action.targetId);
    if (existingLabels === undefined) {
      labelsByTarget.set(action.targetId, new Set([label]));
    } else {
      existingLabels.add(label);
    }
  }

  return new Map(
    [...labelsByTarget.entries()].map(([targetId, labels]) => [targetId, [...labels]]),
  );
}

function formatProfilePreviewLabel(label: string): string {
  const abilityMarker = " using ";
  const compactLabel =
    label.includes(abilityMarker)
      ? label.slice(label.indexOf(abilityMarker) + abilityMarker.length)
      : label;

  return compactLabel.length <= 16 ? compactLabel : `${compactLabel.slice(0, 15)}…`;
}

function getAttackProfiles(
  game: Game,
  activePlayer: PlayerState | null,
  actionLens: FighterActionLens,
  selectedAttackKeysByTarget: Record<string, string>,
): AttackProfileSummary[] {
  if (activePlayer === null || actionLens.fighter === null || actionLens.attackActions.length === 0) {
    return [];
  }

  const actionsByTarget = new Map<FighterId, AttackAction[]>();
  for (const action of actionLens.attackActions) {
    const existingActions = actionsByTarget.get(action.targetId);
    if (existingActions === undefined) {
      actionsByTarget.set(action.targetId, [action]);
    } else {
      existingActions.push(action);
    }
  }

  return [...actionsByTarget.entries()].map(([targetId, actions]) => {
    const defaultAction = getAttackActionForTarget(actionLens, targetId) ?? actions[0];
    const selectedAction = getAttackActionForTarget(
      actionLens,
      targetId,
      getSelectedAttackKeyForTarget(selectedAttackKeysByTarget, targetId),
    ) ?? defaultAction;

    return {
      targetId,
      targetName: getFighterName(game, targetId),
      defaultKey: getAttackActionKey(defaultAction),
      selectedKey: getAttackActionKey(selectedAction),
      options: actions.map((action) => {
        const description = describeAttackAction(activePlayer, action);
        return {
          key: getAttackActionKey(action),
          label: description.label,
          stats: description.stats,
          isDefault: action === defaultAction,
        };
      }),
    };
  });
}

function getAttackProfileForTarget(
  attackProfiles: AttackProfileSummary[],
  targetId: FighterId,
): AttackProfileSummary | null {
  return attackProfiles.find((profile) => profile.targetId === targetId) ?? null;
}

function getChargeProfiles(
  game: Game,
  activePlayer: PlayerState | null,
  actionLens: FighterActionLens,
  destinationHexId: HexId | null,
  selectedChargeKeysByPair: Record<string, string>,
): ChargeProfileSummary[] {
  if (
    activePlayer === null ||
    actionLens.fighter === null ||
    destinationHexId === null
  ) {
    return [];
  }

  const chargeActions = getChargeActionsForHex(actionLens, destinationHexId);
  if (chargeActions.length === 0) {
    return [];
  }

  const actionsByTarget = new Map<FighterId, ChargeAction[]>();
  for (const action of chargeActions) {
    const existingActions = actionsByTarget.get(action.targetId);
    if (existingActions === undefined) {
      actionsByTarget.set(action.targetId, [action]);
    } else {
      existingActions.push(action);
    }
  }

  return [...actionsByTarget.entries()].map(([targetId, actions]) => {
    const defaultAction = getChargeActionForTarget(actionLens, destinationHexId, targetId) ?? actions[0];
    const selectedAction = getChargeActionForTarget(
      actionLens,
      destinationHexId,
      targetId,
      getSelectedChargeKeyForPair(selectedChargeKeysByPair, destinationHexId, targetId),
    ) ?? defaultAction;

    return {
      targetId,
      targetName: getFighterName(game, targetId),
      defaultKey: getChargeActionKey(defaultAction),
      selectedKey: getChargeActionKey(selectedAction),
      options: actions.map((action) => {
        const description = describeWeaponProfile(activePlayer, action.fighterId, action.weaponId, action.selectedAbility);
        return {
          key: getChargeActionKey(action),
          label: description.label,
          stats: description.stats,
          isDefault: action === defaultAction,
        };
      }),
    };
  });
}

function getChargeProfileForTarget(
  chargeProfiles: ChargeProfileSummary[],
  targetId: FighterId,
): ChargeProfileSummary | null {
  return chargeProfiles.find((profile) => profile.targetId === targetId) ?? null;
}

function describeAttackAction(
  player: PlayerState,
  action: AttackAction,
): {
  label: string;
  stats: string;
} {
  return describeWeaponProfile(player, action.attackerId, action.weaponId, action.selectedAbility);
}

function describeWeaponProfile(
  player: PlayerState,
  fighterId: FighterId,
  weaponId: string,
  selectedAbility: AttackAction["selectedAbility"] | ChargeAction["selectedAbility"],
): {
  label: string;
  stats: string;
} {
  const weapon = player.getFighterWeaponDefinition(fighterId, weaponId);
  if (weapon === undefined) {
    return {
      label: weaponId,
      stats: "",
    };
  }

  const selectedWeaponAbility = weapon.getAbility(selectedAbility);
  return {
    label: selectedWeaponAbility === null ? weapon.name : `${weapon.name} using ${selectedWeaponAbility.displayName}`,
    stats: `Range ${weapon.range} | ${weapon.dice} dice | ${formatWeaponAccuracy(weapon.accuracy)} | Dmg ${weapon.damage}`,
  };
}

function getChargeOptions(
  game: Game,
  actionLens: FighterActionLens,
): Array<{
  action: ChargeAction;
  key: string;
  label: string;
}> {
  const byKey = new Map<string, ChargeAction>();

  for (const action of actionLens.chargeActions) {
    const destinationHexId = action.path[action.path.length - 1];
    if (destinationHexId === undefined) {
      continue;
    }

    const key = `${destinationHexId}:${action.targetId}`;
    const existingAction = byKey.get(key);
    if (existingAction === undefined || (existingAction.selectedAbility !== null && action.selectedAbility === null)) {
      byKey.set(key, action);
    }
  }

  return [...byKey.entries()]
    .map(([key, action]) => {
      const destinationHexId = action.path[action.path.length - 1];
      const targetName = getFighterName(game, action.targetId);
      return destinationHexId === undefined
        ? null
        : {
          action,
          key,
          label: `Charge to ${destinationHexId} vs ${targetName}`,
        };
    })
    .filter((option): option is {
      action: ChargeAction;
      key: string;
      label: string;
    } => option !== null)
    .sort((left, right) => left.label.localeCompare(right.label));
}

function getDefaultSelectableFighterId(game: Game): FighterId | null {
  const activePlayerId = game.activePlayerId;
  if (activePlayerId === null) {
    return null;
  }

  const activePlayer = game.getPlayer(activePlayerId);
  return activePlayer?.fighters.find((fighter) => !fighter.isSlain && fighter.currentHexId !== null)?.id ?? null;
}

function getNextSelectedFighterId(
  game: Game,
  previousActivePlayerId: PlayerState["id"] | null,
  previousSelectedFighterId: FighterId | null,
): FighterId | null {
  if (
    game.activePlayerId !== null &&
    game.activePlayerId === previousActivePlayerId &&
    previousSelectedFighterId !== null
  ) {
    const activePlayer = game.getPlayer(game.activePlayerId);
    const fighter = activePlayer?.getFighter(previousSelectedFighterId);
    if (fighter !== undefined && !fighter.isSlain && fighter.currentHexId !== null) {
      return fighter.id;
    }
  }

  return getDefaultSelectableFighterId(game);
}

function buildHexTitle(
  game: Game,
  hex: HexCell,
  fighter: FighterState | null,
  featureToken: FeatureTokenState | null,
): string {
  const parts = [hex.id, formatTerritoryLabel(game, hex)];

  if (hex.isStartingHex) {
    parts.push("starting hex");
  }

  if (hex.isEdgeHex) {
    parts.push("edge hex");
  }

  if (hex.kind !== HexKind.Empty) {
    parts.push(hex.kind);
  }

  if (featureToken !== null) {
    parts.push(`${featureToken.id} ${featureToken.side}`);
  }

  if (fighter !== null) {
    parts.push(getFighterName(game, fighter.id));
  }

  return parts.join(" | ");
}

function formatTerritoryLabel(game: Game, hex: HexCell): string {
  if (hex.territoryId === null) {
    return "neutral";
  }

  const territory = game.board.getTerritory(hex.territoryId);
  return territory?.name ?? hex.territoryId;
}

function formatHexKind(kind: HexKind): string {
  return kind === HexKind.Empty ? "open" : kind;
}

function compactHexId(hexId: string): string {
  return hexId.replace("hex:", "");
}

function getFeatureTokenBadge(featureToken: FeatureTokenState): string {
  const prefix =
    featureToken.side === FeatureTokenSide.Hidden
      ? "H"
      : featureToken.side === FeatureTokenSide.Treasure
        ? "T"
        : "C";

  return `${prefix}${featureToken.value}`;
}

function formatFeatureTokenSide(side: FeatureTokenSide): string {
  return side === FeatureTokenSide.Hidden ? "hidden" : side;
}

function getPlayerToneClass(playerId: string): string {
  return playerId === "player:one" ? "battlefield-tone-player-one" : "battlefield-tone-player-two";
}

function getFighterName(game: Game, fighterId: string): string {
  const fighter = game.getFighter(fighterId);
  if (fighter === undefined) {
    return fighterId;
  }

  const player = game.getPlayer(fighter.ownerPlayerId);
  return player?.getFighterDefinition(fighter.id)?.name ?? fighter.id;
}

function getFighterMapLabel(game: Game, fighter: FighterState): string {
  const player = game.getPlayer(fighter.ownerPlayerId);
  const fighterName = player?.getFighterDefinition(fighter.id)?.name ?? fighter.id;
  const numericSuffix = fighterName.match(/(\d+)$/);
  if (numericSuffix !== null) {
    return `F${numericSuffix[1]}`;
  }

  return fighterName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getFighterStatusTags(fighter: FighterState): string[] {
  const tags: string[] = [];

  if (fighter.hasMoveToken) {
    tags.push("move");
  }

  if (fighter.hasChargeToken) {
    tags.push("charge");
  }

  if (fighter.hasGuardToken) {
    tags.push("guard");
  }

  if (fighter.hasStaggerToken) {
    tags.push("stagger");
  }

  if (fighter.upgradeCardIds.length > 0) {
    tags.push(`upgrades ${fighter.upgradeCardIds.length}`);
  }

  if (fighter.isInspired) {
    tags.push("inspired");
  }

  if (fighter.isSlain) {
    tags.push("slain");
  }

  return tags;
}

function createActionStepPracticeGame(): Game {
  const game = createCombatReadySetupPracticeGame("game:setup-practice:map-action-step");
  const engine = new GameEngine();

  engine.startCombatRound(
    game,
    [{ firstFace: AttackDieFace.Hammer, secondFace: AttackDieFace.Blank }],
    "player:one",
  );

  return game;
}
