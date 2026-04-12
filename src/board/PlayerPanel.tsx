import type { Fighter, FighterId, Game, Player, WeaponDefinition } from "../domain";
import { SaveSymbol, WeaponAccuracy } from "../domain";
import {
  getFighterStatusTags,
  getPlayerToneClass,
} from "./battlefieldFormatters";

export type PlayerPanelProps = {
  activePlayerId: Player["id"] | null;
  game: Game;
  onSelectFighter: (fighterId: FighterId | null) => void;
  player: Player;
  selectedFighterId: FighterId | null;
};

export default function PlayerPanel({
  activePlayerId,
  game: _game,
  onSelectFighter,
  player,
  selectedFighterId,
}: PlayerPanelProps) {
  const isActivePlayer = player.id === activePlayerId;

  return (
    <div className={`roster-panel ${getPlayerToneClass(player.id)}`}>
      <div className="roster-header">
        <span className="roster-name">{player.name}</span>
        <span className="roster-glory">{player.glory} glory</span>
      </div>

      {player.fighters.map((fighter) => {
        const def = player.getFighterDefinition(fighter.id);
        const isSelected = fighter.id === selectedFighterId;
        const isSelectable = isActivePlayer && !fighter.isSlain && fighter.currentHexId !== null;
        const upgrades = player.equippedUpgrades
          .filter((c) => c.attachedToFighter?.id === fighter.id)
          .map((c) => c.name);

        return (
          <FighterCard
            key={fighter.id}
            fighter={fighter}
            name={def?.name ?? fighter.id}
            isLeader={def?.isLeader ?? false}
            move={def?.move ?? 0}
            health={def?.health ?? 0}
            saveDice={def?.saveDice ?? 0}
            saveSymbol={def?.saveSymbol ?? SaveSymbol.Dodge}
            weapons={def?.weapons ?? []}
            upgrades={upgrades}
            isSelected={isSelected}
            isSelectable={isSelectable}
            onSelect={() => isSelectable && onSelectFighter(fighter.id)}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------

function FighterCard({
  fighter,
  name,
  isLeader,
  move,
  health,
  saveDice,
  saveSymbol,
  weapons,
  upgrades,
  isSelected,
  isSelectable,
  onSelect,
}: {
  fighter: Fighter;
  name: string;
  isLeader: boolean;
  move: number;
  health: number;
  saveDice: number;
  saveSymbol: string;
  weapons: readonly WeaponDefinition[];
  upgrades: string[];
  isSelected: boolean;
  isSelectable: boolean;
  onSelect: () => void;
}) {
  const tokenTags = getFighterStatusTags(fighter);
  const slain = fighter.isSlain;
  const saveIcon = saveSymbol === SaveSymbol.Shield ? "/assets/shield.png" : "/assets/dodge.png";

  return (
    <article
      className={[
        "roster-card",
        slain ? "roster-card-slain" : "",
        isSelectable ? "roster-card-selectable" : "",
        isSelected ? "roster-card-selected" : "",
      ].filter(Boolean).join(" ")}
      onClick={onSelect}
    >
      <div className="roster-card-top">
        <span className="roster-card-name">
          {isLeader && <img src="/assets/leader.png" alt="Leader" className="roster-icon roster-icon-leader" />}
          {name}
        </span>
        {slain && <span className="roster-card-slain-badge">slain</span>}
      </div>

      <div className="roster-card-stats">
        <span className="roster-stat roster-stat-move" title="Move">
          <img src="/assets/move.jpg" alt="" className="roster-icon" />{move}
        </span>
        <span className="roster-stat roster-stat-health" title="Health">
          <img src="/assets/damage.png" alt="" className="roster-icon" />{fighter.damage}/{health}
        </span>
        <span className="roster-stat roster-stat-save" title="Save">
          <img src={saveIcon} alt="" className="roster-icon" />{saveDice}
        </span>
      </div>

      {weapons.length > 0 && (
        <div className="roster-card-weapons">
          {weapons.map((w) => (
            <WeaponRow key={w.id} weapon={w} />
          ))}
        </div>
      )}

      {tokenTags.length > 0 && (
        <div className="roster-card-tokens">
          {tokenTags.map((tag) => (
            <TokenBadge key={tag} tag={tag} />
          ))}
        </div>
      )}

      {upgrades.length > 0 && (
        <div className="roster-card-upgrades">
          {upgrades.map((name) => (
            <span key={name} className="roster-upgrade">{name}</span>
          ))}
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------

function WeaponRow({ weapon }: { weapon: WeaponDefinition }) {
  const accIcon = weapon.accuracy === WeaponAccuracy.Hammer
    ? "/assets/hammer.png"
    : "/assets/swords.png";
  const rangeIcon = weapon.range <= 1 ? "/assets/melee.png" : "/assets/ranged.png";

  return (
    <div className="roster-weapon">
      <img src={rangeIcon} alt="" className="roster-icon" />
      <img src={accIcon} alt="" className="roster-icon" />
      <span>{weapon.dice}</span>
      <span className="roster-weapon-sep">|</span>
      <img src="/assets/damage.png" alt="" className="roster-icon" />
      <span>{weapon.damage}</span>
      {weapon.abilities.map((a) => (
        <span key={a.displayName} className="roster-weapon-ability">{a.displayName}</span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

const tokenIcons: Record<string, string> = {
  move: "/assets/move.jpg",
  charge: "/assets/charge.jpg",
  guard: "/assets/guard.jpg",
  stagger: "/assets/stagger.png",
};

function TokenBadge({ tag }: { tag: string }) {
  const key = tag.toLowerCase().replace(" token", "").trim();
  const icon = tokenIcons[key];
  return (
    <span className={`roster-token roster-token-${key}`}>
      {icon && <img src={icon} alt="" className="roster-icon" />}
      {tag}
    </span>
  );
}
