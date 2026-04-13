import type { ActiveActionMode, FighterContextMenuModel } from "./boardScene";

export type FighterContextMenuProps = {
  model: FighterContextMenuModel;
  counterZoom: string;
  onSelectAction: (mode: ActiveActionMode) => void;
  onDismiss: () => void;
  onConfirmGuard: () => void;
};

const menuBase = "absolute z-20 min-w-[110px] p-2 rounded-button bg-[rgba(255,251,245,0.97)] border border-[rgba(112,91,66,0.2)] shadow-[0_16px_30px_rgba(35,24,18,0.22)] backdrop-blur-[10px] flex flex-col gap-[5px] pointer-events-auto";

const btnBase = "flex items-center justify-between gap-2 border border-[rgba(84,63,45,0.14)] rounded-[10px] py-2 px-3 font-[inherit] text-[0.85rem] font-bold cursor-pointer transition-all duration-100 ease-in-out shadow-[0_4px_10px_rgba(35,24,18,0.1)] hover:-translate-y-px hover:shadow-[0_6px_14px_rgba(35,24,18,0.16)]";

const toneBg: Record<string, string> = {
  move: "bg-linear-to-b from-[rgba(220,245,240,0.98)] to-[rgba(175,225,218,0.98)] text-move",
  charge: "bg-linear-to-b from-[rgba(252,243,220,0.98)] to-[rgba(240,215,160,0.98)] text-[#6e5520]",
  attack: "bg-linear-to-b from-[rgba(250,228,228,0.98)] to-[rgba(235,190,190,0.98)] text-[#7a2a2a]",
  guard: "bg-linear-to-b from-[rgba(250,250,250,0.98)] to-[rgba(229,232,235,0.98)] text-[#2f3941]",
};

export default function FighterContextMenu({
  model,
  counterZoom,
  onSelectAction,
  onDismiss,
  onConfirmGuard,
}: FighterContextMenuProps) {
  if (!model.visible) return null;

  const posStyle = {
    left: `${model.left}px`,
    top: `${model.top}px`,
    zoom: counterZoom,
  };

  if (model.guardArmed) {
    return (
      <div data-context-menu className={menuBase} style={posStyle}>
        <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.06em] text-ink-muted px-1.5 py-0.5">
          Guard
        </div>
        <button
          type="button"
          className={`${btnBase} ${toneBg.guard} shadow-[inset_0_0_0_2px_rgba(255,255,255,0.9),0_0_0_3px_rgba(60,120,180,0.3),0_6px_14px_rgba(35,24,18,0.16)]`}
          onClick={(e) => { e.stopPropagation(); onConfirmGuard(); }}
        >
          Confirm Guard
        </button>
        <button
          type="button"
          className={`${btnBase} !bg-transparent !border-[rgba(84,63,45,0.2)] text-ink-muted !font-semibold !shadow-none hover:!bg-[rgba(244,236,220,0.5)]`}
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className={menuBase} style={posStyle}>
      {model.actions.map((action) => (
        <button
          key={action.mode}
          type="button"
          className={`${btnBase} ${toneBg[action.mode] ?? ""}`}
          onClick={(e) => { e.stopPropagation(); onSelectAction(action.mode); }}
        >
          {action.label}
          {action.count > 0 && (
            <span className="text-[0.72rem] font-extrabold opacity-60">{action.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
