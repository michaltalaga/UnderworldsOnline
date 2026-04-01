import { useState, type CSSProperties } from "react";
import "./PracticeBattlefieldApp.css";
import {
  AttackDieFace,
  ChargeAction,
  CombatActionService,
  createCombatReadySetupPracticeGame,
  FeatureTokenSide,
  GameEngine,
  GuardAction,
  HexKind,
  MoveAction,
  type BoardState,
  type FeatureTokenState,
  type FighterState,
  type FighterId,
  type Game,
  type HexCell,
  type HexId,
  type PlayerState,
} from "./domain";

const practiceGame = createActionStepPracticeGame();
const combatActionService = new CombatActionService();
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
  moveHexIds: Set<HexId>;
  chargeHexIds: Set<HexId>;
  chargeTargetHexIds: Set<HexId>;
  chargeTargetIds: Set<FighterId>;
  moveCount: number;
  chargeCount: number;
  guardAvailable: boolean;
};

export default function PracticeBattlefieldApp() {
  const game = practiceGame;
  const boardProjection = projectBoard(game.board);
  const recentEvents = [...game.eventLog].slice(-10).reverse();
  const activePlayer = game.activePlayerId === null ? null : game.getPlayer(game.activePlayerId) ?? null;
  const selectableFighters =
    activePlayer?.fighters.filter((fighter) => !fighter.isSlain && fighter.currentHexId !== null) ?? [];
  const [selectedFighterId, setSelectedFighterId] = useState<FighterId | null>(
    selectableFighters[0]?.id ?? null,
  );
  const selectedFighter =
    selectedFighterId === null || activePlayer === null
      ? null
      : activePlayer.getFighter(selectedFighterId) ?? null;
  const actionLens = getFighterActionLens(game, activePlayer, selectedFighterId);
  const chargeTargetNames = [...actionLens.chargeTargetIds].map((fighterId) => getFighterName(game, fighterId));
  const selectedFighterName = selectedFighter === null ? "none" : getFighterName(game, selectedFighter.id);

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
            onSelectFighter={setSelectedFighterId}
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
                <dt>Charge Paths</dt>
                <dd>{actionLens.chargeCount}</dd>
              </div>
              <div>
                <dt>Guard</dt>
                <dd>{actionLens.guardAvailable ? "legal" : "no"}</dd>
              </div>
            </dl>
            <div className="battlefield-action-notes">
              <p>
                <strong>Move:</strong> highlighted in teal.
              </p>
              <p>
                <strong>Charge:</strong> destinations glow gold, and legal enemy targets glow red.
              </p>
              <p>
                <strong>Guard:</strong> the selected fighter gets a white ring when guard is legal.
              </p>
              <p>
                <strong>Charge targets:</strong>{" "}
                {chargeTargetNames.length === 0 ? "none" : chargeTargetNames.join(", ")}
              </p>
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
                  onSelectFighter={setSelectedFighterId}
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
  onSelectFighter,
  positionedHexes,
  selectedFighterId,
}: {
  activePlayerId: FighterState["ownerPlayerId"] | null;
  actionLens: FighterActionLens;
  game: Game;
  onSelectFighter: (fighterId: FighterId | null) => void;
  positionedHexes: PositionedHex[];
  selectedFighterId: FighterId | null;
}) {
  const width = Math.max(...positionedHexes.map((hex) => hex.left + hexWidth)) + boardPadding;
  const height = Math.max(...positionedHexes.map((hex) => hex.top + hexHeight)) + boardPadding;

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
          const style: CSSProperties = {
            left: `${left}px`,
            top: `${top}px`,
          };

          return (
            <article
              key={hex.id}
              className={getHexClassName(game, hex, {
                isChargeDestination: actionLens.chargeHexIds.has(hex.id),
                isChargeTarget: actionLens.chargeTargetHexIds.has(hex.id),
                isMoveDestination: actionLens.moveHexIds.has(hex.id),
                isSelectedHex,
                isSelectableHex: isSelectableFighter,
                isGuardReadyHex: isSelectedHex && actionLens.guardAvailable,
              })}
              onClick={() => {
                if (isSelectableFighter) {
                  onSelectFighter(fighter.id);
                }
              }}
              onKeyDown={(event) => {
                if (isSelectableFighter && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  onSelectFighter(fighter.id);
                }
              }}
              role={isSelectableFighter ? "button" : undefined}
              style={style}
              tabIndex={isSelectableFighter ? 0 : undefined}
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
    isChargeDestination: boolean;
    isChargeTarget: boolean;
    isMoveDestination: boolean;
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

  if (state.isChargeDestination) {
    classes.push("battlefield-map-hex-charge");
  }

  if (state.isChargeTarget) {
    classes.push("battlefield-map-hex-charge-target");
  }

  if (state.isSelectedHex) {
    classes.push("battlefield-map-hex-selected");
  }

  if (state.isSelectableHex) {
    classes.push("battlefield-map-hex-selectable");
  }

  if (state.isGuardReadyHex) {
    classes.push("battlefield-map-hex-guard-ready");
  }

  return classes.join(" ");
}

function getFighterActionLens(
  game: Game,
  activePlayer: PlayerState | null,
  selectedFighterId: FighterId | null,
): FighterActionLens {
  if (activePlayer === null || selectedFighterId === null) {
    return createEmptyActionLens();
  }

  const fighter = activePlayer.getFighter(selectedFighterId) ?? null;
  if (fighter === null) {
    return createEmptyActionLens();
  }

  const legalActions = combatActionService.getLegalActions(game, activePlayer.id);
  const moveActions = legalActions.filter(
    (action): action is MoveAction => action instanceof MoveAction && action.fighterId === selectedFighterId,
  );
  const chargeActions = legalActions.filter(
    (action): action is ChargeAction => action instanceof ChargeAction && action.fighterId === selectedFighterId,
  );
  const guardAvailable = legalActions.some(
    (action) => action instanceof GuardAction && action.fighterId === selectedFighterId,
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
    moveHexIds,
    chargeHexIds,
    chargeTargetHexIds,
    chargeTargetIds,
    moveCount: moveHexIds.size,
    chargeCount: uniqueChargeOptions.size,
    guardAvailable,
  };
}

function createEmptyActionLens(): FighterActionLens {
  return {
    fighter: null,
    moveHexIds: new Set<HexId>(),
    chargeHexIds: new Set<HexId>(),
    chargeTargetHexIds: new Set<HexId>(),
    chargeTargetIds: new Set<FighterId>(),
    moveCount: 0,
    chargeCount: 0,
    guardAvailable: false,
  };
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
