import { useState, type ReactNode } from "react";

// A collapsible floating panel that hosts debug/info sections which used
// to live in the main layout (action lens, warbands, feature tokens,
// match log, hero stats). Fixed top-left of the viewport, toggles between
// a tiny button and a scrollable body.
type DebugPanelProps = {
  children: ReactNode;
};

export default function DebugPanel({ children }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside
      className={["debug-panel", isOpen ? "debug-panel-open" : "debug-panel-closed"].join(" ")}
    >
      <button
        type="button"
        className="debug-panel-toggle"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
      >
        {isOpen ? "Hide debug" : "Show debug"}
      </button>
      {isOpen ? <div className="debug-panel-body">{children}</div> : null}
    </aside>
  );
}
