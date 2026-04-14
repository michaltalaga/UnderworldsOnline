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
    <div className={`p-2 rounded-[10px] flex flex-col gap-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ${getPlayerToneClass(player.id)}`}>
      <div className="flex justify-between items-center px-1.5 py-1 text-[#fff8f2]">
        <span className="font-extrabold text-[0.82rem]">{player.name}</span>
        <span className="text-[0.62rem] opacity-70">{player.glory} glory</span>
      </div>

      {player.fighters.map((fighter) => {
        const def = player.getFighterDefinition(fighter.id);
        const isSelected = fighter.id === selectedFighterId;
        const isSelectable = isActivePlayer && !fighter.isSlain && fighter.currentHexId !== null;
        const upgrades = player.equippedUpgrades
          .filter((c) => c.attachedToFighter === fighter)
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

  const cardClasses = [
    "bg-[rgba(255,252,245,0.88)] border border-[rgba(100,80,55,0.15)] rounded-[10px] py-2.5 px-3 flex flex-col gap-[5px]",
    slain ? "opacity-40" : "",
    isSelectable ? "cursor-pointer hover:border-[rgba(100,80,55,0.35)] hover:shadow-[0_2px_8px_rgba(40,30,20,0.12)]" : "",
    isSelected ? "!border-[rgba(60,120,180,0.6)] shadow-[0_0_0_2px_rgba(60,120,180,0.25),0_2px_8px_rgba(40,30,20,0.1)]" : "",
  ].filter(Boolean).join(" ");

  return (
    <article className={cardClasses} onClick={onSelect}>
      <div className="flex items-center justify-between gap-1">
        <span className="font-bold text-[0.88rem] text-[#3a2e22] whitespace-nowrap overflow-hidden text-ellipsis">
          {isLeader && <img src="/assets/leader.png" alt="Leader" className="w-[18px] h-[18px] align-[-3px] rounded-[3px] mr-0.5 inline" />}
          {name}
        </span>
        {slain && <span className="text-[0.55rem] font-bold uppercase text-[#a04040] tracking-[0.05em]">slain</span>}
      </div>

      <div className="flex gap-1.5 items-center">
        <span className="inline-flex items-center gap-[3px] text-[0.82rem] font-bold text-[#4a3d30]" title="Move">
          <img src="/assets/move.jpg" alt="" className="w-[18px] h-[18px] align-[-3px] rounded-[3px] inline" />{move}
        </span>
        <span className="inline-flex items-center gap-[3px] text-[0.82rem] font-bold text-[#8b3030]" title="Health">
          <img src="/assets/damage.png" alt="" className="w-[18px] h-[18px] align-[-3px] rounded-[3px] inline" />{fighter.damage}/{health}
        </span>
        <span className="inline-flex items-center gap-[3px] text-[0.82rem] font-bold text-[#4a3d30]" title="Save">
          <img src={saveIcon} alt="" className="w-[18px] h-[18px] align-[-3px] rounded-[3px] inline" />{saveDice}
        </span>
      </div>

      {weapons.length > 0 && (
        <div className="flex flex-col gap-px pt-0.5 border-t border-[rgba(100,80,55,0.1)]">
          {weapons.map((w) => (
            <WeaponRow key={w.id} weapon={w} />
          ))}
        </div>
      )}

      {tokenTags.length > 0 && (
        <div className="flex flex-wrap gap-0.5">
          {tokenTags.map((tag) => (
            <TokenBadge key={tag} tag={tag} />
          ))}
        </div>
      )}

      {upgrades.length > 0 && (
        <div className="flex flex-wrap gap-0.5 pt-0.5 border-t border-[rgba(100,80,55,0.1)]">
          {upgrades.map((name) => (
            <span key={name} className="inline-flex items-center text-[0.5rem] font-bold tracking-[0.03em] px-[5px] py-px rounded-[4px] bg-linear-to-b from-[rgba(200,170,120,0.18)] to-[rgba(180,140,80,0.22)] text-[#6e5520] border border-[rgba(180,140,80,0.2)]">
              {name}
            </span>
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
    <div className="flex items-center gap-1 text-[0.78rem] font-semibold text-[#5a4a3a]">
      <img src={rangeIcon} alt="" className="w-[18px] h-[18px] align-[-3px] rounded-[3px] inline" />
      <img src={accIcon} alt="" className="w-[18px] h-[18px] align-[-3px] rounded-[3px] inline" />
      <span>{weapon.dice}</span>
      <span className="opacity-30">|</span>
      <img src="/assets/damage.png" alt="" className="w-[18px] h-[18px] align-[-3px] rounded-[3px] inline" />
      <span>{weapon.damage}</span>
      {weapon.abilities.map((a) => (
        <span key={a.displayName} className="text-[0.5rem] font-bold uppercase tracking-[0.03em] px-[3px] rounded-[3px] bg-[rgba(100,80,55,0.1)] text-[#6a5a4a]">
          {a.displayName}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

const tokenColors: Record<string, string> = {
  move: "bg-[rgba(100,80,55,0.1)] text-[#6a5a4a]",
  charge: "bg-[rgba(180,140,30,0.12)] text-[#7a6a20]",
  guard: "bg-[rgba(40,120,80,0.12)] text-guard",
  stagger: "bg-[rgba(160,60,30,0.12)] text-attack",
};

const tokenIcons: Record<string, string> = {
  move: "/assets/move.jpg",
  charge: "/assets/charge.jpg",
  guard: "/assets/guard.jpg",
  stagger: "/assets/stagger.png",
};

function TokenBadge({ tag }: { tag: string }) {
  const key = tag.toLowerCase().replace(" token", "").trim();
  const icon = tokenIcons[key];
  const colors = tokenColors[key] ?? "bg-[rgba(100,80,55,0.1)] text-[#6a5a4a]";
  return (
    <span className={`inline-flex items-center gap-0.5 text-[0.5rem] font-bold uppercase tracking-[0.04em] px-1 py-px rounded-[4px] ${colors}`}>
      {icon && <img src={icon} alt="" className="w-[18px] h-[18px] align-[-3px] rounded-[3px] inline" />}
      {tag}
    </span>
  );
}
