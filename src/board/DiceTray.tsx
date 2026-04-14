import {
  AttackDieFace,
  CombatOutcome,
  GameRecordKind,
  SaveDieFace,
  type CombatResult,
  type Game,
  type GameRecord,
  type PlayerId,
  type RollOffResult,
} from "../domain";
import { getFighterName } from "./battlefieldFormatters";

// A dedicated panel that shows the raw dice faces of the most recent
// dice-producing event (combat attack or setup roll-off). The parent
// projects the game's event log into a `DiceTrayModel` and passes it in,
// or `null` for the empty state.
//
// Keying the root section on `model.rollId` forces React to remount on
// every new roll, which replays the CSS entrance animation — giving a
// visual cue that a new dice result has landed.

export type DiceTrayFace = {
  short: string;
  icon: string | null;
  full: string;
  isSuccess: boolean;
  isCritical: boolean;
};

export type DiceTrayRoll = {
  label: string;
  tone: "attack" | "save";
  faces: readonly DiceTrayFace[];
  summary: string;
};

export type DiceTrayModel = {
  // Unique id for animation keying. Built from the record index so a
  // new roll forces a React remount.
  rollId: string;
  // Flavour eyebrow (e.g. "Combat", "Territory roll-off").
  kindLabel: string;
  title: string;
  outcomeLabel: string;
  outcomeTone: "success" | "failure" | "draw" | "neutral";
  subtitle: string | null;
  rolls: readonly DiceTrayRoll[];
};

export type DiceTrayProps = {
  model: DiceTrayModel | null;
};

const outcomeToneClasses: Record<string, string> = {
  success: "bg-[rgba(82,129,68,0.22)] border border-[rgba(82,129,68,0.48)] text-[#2a4012]",
  failure: "bg-[rgba(41,95,150,0.18)] border border-[rgba(41,95,150,0.44)] text-[#1d4a7a]",
  draw: "bg-[rgba(120,98,72,0.2)] border border-[rgba(120,98,72,0.44)] text-[#5a4a32]",
  neutral: "bg-[rgba(120,98,72,0.16)] border border-[rgba(120,98,72,0.36)] text-[#5a4a32]",
};

const rollToneClasses: Record<string, string> = {
  attack: "bg-[rgba(252,228,214,0.74)] border-[rgba(195,78,47,0.3)]",
  save: "bg-[rgba(224,234,250,0.74)] border-[rgba(41,95,150,0.3)]",
};

export default function DiceTray({ model }: DiceTrayProps) {
  if (model === null) {
    return null;
  }

  return (
    <section
      key={model.rollId}
      className="relative box-border w-full max-h-[55%] overflow-hidden p-3.5 px-[18px] grid gap-2.5 rounded-card bg-[rgba(253,249,242,0.96)] border border-[rgba(85,66,40,0.22)] shadow-[0_18px_44px_rgba(63,46,29,0.22)] backdrop-blur-[10px] animate-[dice-tray-enter_420ms_cubic-bezier(0.2,0.7,0.1,1.05)_both]"
      aria-live="polite"
    >
      <div className="grid gap-0.5">
        <p className="m-0 text-[0.68rem] font-extrabold tracking-[0.12em] uppercase text-[#8a5630]">
          {model.kindLabel}
        </p>
        <h3 className="m-0 font-heading text-[1.1rem] text-heading">{model.title}</h3>
        <p className="mt-1 text-[0.86rem] text-ink-soft">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-pill text-[0.72rem] font-extrabold uppercase tracking-[0.06em] ${outcomeToneClasses[model.outcomeTone] ?? outcomeToneClasses.neutral}`}>
            {model.outcomeLabel}
          </span>
          {model.subtitle === null ? null : <> · {model.subtitle}</>}
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
        {model.rolls.map((roll) => (
          <DiceTrayRollSection key={roll.label} roll={roll} />
        ))}
      </div>
    </section>
  );
}

function DiceTrayRollSection({ roll }: { roll: DiceTrayRoll }) {
  const tone = rollToneClasses[roll.tone] ?? "";
  return (
    <div className={`grid gap-2 p-3 px-3.5 rounded-button bg-surface-inner border border-[rgba(85,66,40,0.18)] ${tone}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.08em] text-[#5a4a32]">{roll.label}</p>
        <p className="m-0 text-[0.78rem] text-[#5a4a32] font-semibold">{roll.summary}</p>
      </div>
      {roll.faces.length === 0 ? (
        <p className="m-0 text-[0.82rem] text-[#8e7a66] italic">No dice rolled.</p>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-wrap gap-2">
          {roll.faces.map((face, index) => {
            const faceClasses = [
              "inline-flex items-center justify-center min-w-[44px] h-[44px] px-2.5 rounded-[12px] bg-[rgba(253,249,242,0.94)] border border-[rgba(85,66,40,0.28)] text-heading font-heading text-[0.88rem] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_14px_rgba(35,24,18,0.1)] animate-[dice-tray-face-enter_360ms_cubic-bezier(0.2,0.7,0.1,1.1)_both]",
              face.isSuccess && roll.tone === "attack"
                ? "!border-[rgba(82,129,68,0.66)] !bg-linear-to-b !from-[rgba(220,244,204,0.96)] !to-[rgba(168,210,132,0.96)] !text-[#2a4012]"
                : "",
              face.isSuccess && roll.tone === "save"
                ? "!border-[rgba(41,95,150,0.6)] !bg-linear-to-b !from-[rgba(206,226,248,0.98)] !to-[rgba(122,165,214,0.98)] !text-[#0e2a4c]"
                : "",
              face.isCritical
                ? "!border-[rgba(168,58,30,0.76)] !bg-linear-to-b !from-[rgba(255,219,186,0.98)] !to-[rgba(220,120,60,0.98)] !text-[#4a1a08] !shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_0_0_2px_rgba(168,58,30,0.22),0_8px_18px_rgba(168,58,30,0.32)]"
                : "",
            ].filter(Boolean).join(" ");
            return (
              <li
                key={`${face.short}:${index}`}
                className={faceClasses}
                title={face.full}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                {face.icon !== null
                  ? <img src={face.icon} alt={face.full} className="w-[22px] h-[22px] rounded-[3px]" />
                  : face.short}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// --- Model builder -------------------------------------------------------

// Walks the game record log from newest to oldest and returns a dice
// tray model for the most recent dice-producing event. Combat attacks
// and territory roll-offs both count.
export function getDiceTrayModel(game: Game): DiceTrayModel | null {
  for (let index = game.records.length - 1; index >= 0; index -= 1) {
    const record = game.records[index];
    if (record.kind === GameRecordKind.Combat) {
      return buildCombatDiceModel(game, record as GameRecord<typeof GameRecordKind.Combat>, index);
    }
    if (record.kind === GameRecordKind.RollOff) {
      return buildRollOffDiceModel(game, record as GameRecord<typeof GameRecordKind.RollOff>, index);
    }
  }
  return null;
}

function buildCombatDiceModel(
  game: Game,
  record: GameRecord<typeof GameRecordKind.Combat>,
  index: number,
): DiceTrayModel {
  const result: CombatResult = record.data;
  const attackerName = getFighterName(game, result.context.attackerFighterId);
  const targetName = getFighterName(game, result.context.targetFighterId);

  const attackFaces = result.attackRoll.map(renderAttackFace);
  const saveFaces = result.saveRoll.map(renderSaveFace);

  const outcomeTone = getCombatOutcomeTone(result.outcome);
  const outcomeLabel = getCombatOutcomeLabel(result.outcome);

  const subtitleParts = [
    `${result.damageInflicted} damage`,
  ];
  if (result.targetSlain) {
    subtitleParts.push("slain");
  }

  return {
    rollId: `combat:${index}`,
    kindLabel: "Combat",
    title: `${attackerName} → ${targetName}`,
    outcomeLabel,
    outcomeTone,
    subtitle: subtitleParts.join(" · "),
    rolls: [
      {
        label: "Attack",
        tone: "attack",
        faces: attackFaces,
        summary: `${result.attackSuccesses} hits · ${result.attackCriticals} crits`,
      },
      {
        label: "Save",
        tone: "save",
        faces: saveFaces,
        summary: `${result.saveSuccesses} blocks · ${result.saveCriticals} crits`,
      },
    ],
  };
}

function buildRollOffDiceModel(
  game: Game,
  record: GameRecord<typeof GameRecordKind.RollOff>,
  index: number,
): DiceTrayModel {
  const result: RollOffResult = record.data;
  const decisive = result.decisiveRound;
  const winnerName = getPlayerDisplayName(game, result.winnerPlayerId);
  const loserName = getPlayerDisplayName(game, result.loserPlayerId);

  // Show every rolled round as separate faces so re-rolls are visible.
  const playerOneFaces = result.rounds.map((round) => renderAttackFace(round.playerOneFace));
  const playerTwoFaces = result.rounds.map((round) => renderAttackFace(round.playerTwoFace));

  const subtitleParts: string[] = [];
  if (result.rounds.length > 1) {
    subtitleParts.push(`${result.rounds.length - 1} re-roll${result.rounds.length - 1 === 1 ? "" : "s"}`);
  }
  if (result.resolvedByTieBreaker) {
    subtitleParts.push("tie-breaker");
  }
  subtitleParts.push(`${loserName} loses`);

  return {
    rollId: `rollOff:${index}`,
    kindLabel: "Territory roll-off",
    title: `${winnerName} wins the roll-off`,
    outcomeLabel: "Winner",
    outcomeTone: "success",
    subtitle: subtitleParts.join(" · "),
    rolls: [
      {
        label: getPlayerDisplayName(game, decisive.playerOneId),
        tone: "attack",
        faces: playerOneFaces,
        summary: playerOneFaces.length === 1 ? "1 die" : `${playerOneFaces.length} rolls`,
      },
      {
        label: getPlayerDisplayName(game, decisive.playerTwoId),
        tone: "attack",
        faces: playerTwoFaces,
        summary: playerTwoFaces.length === 1 ? "1 die" : `${playerTwoFaces.length} rolls`,
      },
    ],
  };
}

function getPlayerDisplayName(game: Game, playerId: PlayerId): string {
  return game.players.find((p) => p.id === playerId)?.name ?? playerId;
}

// --- Face formatting -----------------------------------------------------

function renderAttackFace(face: AttackDieFace): DiceTrayFace {
  switch (face) {
    case AttackDieFace.Critical:
      return { short: "Crit", icon: "/assets/crit.png", full: "Critical", isSuccess: true, isCritical: true };
    case AttackDieFace.Hammer:
      return { short: "Ham", icon: "/assets/hammer.png", full: "Hammer", isSuccess: true, isCritical: false };
    case AttackDieFace.Sword:
      return { short: "Swd", icon: "/assets/swords.png", full: "Sword", isSuccess: true, isCritical: false };
    case AttackDieFace.Support:
      return { short: "Sup", icon: null, full: "Support", isSuccess: false, isCritical: false };
    case AttackDieFace.DoubleSupport:
      return { short: "2×S", icon: null, full: "Double Support", isSuccess: false, isCritical: false };
    case AttackDieFace.Blank:
      return { short: "—", icon: null, full: "Blank", isSuccess: false, isCritical: false };
    default:
      return { short: face, icon: null, full: face, isSuccess: false, isCritical: false };
  }
}

function renderSaveFace(face: SaveDieFace): DiceTrayFace {
  switch (face) {
    case SaveDieFace.Critical:
      return { short: "Crit", icon: "/assets/crit.png", full: "Critical", isSuccess: true, isCritical: true };
    case SaveDieFace.Shield:
      return { short: "Shd", icon: "/assets/shield.png", full: "Shield", isSuccess: true, isCritical: false };
    case SaveDieFace.Dodge:
      return { short: "Ddg", icon: "/assets/dodge.png", full: "Dodge", isSuccess: true, isCritical: false };
    case SaveDieFace.Support:
      return { short: "Sup", icon: null, full: "Support", isSuccess: false, isCritical: false };
    case SaveDieFace.DoubleSupport:
      return { short: "2×S", icon: null, full: "Double Support", isSuccess: false, isCritical: false };
    case SaveDieFace.Blank:
      return { short: "—", icon: null, full: "Blank", isSuccess: false, isCritical: false };
    default:
      return { short: face, icon: null, full: face, isSuccess: false, isCritical: false };
  }
}

function getCombatOutcomeLabel(outcome: CombatOutcome): string {
  switch (outcome) {
    case CombatOutcome.Success:
      return "Hit";
    case CombatOutcome.Failure:
      return "Blocked";
    case CombatOutcome.Draw:
      return "Draw";
    default:
      return outcome;
  }
}

function getCombatOutcomeTone(outcome: CombatOutcome): "success" | "failure" | "draw" | "neutral" {
  switch (outcome) {
    case CombatOutcome.Success:
      return "success";
    case CombatOutcome.Failure:
      return "failure";
    case CombatOutcome.Draw:
      return "draw";
    default:
      return "neutral";
  }
}
