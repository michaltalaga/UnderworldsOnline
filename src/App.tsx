import { useMemo, useState } from "react";
import { useGame } from "./app/useGame";
import type { LegalAction } from "./engine/types";
import { Board } from "./ui/Board";
import { EventLog } from "./ui/EventLog";
import { HandPanel } from "./ui/HandPanel";
import { Hud } from "./ui/Hud";
import "./App.css";

function actionReferencesFighter(action: LegalAction, fighterId: string): boolean {
  const a = action.action;
  return (
    ("fighterId" in a && a.fighterId === fighterId) ||
    ("attackerId" in a && a.attackerId === fighterId) ||
    ("targetId" in a && a.targetId === fighterId)
  );
}

function App() {
  const { state, legal, dispatch, mode, reset } = useGame();
  const [selectedFighterId, setSelectedFighterId] = useState<string | null>(null);
  const [showAllActions, setShowAllActions] = useState(false);

  const visibleActions = useMemo(() => {
    if (showAllActions || !selectedFighterId) return legal;
    return legal.filter((a) => actionReferencesFighter(a, selectedFighterId));
  }, [legal, selectedFighterId, showAllActions]);

  return (
    <div className="app-root">
      <header className="hero">
        <h1>Underworlds Embergard MVP</h1>
        <p>
          Deterministic ECS-style engine, cards-lite rules, random-legal AI, and host-authoritative multiplayer seam.
        </p>
      </header>

      <Hud state={state} mode={mode} />

      {state.winner && (
        <div className="winner-banner">
          Winner: {state.winner.toUpperCase()} &nbsp;
          <button onClick={reset}>New Match</button>
        </div>
      )}

      <main className="layout">
        <section className="board-col">
          <Board state={state} selectedFighterId={selectedFighterId} onSelectFighter={setSelectedFighterId} />
        </section>

        <aside className="side-col">
          <div className="panel action-panel">
            <h3>Actions ({state.activeTeam})</h3>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={showAllActions}
                onChange={(e) => setShowAllActions(e.target.checked)}
              />
              Show all actions
            </label>
            <div className="actions">
              {visibleActions.map((l, idx) => (
                <button
                  key={`${l.label}-${idx}`}
                  className="action-btn"
                  onClick={() => {
                    dispatch(l.action);
                    setSelectedFighterId(null);
                  }}
                  disabled={state.activeTeam !== "red" || Boolean(state.winner)}
                >
                  {l.label}
                </button>
              ))}
              {visibleActions.length === 0 && <p className="muted">No legal actions.</p>}
            </div>
          </div>

          <HandPanel state={state} />
          <EventLog entries={state.log} />
        </aside>
      </main>
    </div>
  );
}

export default App;
