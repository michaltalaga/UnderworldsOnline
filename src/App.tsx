import { useMemo, useState } from "react";
import { useGame } from "./app/useGame";
import { rivalsDeckOptions, starterWarbandOptions } from "./engine/data/starterData";
import { fighterHealth, fighterName, fighterTeam } from "./engine/state";
import type { LegalAction } from "./engine/types";
import type { RivalsDeckId, WarbandId } from "./engine/data/starterData";
import { Board } from "./ui/Board";
import { DeckPicker } from "./ui/DeckPicker";
import { DiceTray } from "./ui/DiceTray";
import { EventLog } from "./ui/EventLog";
import { HandPanel } from "./ui/HandPanel";
import { Hud } from "./ui/Hud";
import { WarbandPicker } from "./ui/WarbandPicker";
import "./App.css";

const WAR_BAND_STORAGE_KEY = "underworlds:selected-warband";
const RIVALS_DECK_STORAGE_KEY = "underworlds:selected-rivals-deck";

function readSavedWarband(): WarbandId {
  if (typeof window === "undefined") return "emberguard";
  const saved = window.localStorage.getItem(WAR_BAND_STORAGE_KEY);
  return saved === "duskraiders" ? "duskraiders" : "emberguard";
}

function readSavedRivalsDeck(): RivalsDeckId {
  if (typeof window === "undefined") return "blazing-assault";
  const saved = window.localStorage.getItem(RIVALS_DECK_STORAGE_KEY);
  if (saved === "emberstone-hold") return "emberstone-hold";
  if (saved === "nightfall-raids") return "nightfall-raids";
  if (saved === "grave-math") return "grave-math";
  return "blazing-assault";
}

function actionReferencesFighter(action: LegalAction, fighterId: string): boolean {
  const a = action.action;
  return (
    ("fighterId" in a && a.fighterId === fighterId) ||
    ("attackerId" in a && a.attackerId === fighterId) ||
    ("targetId" in a && a.targetId === fighterId)
  );
}

function App() {
  const [playerWarbandId, setPlayerWarbandId] = useState<WarbandId>(() => readSavedWarband());
  const [playerRivalsDeckId, setPlayerRivalsDeckId] = useState<RivalsDeckId>(() => readSavedRivalsDeck());
  const [matchStarted, setMatchStarted] = useState(false);
  const { state, legal, dispatch, mode, reset } = useGame(playerWarbandId, playerRivalsDeckId);
  const [selectedFighterId, setSelectedFighterId] = useState<string | null>(null);
  const [showAllActions, setShowAllActions] = useState(false);

  const handleWarbandSelect = (id: WarbandId) => {
    setPlayerWarbandId(id);
    window.localStorage.setItem(WAR_BAND_STORAGE_KEY, id);
  };

  const handleDeckSelect = (id: RivalsDeckId) => {
    setPlayerRivalsDeckId(id);
    window.localStorage.setItem(RIVALS_DECK_STORAGE_KEY, id);
  };

  const firstAliveActiveTeam = useMemo(
    () => state.teams[state.activeTeam].fighterEntities.find((id) => fighterHealth(state, id).hp > 0) ?? null,
    [state],
  );

  const selectedIsActiveTeam =
    selectedFighterId !== null && fighterTeam(state, selectedFighterId) === state.activeTeam;

  const effectiveSelectedFighterId =
    !showAllActions &&
    selectedFighterId &&
    fighterHealth(state, selectedFighterId).hp > 0 &&
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
    ? {
        name: fighterName(state, effectiveSelectedFighterId),
        hp: fighterHealth(state, effectiveSelectedFighterId).hp,
        maxHp: fighterHealth(state, effectiveSelectedFighterId).maxHp,
      }
    : null;

  const handleSelectFighter = (id: string | null) => {
    if (!id) {
      setSelectedFighterId(null);
      return;
    }

    if (!showAllActions && fighterTeam(state, id) !== state.activeTeam) {
      return;
    }

    setSelectedFighterId(id);
  };

  const returnToWarbandSelection = () => {
    reset();
    setSelectedFighterId(null);
    setShowAllActions(false);
    setMatchStarted(false);
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
        <>
          <WarbandPicker options={starterWarbandOptions} selectedId={playerWarbandId} onSelect={handleWarbandSelect} />
          <DeckPicker
            options={rivalsDeckOptions}
            selectedId={playerRivalsDeckId}
            onSelect={handleDeckSelect}
            onStart={() => setMatchStarted(true)}
          />
        </>
      )}

      {!matchStarted && <p className="muted">Pick a warband and rivals deck, then start the match.</p>}

      {matchStarted && (
        <>
          <Hud state={state} mode={mode} />

          <div className="match-controls">
            <button type="button" onClick={returnToWarbandSelection}>
              Restart Match
            </button>
          </div>

          {state.winner && (
            <div className="winner-banner">
              Winner: {state.winner.toUpperCase()} &nbsp;
              <button onClick={returnToWarbandSelection}>New Match</button>
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
              <DiceTray event={state.diceRollEvent} />

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
                    Focus: <strong>{selectedFighter.name}</strong> ({selectedFighter.hp}/{selectedFighter.maxHp} HP)
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

              <HandPanel state={state} onDispatch={dispatch} />
              <EventLog entries={state.log} />
            </aside>
          </main>
        </>
      )}
    </div>
  );
}

export default App;
