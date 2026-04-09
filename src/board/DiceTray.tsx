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

export default function DiceTray({ model }: DiceTrayProps) {
  if (model === null) {
    // Hide entirely when there's nothing to show — the tray is docked
    // top-right as an overlay and an empty panel would clutter the
    // corner. It pops back in (with the entrance animation) the next
    // time a dice-producing event lands.
    return null;
  }

  return (
    <section
      key={model.rollId}
      className={`dice-tray dice-tray-${model.outcomeTone}`}
      aria-live="polite"
    >
      <div className="dice-tray-heading">
        <p className="dice-tray-eyebrow">{model.kindLabel}</p>
        <h3>{model.title}</h3>
        <p className="dice-tray-summary">
          <span className={`dice-tray-outcome dice-tray-outcome-${model.outcomeTone}`}>
            {model.outcomeLabel}
          </span>
          {model.subtitle === null ? null : <> · {model.subtitle}</>}
        </p>
      </div>

      <div className="dice-tray-rolls">
        {model.rolls.map((roll) => (
          <DiceTrayRollSection key={roll.label} roll={roll} />
        ))}
      </div>
    </section>
  );
}

function DiceTrayRollSection({ roll }: { roll: DiceTrayRoll }) {
  return (
    <div className={`dice-tray-roll dice-tray-roll-${roll.tone}`}>
      <div className="dice-tray-roll-header">
        <p className="dice-tray-roll-label">{roll.label}</p>
        <p className="dice-tray-roll-summary">{roll.summary}</p>
      </div>
      {roll.faces.length === 0 ? (
        <p className="dice-tray-roll-empty">No dice rolled.</p>
      ) : (
        <ul className="dice-tray-roll-list">
          {roll.faces.map((face, index) => (
            <li
              key={`${face.short}:${index}`}
              className={[
                "dice-tray-face",
                `dice-tray-face-${roll.tone}`,
                face.isCritical ? "dice-tray-face-critical" : "",
                face.isSuccess ? "dice-tray-face-success" : "",
              ].filter(Boolean).join(" ")}
              title={face.full}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              {face.short}
            </li>
          ))}
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
  return game.getPlayer(playerId)?.name ?? playerId;
}

// --- Face formatting -----------------------------------------------------

function renderAttackFace(face: AttackDieFace): DiceTrayFace {
  switch (face) {
    case AttackDieFace.Critical:
      return { short: "Crit", full: "Critical", isSuccess: true, isCritical: true };
    case AttackDieFace.Hammer:
      return { short: "Ham", full: "Hammer", isSuccess: true, isCritical: false };
    case AttackDieFace.Sword:
      return { short: "Swd", full: "Sword", isSuccess: true, isCritical: false };
    case AttackDieFace.Support:
      return { short: "Sup", full: "Support", isSuccess: false, isCritical: false };
    case AttackDieFace.DoubleSupport:
      return { short: "2×Sup", full: "Double Support", isSuccess: false, isCritical: false };
    case AttackDieFace.Blank:
      return { short: "—", full: "Blank", isSuccess: false, isCritical: false };
    default:
      return { short: face, full: face, isSuccess: false, isCritical: false };
  }
}

function renderSaveFace(face: SaveDieFace): DiceTrayFace {
  switch (face) {
    case SaveDieFace.Critical:
      return { short: "Crit", full: "Critical", isSuccess: true, isCritical: true };
    case SaveDieFace.Shield:
      return { short: "Shd", full: "Shield", isSuccess: true, isCritical: false };
    case SaveDieFace.Dodge:
      return { short: "Ddg", full: "Dodge", isSuccess: true, isCritical: false };
    case SaveDieFace.Support:
      return { short: "Sup", full: "Support", isSuccess: false, isCritical: false };
    case SaveDieFace.DoubleSupport:
      return { short: "2×Sup", full: "Double Support", isSuccess: false, isCritical: false };
    case SaveDieFace.Blank:
      return { short: "—", full: "Blank", isSuccess: false, isCritical: false };
    default:
      return { short: face, full: face, isSuccess: false, isCritical: false };
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
