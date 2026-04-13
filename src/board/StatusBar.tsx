import type { BoardTurnHeaderModel } from "./battlefieldModels";

export type StatusBarProps = {
  badge: BoardTurnHeaderModel;
};

export default function StatusBar({ badge }: StatusBarProps) {
  return (
    <header className={`status-bar status-bar-${badge.tone}`}>
      <span className={`status-bar-step status-bar-step-${badge.tone}`}>
        {badge.stepLabel}
      </span>
      {badge.roundLabel !== null && (
        <span className="status-bar-round">{badge.roundLabel}</span>
      )}
      <strong className="status-bar-player">{badge.activePlayerName}</strong>
      {badge.scores !== null && badge.scores.length > 0 && (
        <span className="status-bar-scores">
          {badge.scores.map((s) => (
            <span key={s.name} className="status-bar-score">
              {s.name}: <strong>{s.glory}</strong>
            </span>
          ))}
        </span>
      )}
    </header>
  );
}
