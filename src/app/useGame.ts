import { useEffect, useMemo, useState } from "react";
import { chooseAiAction } from "../ai/randomPolicy";
import { getLegal } from "../engine/engine";
import { initialState } from "../engine/state";
import type { GameAction, GameState, LegalAction } from "../engine/types";
import { LocalHostAdapter } from "../network/localHostAdapter";

export function useGame() {
  const [adapter, setAdapter] = useState(() => new LocalHostAdapter(initialState(424242)));
  const [state, setState] = useState<GameState>(adapter.getState());

  useEffect(() => {
    const unsub = adapter.subscribe((next) => setState(next));
    return unsub;
  }, [adapter]);

  const legal = useMemo<LegalAction[]>(() => getLegal(state), [state]);

  const dispatch = (action: GameAction) => {
    adapter.submitAction(action);
  };

  useEffect(() => {
    if (state.winner) return;
    if (state.activeTeam !== "blue") return;

    const timer = window.setTimeout(() => {
      const choice = chooseAiAction(state);
      if (choice.action) {
        adapter.submitAction(choice.action.action);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [adapter, state]);

  const reset = () => {
    const fresh = initialState(424242 + Math.floor(Math.random() * 99999));
    const resetAdapter = new LocalHostAdapter(fresh);
    setAdapter(resetAdapter);
    setState(resetAdapter.getState());
  };

  return {
    state,
    legal,
    dispatch,
    mode: adapter.mode,
    reset,
  };
}
