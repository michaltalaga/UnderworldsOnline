import type { CSSProperties } from "react";
import "./PracticeBattlefieldApp.css";
import {
  createCombatReadySetupPracticeGame,
  FeatureTokenSide,
  HexKind,
  type BoardState,
  type FeatureTokenState,
  type FighterState,
  type Game,
  type HexCell,
  type PlayerState,
} from "./domain";

const practiceGame = createCombatReadySetupPracticeGame();
const hexRadius = 46;
const hexWidth = Math.sqrt(3) * hexRadius;
const hexHeight = hexRadius * 2;
const boardPadding = 28;

type PositionedHex = {
  hex: HexCell;
  left: number;
  top: number;
};

export default function PracticeBattlefieldApp() {
  const game = practiceGame;
  const boardProjection = projectBoard(game.board);
  const recentEvents = [...game.eventLog].slice(-10).reverse();

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

          <BoardMap game={game} positionedHexes={boardProjection.positionedHexes} />

          <div className="battlefield-legend-grid">
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-player-one" label="Player One territory" />
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-player-two" label="Player Two territory" />
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-neutral" label="Neutral hex" />
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-start" label="Starting hex" />
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-edge" label="Edge hex" />
            <LegendItem swatchClassName="battlefield-swatch battlefield-swatch-feature" label="Feature token" />
          </div>
        </section>

        <div className="battlefield-side-stack">
          <section className="battlefield-panel">
            <div className="battlefield-heading">
              <p className="battlefield-eyebrow">Warbands</p>
              <h2>Players and fighters</h2>
            </div>
            <div className="battlefield-warband-grid">
              {game.players.map((player) => (
                <PlayerPanel key={player.id} game={game} player={player} />
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
  game,
  positionedHexes,
}: {
  game: Game;
  positionedHexes: PositionedHex[];
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
          const style: CSSProperties = {
            left: `${left}px`,
            top: `${top}px`,
          };

          return (
            <article
              key={hex.id}
              className={getHexClassName(game, hex)}
              style={style}
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

function PlayerPanel({ game, player }: { game: Game; player: PlayerState }) {
  const territoryName =
    player.territoryId === null ? "unclaimed" : game.board.getTerritory(player.territoryId)?.name ?? player.territoryId;

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

          return (
            <article key={fighter.id} className="battlefield-fighter-card">
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

function getHexClassName(game: Game, hex: HexCell): string {
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

  return classes.join(" ");
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
