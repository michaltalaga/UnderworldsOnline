import {
  AttackDieFace,
  CombatOutcome,
  SaveDieFace,
  type CombatResult,
  type Game,
} from "../domain";
import { getFighterName } from "./battlefieldFormatters";

// A dedicated panel that shows the most recent combat's raw dice rolls.
// The full `CombatResult` is already stored in the game event log — this
// component just projects it into a readable tray of dice face tiles so
// the player can see what actually happened rather than only the summary.
//
// When no combat has resolved yet, the tray renders an empty state.
export type CombatDiceTrayProps = {
  game: Game;
  combatResult: CombatResult | null;
};

export default function CombatDiceTray({ game, combatResult }: CombatDiceTrayProps) {
  if (combatResult === null) {
    return (
      <section className="battlefield-panel combat-dice-tray combat-dice-tray-empty">
        <div className="battlefield-heading">
          <p className="battlefield-eyebrow">Dice Tray</p>
          <h2>No attacks resolved</h2>
        </div>
        <p className="combat-dice-tray-empty-copy">
          Attack dice and save dice from the most recent combat will appear here.
        </p>
      </section>
    );
  }

  const attackerName = getFighterName(game, combatResult.context.attackerFighterId);
  const targetName = getFighterName(game, combatResult.context.targetFighterId);
  const outcomeLabel = getOutcomeLabel(combatResult.outcome);
  const outcomeTone = getOutcomeTone(combatResult.outcome);

  return (
    <section className={`battlefield-panel combat-dice-tray combat-dice-tray-${outcomeTone}`}>
      <div className="battlefield-heading">
        <p className="battlefield-eyebrow">Dice Tray</p>
        <h2>
          {attackerName} <span className="combat-dice-tray-arrow">→</span> {targetName}
        </h2>
        <p className="combat-dice-tray-summary">
          <span className={`combat-dice-tray-outcome combat-dice-tray-outcome-${outcomeTone}`}>
            {outcomeLabel}
          </span>
          {" · "}
          {combatResult.damageInflicted} damage
          {combatResult.targetSlain ? " · slain" : ""}
        </p>
      </div>

      <div className="combat-dice-tray-rolls">
        <CombatDiceRoll
          label="Attack"
          tone="attack"
          faces={combatResult.attackRoll}
          renderFace={renderAttackFace}
          summary={`${combatResult.attackSuccesses} hits · ${combatResult.attackCriticals} crits`}
        />
        <CombatDiceRoll
          label="Save"
          tone="save"
          faces={combatResult.saveRoll}
          renderFace={renderSaveFace}
          summary={`${combatResult.saveSuccesses} blocks · ${combatResult.saveCriticals} crits`}
        />
      </div>
    </section>
  );
}

function CombatDiceRoll<T extends string>({
  label,
  tone,
  faces,
  renderFace,
  summary,
}: {
  label: string;
  tone: "attack" | "save";
  faces: readonly T[];
  renderFace: (face: T) => { short: string; full: string; isSuccess: boolean; isCritical: boolean };
  summary: string;
}) {
  return (
    <div className={`combat-dice-roll combat-dice-roll-${tone}`}>
      <div className="combat-dice-roll-header">
        <p className="combat-dice-roll-label">{label}</p>
        <p className="combat-dice-roll-summary">{summary}</p>
      </div>
      {faces.length === 0 ? (
        <p className="combat-dice-roll-empty">No dice rolled.</p>
      ) : (
        <ul className="combat-dice-roll-list">
          {faces.map((face, index) => {
            const rendered = renderFace(face);
            const classes = [
              "combat-dice-face",
              `combat-dice-face-${tone}`,
              rendered.isCritical ? "combat-dice-face-critical" : "",
              rendered.isSuccess ? "combat-dice-face-success" : "",
            ].filter(Boolean).join(" ");
            return (
              <li key={`${face}:${index}`} className={classes} title={rendered.full}>
                {rendered.short}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// --- Face formatting -----------------------------------------------------

function renderAttackFace(face: AttackDieFace): {
  short: string;
  full: string;
  isSuccess: boolean;
  isCritical: boolean;
} {
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

function renderSaveFace(face: SaveDieFace): {
  short: string;
  full: string;
  isSuccess: boolean;
  isCritical: boolean;
} {
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

function getOutcomeLabel(outcome: CombatOutcome): string {
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

function getOutcomeTone(outcome: CombatOutcome): "success" | "failure" | "draw" {
  switch (outcome) {
    case CombatOutcome.Success:
      return "success";
    case CombatOutcome.Failure:
      return "failure";
    case CombatOutcome.Draw:
      return "draw";
    default:
      return "draw";
  }
}
