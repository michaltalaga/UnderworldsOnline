import type { BoardTurnHeaderModel } from "./battlefieldModels";

export type StatusBarProps = {
  badge: BoardTurnHeaderModel;
};

const stepToneClasses: Record<string, string> = {
  action: "bg-[rgba(141,92,13,0.14)] text-[#6e4513]",
  power: "bg-[rgba(68,118,124,0.14)] text-power-step",
  neutral: "bg-[rgba(112,91,66,0.12)] text-[#5a4a38]",
};

export default function StatusBar({ badge }: StatusBarProps) {
  return (
    <header className="shrink-0 basis-8 w-full flex items-center justify-center gap-2.5 px-4 py-1 bg-[rgba(253,249,242,0.92)] border-b border-[rgba(85,66,40,0.1)] h-8 box-border text-[0.75rem] overflow-hidden">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-pill font-extrabold text-[0.68rem] uppercase tracking-[0.06em] ${stepToneClasses[badge.tone] ?? stepToneClasses.neutral}`}>
        {badge.stepLabel}
      </span>
      {badge.roundLabel !== null && (
        <span className="font-bold text-ink-muted">{badge.roundLabel}</span>
      )}
      <strong className="font-extrabold text-[#3a2e24]">{badge.activePlayerName}</strong>
      {badge.scores !== null && badge.scores.length > 0 && (
        <span className="flex gap-3 text-ink-muted">
          {badge.scores.map((s) => (
            <span key={s.name}>
              {s.name}: <strong className="text-[#3a2e24]">{s.glory}</strong>
            </span>
          ))}
        </span>
      )}
    </header>
  );
}
