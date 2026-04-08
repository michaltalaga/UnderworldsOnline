import type { FighterId, Game, PlayerState } from "../domain";
import {
  formatWeaponAccuracy,
  getFighterStatusTags,
  getPlayerToneClass,
} from "./battlefieldFormatters";

// Side panel that renders one warband: header, hand counts, and a card per
// fighter showing health, weapons, and status tags. The list on the side of
// the battlefield view mounts one of these per player.
export type PlayerPanelProps = {
  activePlayerId: PlayerState["id"] | null;
  game: Game;
  onSelectFighter: (fighterId: FighterId | null) => void;
  player: PlayerState;
  selectedFighterId: FighterId | null;
};

export default function PlayerPanel({
  activePlayerId,
  game,
  onSelectFighter,
  player,
  selectedFighterId,
}: PlayerPanelProps) {
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
