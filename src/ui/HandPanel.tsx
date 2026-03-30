import type { GameState } from "../engine/types";

type HandPanelProps = {
  state: GameState;
};

export function HandPanel({ state }: HandPanelProps) {
  const team = state.teams.red;
  return (
    <div className="panel hand-panel">
      <h3>Your Hand (Red)</h3>
      <div className="section">
        <h4>Objectives</h4>
        <ul>
          {team.objectiveHand.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
          {team.objectiveHand.length === 0 && <li className="muted">No objectives in hand</li>}
        </ul>
      </div>
      <div className="section">
        <h4>Power Cards</h4>
        <ul>
          {team.powerHand.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
          {team.powerHand.length === 0 && <li className="muted">No power cards in hand</li>}
        </ul>
      </div>
    </div>
  );
}
