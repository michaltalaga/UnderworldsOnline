import { useMemo, useState } from "react";
import { useGame } from "./app/useGame";
import { starterWarbandOptions } from "./engine/data/starterData";
import type { LegalAction } from "./engine/types";
import type { WarbandId } from "./engine/data/starterData";
import { Board } from "./ui/Board";
import { EventLog } from "./ui/EventLog";
import { HandPanel } from "./ui/HandPanel";
import { Hud } from "./ui/Hud";
import { WarbandPicker } from "./ui/WarbandPicker";
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
  const [playerWarbandId, setPlayerWarbandId] = useState<WarbandId>("emberguard");
  const [matchStarted, setMatchStarted] = useState(false);
  const { state, legal, dispatch, mode, reset } = useGame(playerWarbandId);
  const [selectedFighterId, setSelectedFighterId] = useState<string | null>(null);
  const [showAllActions, setShowAllActions] = useState(false);

  const firstAliveActiveTeam = useMemo(
    () => state.teams[state.activeTeam].fighters.find((id) => state.components.fighters[id].hp > 0) ?? null,
    [state],
  );

  const selectedIsActiveTeam =
    selectedFighterId !== null && state.components.fighters[selectedFighterId]?.team === state.activeTeam;

  const effectiveSelectedFighterId =
    !showAllActions &&
    selectedFighterId &&
    state.components.fighters[selectedFighterId]?.hp > 0 &&
    selectedIsActiveTeam
      ? selectedFighterId
      : !showAllActions
        ? firstAliveActiveTeam
        : selectedFighterId;

  const visibleActions = useMemo(() => {
    if (showAllActions || !effectiveSelectedFighterId) return legal;
    return legal.filter((a) => actionReferencesFighter(a, effectiveSelectedFighterId));
  }, [effectiveSelectedFighterId, legal, showAllActions]);

  const groupedActions = useMemo(() => {
    const groups: Record<string, LegalAction[]> = {
      Move: [],
      Attack: [],
      Charge: [],
      Power: [],
      Other: [],
    };

    visibleActions.forEach((l) => {
      const t = l.action.type;
      if (t === "move") groups.Move.push(l);
      else if (t === "attack") groups.Attack.push(l);
      else if (t === "charge") groups.Charge.push(l);
      else if (t === "play-power") groups.Power.push(l);
      else groups.Other.push(l);
    });

    return groups;
  }, [visibleActions]);

  const selectedFighter = effectiveSelectedFighterId
    ? state.components.fighters[effectiveSelectedFighterId]
    : null;

  const handleSelectFighter = (id: string | null) => {
    if (!id) {
      setSelectedFighterId(null);
      return;
    }

    const fighter = state.components.fighters[id];
    if (!showAllActions && fighter.team !== state.activeTeam) {
      return;
    }

    setSelectedFighterId(id);
  };

  return (
    <div className="app-root">
      <header className="hero">
        <h1>Underworlds Embergard MVP</h1>
        <p>
          Deterministic ECS-style engine, cards-lite rules, random-legal AI, and host-authoritative multiplayer seam.
        </p>
      </header>

      {!matchStarted && (
        <WarbandPicker
          options={starterWarbandOptions}
          selectedId={playerWarbandId}
          onSelect={setPlayerWarbandId}
          onStart={() => setMatchStarted(true)}
        />
      )}

      {!matchStarted && <p className="muted">Pick a warband, then start the match.</p>}

      {matchStarted && (
        <>
          <Hud state={state} mode={mode} />

          {state.winner && (
            <div className="winner-banner">
              Winner: {state.winner.toUpperCase()} &nbsp;
              <button onClick={reset}>New Match</button>
            </div>
          )}

          <main className="layout">
            <section className="board-col">
              <Board
                state={state}
                selectedFighterId={effectiveSelectedFighterId}
                onSelectFighter={handleSelectFighter}
              />
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

                {!showAllActions && selectedFighter && (
                  <div className="focus-box">
                    Focus: <strong>{selectedFighter.name}</strong> ({selectedFighter.hp}/{selectedFighter.stats.maxHp} HP)
                  </div>
                )}

                <div className="actions">
                  {Object.entries(groupedActions).map(([groupName, actions]) => {
                    if (actions.length === 0) return null;
                    return (
                      <div className="action-group" key={groupName}>
                        <h4>
                          {groupName} <span>({actions.length})</span>
                        </h4>
                        {actions.map((l, idx) => (
                          <button
                            key={`${groupName}-${l.label}-${idx}`}
                            className="action-btn"
                            onClick={() => {
                              dispatch(l.action);
                            }}
                            disabled={state.activeTeam !== "red" || Boolean(state.winner)}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                  {visibleActions.length === 0 && <p className="muted">No legal actions.</p>}
                </div>
              </div>

              <HandPanel state={state} />
              <EventLog entries={state.log} />
            </aside>
          </main>
        </>
      )}
    </div>
  );
}

export default App;
