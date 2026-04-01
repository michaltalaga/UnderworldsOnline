import { useEffect, useState, type CSSProperties } from "react";
import "./PracticeBattlefieldApp.css";
import {
  AttackDieFace,
  AttackAction,
  ChargeAction,
  CombatActionService,
  createCombatReadySetupPracticeGame,
  FeatureTokenSide,
  GameEngine,
  GameRecordKind,
  GuardAction,
  HexKind,
  MoveAction,
  PassAction,
  TurnStep,
  type BoardState,
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
  guardAction: GuardAction | null;
  passAction: PassAction | null;
  attackCount: number;
  moveCount: number;
  chargeCount: number;
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

export default function PracticeBattlefieldApp() {
  const [game, setGame] = useState<Game>(() => createActionStepPracticeGame());
  const [, setRefreshTick] = useState(0);
  const boardProjection = projectBoard(game.board);
  const recentEvents = [...game.eventLog].slice(-10).reverse();
  const activePlayer = game.activePlayerId === null ? null : game.getPlayer(game.activePlayerId) ?? null;
  const selectableFighters =
    activePlayer?.fighters.filter((fighter) => !fighter.isSlain && fighter.currentHexId !== null) ?? [];
  const [selectedFighterId, setSelectedFighterId] = useState<FighterId | null>(
    selectableFighters[0]?.id ?? getDefaultSelectableFighterId(game),
  );
  const selectedFighter =
    selectedFighterId === null || activePlayer === null
      ? null
      : activePlayer.getFighter(selectedFighterId) ?? null;
  const actionLens = getFighterActionLens(game, activePlayer, selectedFighterId);
  const moveOptions = getMoveOptions(actionLens);
  const chargeOptions = getChargeOptions(game, actionLens);
  const [selectedMoveHexId, setSelectedMoveHexId] = useState<HexId | null>(null);
  const [selectedChargeKey, setSelectedChargeKey] = useState<string | null>(null);
  const [pendingMoveHexId, setPendingMoveHexId] = useState<HexId | null>(null);
  const [pendingChargeHexId, setPendingChargeHexId] = useState<HexId | null>(null);
  const [pendingChargeTargetId, setPendingChargeTargetId] = useState<FighterId | null>(null);
  const [pendingAttackTargetId, setPendingAttackTargetId] = useState<FighterId | null>(null);
  const [selectedAttackKeysByTarget, setSelectedAttackKeysByTarget] = useState<Record<string, string>>({});
  const selectedMoveOption = moveOptions.find((option) => option.hexId === selectedMoveHexId) ?? moveOptions[0] ?? null;
  const selectedChargeOption = chargeOptions.find((option) => option.key === selectedChargeKey) ?? chargeOptions[0] ?? null;
  const visibleChargeTargetIds = getChargeTargetIdsForHex(actionLens, pendingChargeHexId);
  const chargeTargetNames = [...visibleChargeTargetIds].map((fighterId) => getFighterName(game, fighterId));
  const attackTargetNames = [...actionLens.attackTargetIds].map((fighterId) => getFighterName(game, fighterId));
  const attackProfiles = getAttackProfiles(game, activePlayer, actionLens, selectedAttackKeysByTarget);
  const selectedFighterName = selectedFighter === null ? "none" : getFighterName(game, selectedFighter.id);
  const pendingChargeTargetName =
    pendingChargeTargetId === null ? null : getFighterName(game, pendingChargeTargetId);
  const pendingAttackProfile =
    pendingAttackTargetId === null
      ? null
      : getAttackProfileForTarget(attackProfiles, pendingAttackTargetId);
  const pendingAttackTargetName = pendingAttackProfile?.targetName ?? (
    pendingAttackTargetId === null ? null : getFighterName(game, pendingAttackTargetId)
  );
  const pendingAttackOption = pendingAttackProfile?.options.find((option) => option.key === pendingAttackProfile.selectedKey) ?? null;
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
  const actionPrompt =
    game.turnStep === TurnStep.Action
      ? pendingAttackTargetId !== null
        ? `${pendingAttackTargetName ?? pendingAttackTargetId} selected with ${pendingAttackOption?.label ?? "the current profile"}. Click the same crimson target again to confirm the attack, press Escape to cancel, or pick a different crimson target.`
        : pendingChargeTargetId !== null && pendingChargeHexId !== null
        ? `${pendingChargeTargetName ?? pendingChargeTargetId} selected from ${pendingChargeHexId}. Click the same red target again to confirm, press Escape to cancel, or pick a different target.`
        : pendingChargeHexId !== null
          ? `Charge from ${pendingChargeHexId} selected. Click a red target to arm it, or press Escape to cancel.`
          : pendingMoveHexId !== null
            ? `Move to ${pendingMoveHexId} selected. Click the same teal hex again to confirm, press Escape to cancel, or choose another teal hex.`
            : "Select a fighter, then click a teal hex to move or click a gold hex and then a red target to charge."
      : recentCombatTargetName === null
        ? "The selected fighter has already acted. Pass the power step or reset the board."
        : `Recent combat: ${recentCombatTargetName} remains marked on the map. Pass the power step or reset the board.`;

  function selectFighter(fighterId: FighterId | null): void {
    setSelectedFighterId(fighterId);
    setSelectedMoveHexId(null);
    setSelectedChargeKey(null);
    setPendingMoveHexId(null);
    setPendingChargeHexId(null);
    setPendingChargeTargetId(null);
    setPendingAttackTargetId(null);
    setSelectedAttackKeysByTarget({});
  }

  function refreshGame(): void {
    setRefreshTick((value) => value + 1);
  }

  function applyAction(action: MoveAction | ChargeAction | AttackAction | GuardAction | PassAction): void {
    const previousActivePlayerId = game.activePlayerId;
    const previousSelectedFighterId = selectedFighterId;
    demoEngine.applyGameAction(game, action);
    setSelectedMoveHexId(null);
    setSelectedChargeKey(null);
    setPendingMoveHexId(null);
    setPendingChargeHexId(null);
    setPendingChargeTargetId(null);
    setPendingAttackTargetId(null);
    setSelectedAttackKeysByTarget({});
    setSelectedFighterId(getNextSelectedFighterId(game, previousActivePlayerId, previousSelectedFighterId));
    refreshGame();
  }

  function moveToHex(hexId: HexId): void {
    if (pendingMoveHexId !== hexId) {
      setPendingMoveHexId(hexId);
      setPendingChargeHexId(null);
      setPendingChargeTargetId(null);
      setPendingAttackTargetId(null);
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

    setPendingMoveHexId(null);
    setPendingChargeHexId(hexId);
    setPendingChargeTargetId(null);
    setPendingAttackTargetId(null);
  }

  function completeChargeAgainstTarget(targetId: FighterId): void {
    if (pendingChargeTargetId !== targetId) {
      setPendingChargeTargetId(targetId);
      setPendingAttackTargetId(null);
      return;
    }

    const chargeAction = getChargeActionForTarget(actionLens, pendingChargeHexId, targetId);
    if (chargeAction !== null) {
      applyAction(chargeAction);
    }
  }

  function cancelPendingCharge(): void {
    setPendingMoveHexId(null);
    setPendingChargeHexId(null);
    setPendingChargeTargetId(null);
    setPendingAttackTargetId(null);
  }

  function attackTarget(targetId: FighterId): void {
    if (pendingAttackTargetId !== targetId) {
      setPendingMoveHexId(null);
      setPendingChargeHexId(null);
      setPendingChargeTargetId(null);
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

  useEffect(() => {
    if (
      pendingMoveHexId === null &&
      pendingChargeHexId === null &&
      pendingChargeTargetId === null &&
      pendingAttackTargetId === null
    ) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setPendingMoveHexId(null);
        setPendingChargeHexId(null);
        setPendingChargeTargetId(null);
        setPendingAttackTargetId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingMoveHexId, pendingChargeHexId, pendingChargeTargetId, pendingAttackTargetId]);

  function resetBattlefield(): void {
    const nextGame = createActionStepPracticeGame();
    setGame(nextGame);
    setSelectedFighterId(getDefaultSelectableFighterId(nextGame));
    setSelectedMoveHexId(null);
    setSelectedChargeKey(null);
    setPendingMoveHexId(null);
    setPendingChargeHexId(null);
    setPendingChargeTargetId(null);
    setPendingAttackTargetId(null);
    setSelectedAttackKeysByTarget({});
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
            actionLens={actionLens}
            pendingMoveHexId={pendingMoveHexId}
            pendingChargeHexId={pendingChargeHexId}
            pendingChargeTargetId={pendingChargeTargetId}
            pendingAttackTargetId={pendingAttackTargetId}
            recentCombatTargetId={recentCombatTargetId}
            onAttackTarget={attackTarget}
            onCancelPendingCharge={cancelPendingCharge}
            onCompleteChargeAgainstTarget={completeChargeAgainstTarget}
            onMoveToHex={moveToHex}
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
                  onClick={() => {
                    if (actionLens.guardAction !== null) {
                      applyAction(actionLens.guardAction);
                    }
                  }}
                  disabled={actionLens.guardAction === null || game.turnStep !== TurnStep.Action}
                >
                  Guard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (actionLens.passAction !== null) {
                      applyAction(actionLens.passAction);
                    }
                  }}
                  disabled={actionLens.passAction === null}
                >
                  {game.turnStep === TurnStep.Power ? "Pass Power" : "Pass"}
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
                <strong>Guard:</strong> the selected fighter gets a white ring when guard is legal.
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
  pendingChargeHexId,
  pendingChargeTargetId,
  pendingAttackTargetId,
  recentCombatTargetId,
  onAttackTarget,
  onCancelPendingCharge,
  onCompleteChargeAgainstTarget,
  onMoveToHex,
  onStartChargeToHex,
  onSelectFighter,
  positionedHexes,
  selectedFighterId,
}: {
  activePlayerId: FighterState["ownerPlayerId"] | null;
  actionLens: FighterActionLens;
  game: Game;
  pendingMoveHexId: HexId | null;
  pendingChargeHexId: HexId | null;
  pendingChargeTargetId: FighterId | null;
  pendingAttackTargetId: FighterId | null;
  recentCombatTargetId: FighterId | null;
  onAttackTarget: (targetId: FighterId) => void;
  onCancelPendingCharge: () => void;
  onCompleteChargeAgainstTarget: (targetId: FighterId) => void;
  onMoveToHex: (hexId: HexId) => void;
  onStartChargeToHex: (hexId: HexId) => void;
  onSelectFighter: (fighterId: FighterId | null) => void;
  positionedHexes: PositionedHex[];
  selectedFighterId: FighterId | null;
}) {
  const width = Math.max(...positionedHexes.map((hex) => hex.left + hexWidth)) + boardPadding;
  const height = Math.max(...positionedHexes.map((hex) => hex.top + hexHeight)) + boardPadding;
  const visibleChargeTargetHexIds = getChargeTargetHexIdsForHex(game, actionLens, pendingChargeHexId);

  return (
    <div className="battlefield-board-frame">
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
          const isPendingChargeHex = pendingChargeHexId === hex.id;
          const isChargeTarget = visibleChargeTargetHexIds.has(hex.id);
          const isPendingChargeTarget = fighter?.id === pendingChargeTargetId;
          const isAttackTarget =
            pendingChargeHexId === null &&
            game.turnStep === TurnStep.Action &&
            actionLens.attackTargetHexIds.has(hex.id);
          const isPendingAttackTarget = fighter?.id === pendingAttackTargetId;
          const isRecentCombatTarget =
            pendingChargeHexId === null &&
            game.turnStep === TurnStep.Power &&
            fighter?.id === recentCombatTargetId;
          const isClickableMoveDestination = isMoveDestination && game.turnStep === TurnStep.Action;
          const isClickableChargeDestination = isChargeDestination && game.turnStep === TurnStep.Action;
          const isClickableChargeTarget =
            pendingChargeHexId !== null &&
            isChargeTarget &&
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
            isClickableChargeDestination ||
            isClickableMoveDestination;
          const actionBadge = getHexActionBadge({
            isAttackTarget,
            isChargeDestination,
            isPendingAttackTarget,
            isPendingChargeHex,
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

          return (
            <article
              key={hex.id}
              className={getHexClassName(game, hex, {
                isAttackTarget,
                isChargeDestination,
                isPendingAttackTarget,
                isPendingChargeHex,
                isPendingChargeTarget,
                isChargeTarget,
                isClickableHex: isInteractiveHex,
                isPendingMoveHex,
                isMoveDestination,
                isRecentCombatTarget,
                isSelectedHex,
                isSelectableHex: isSelectableFighter,
                isGuardReadyHex: isSelectedHex && actionLens.guardAvailable,
              })}
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
              role={isInteractiveHex ? "button" : undefined}
              style={style}
              tabIndex={isInteractiveHex ? 0 : undefined}
              title={buildHexTitle(game, hex, fighter, featureToken)}
            >
              <div className="battlefield-hex-meta-row">
                <span className="battlefield-hex-id">{compactHexId(hex.id)}</span>
                {hex.isStartingHex ? <span className="battlefield-hex-tag">start</span> : null}
              </div>

              <div className="battlefield-hex-center">
                {featureToken === null ? null : (
                  <span className={`battlefield-feature-chip battlefield-feature-${featureToken.side}`}>
                    {getFeatureTokenBadge(featureToken)}
                  </span>
                )}
                {actionBadge === null ? null : (
                  <span className={`battlefield-hex-action-badge battlefield-hex-action-${actionBadge}`}>
                    {actionBadge}
                  </span>
                )}
                {fighter === null ? (
                  <span className="battlefield-empty-hex-dot" aria-hidden="true" />
                ) : (
                  <div className={`battlefield-fighter-badge ${getPlayerToneClass(fighter.ownerPlayerId)}`}>
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
    isPendingAttackTarget: boolean;
    isPendingChargeHex: boolean;
    isPendingChargeTarget: boolean;
    isChargeTarget: boolean;
    isClickableHex: boolean;
    isPendingMoveHex: boolean;
    isMoveDestination: boolean;
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

  if (state.isChargeDestination) {
    classes.push("battlefield-map-hex-charge");
  }

  if (state.isPendingChargeHex) {
    classes.push("battlefield-map-hex-charge-armed");
  }

  if (state.isChargeTarget) {
    classes.push("battlefield-map-hex-charge-target");
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
  isPendingAttackTarget: boolean;
  isPendingChargeHex: boolean;
  isPendingChargeTarget: boolean;
  isChargeTarget: boolean;
  isPendingMoveHex: boolean;
  isMoveDestination: boolean;
  isRecentCombatTarget: boolean;
}): "move" | "charge" | "armed" | "target" | "confirm" | "attack" | "last" | null {
  if (state.isPendingAttackTarget) {
    return "confirm";
  }

  if (state.isPendingChargeTarget) {
    return "confirm";
  }

  if (state.isChargeTarget) {
    return "target";
  }

  if (state.isPendingChargeHex) {
    return "armed";
  }

  if (state.isPendingMoveHex) {
    return "confirm";
  }

  if (state.isChargeDestination) {
    return "charge";
  }

  if (state.isAttackTarget) {
    return "attack";
  }

  if (state.isRecentCombatTarget) {
    return "last";
  }

  if (state.isMoveDestination) {
    return "move";
  }

  return null;
}

function getFighterActionLens(
  game: Game,
  activePlayer: PlayerState | null,
  selectedFighterId: FighterId | null,
): FighterActionLens {
  const legalActions = activePlayer === null ? [] : combatActionService.getLegalActions(game, activePlayer.id);
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
    guardAction,
    passAction,
    attackCount: attackTargetIds.size,
    moveCount: moveHexIds.size,
    chargeCount: uniqueChargeOptions.size,
    guardAvailable: guardAction !== null,
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
    guardAction: null,
    passAction,
    attackCount: 0,
    moveCount: 0,
    chargeCount: 0,
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

function getChargeActionForTarget(
  actionLens: FighterActionLens,
  hexId: HexId | null,
  targetId: FighterId,
): ChargeAction | null {
  if (hexId === null) {
    return null;
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

function describeAttackAction(
  player: PlayerState,
  action: AttackAction,
): {
  label: string;
  stats: string;
} {
  const weapon = player.getFighterWeaponDefinition(action.attackerId, action.weaponId);
  if (weapon === undefined) {
    return {
      label: action.weaponId,
      stats: "",
    };
  }

  const selectedAbility = weapon.getAbility(action.selectedAbility);
  return {
    label: selectedAbility === null ? weapon.name : `${weapon.name} using ${selectedAbility.displayName}`,
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
