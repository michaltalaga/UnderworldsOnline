import type { ActiveActionMode, FighterContextMenuModel } from "./boardScene";

export type FighterContextMenuProps = {
  model: FighterContextMenuModel;
  mapScale: number;
  onSelectAction: (mode: ActiveActionMode) => void;
  onDismiss: () => void;
  onConfirmGuard: () => void;
};

const toneByMode: Record<string, string> = {
  move: "move",
  charge: "charge",
  attack: "attack",
  guard: "guard",
};

export default function FighterContextMenu({
  model,
  mapScale,
  onSelectAction,
  onDismiss,
  onConfirmGuard,
}: FighterContextMenuProps) {
  if (!model.visible) return null;

  // Guard-armed state: show confirm / cancel instead of action list.
  if (model.guardArmed) {
    return (
      <div
        className="battlefield-context-menu"
        style={{
          left: `${model.left}px`,
          top: `${model.top}px`,
          transform: `scale(${1 / mapScale})`,
          transformOrigin: "top left",
        }}
      >
        <div className="battlefield-context-menu-header">Guard</div>
        <button
          type="button"
          className="battlefield-context-menu-btn battlefield-context-menu-btn-guard battlefield-context-menu-btn-armed"
          onClick={(e) => {
            e.stopPropagation();
            onConfirmGuard();
          }}
        >
          Confirm Guard
        </button>
        <button
          type="button"
          className="battlefield-context-menu-btn battlefield-context-menu-btn-cancel"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  // Normal action menu.
  return (
    <div
      className="battlefield-context-menu"
      style={{
        left: `${model.left}px`,
        top: `${model.top}px`,
        transform: `scale(${1 / mapScale})`,
        transformOrigin: "top left",
      }}
    >
      {model.actions.map((action) => (
        <button
          key={action.mode}
          type="button"
          className={`battlefield-context-menu-btn battlefield-context-menu-btn-${toneByMode[action.mode] ?? "default"}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectAction(action.mode);
          }}
        >
          {action.label}
          {action.count > 0 && (
            <span className="battlefield-context-menu-count">{action.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
