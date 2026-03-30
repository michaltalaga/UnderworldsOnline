import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { chooseAiAction } from "../ai/randomPolicy";
import { opposingRivalsDeckId, oppositeWarbandId } from "../engine/data/starterData";
import { getLegal } from "../engine/engine";
import { initialState } from "../engine/state";
import type { GameAction, LegalAction } from "../engine/types";
import type { RivalsDeckId, WarbandId } from "../engine/data/starterData";
import { LocalHostAdapter } from "../network/localHostAdapter";

export function useGame(playerWarbandId: WarbandId, playerRivalsDeckId: RivalsDeckId) {
  const [seed, setSeed] = useState(424242);

  const adapter = useMemo(
    () =>
      new LocalHostAdapter(
        initialState(seed, {
          redWarbandId: playerWarbandId,
          blueWarbandId: oppositeWarbandId(playerWarbandId),
          redRivalsDeckId: playerRivalsDeckId,
          blueRivalsDeckId: opposingRivalsDeckId(playerRivalsDeckId),
        }),
      ),
    [playerWarbandId, playerRivalsDeckId, seed],
  );

  const state = useSyncExternalStore(adapter.subscribe.bind(adapter), adapter.getState.bind(adapter));

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
    setSeed(424242 + Math.floor(Math.random() * 99999));
  };

  return {
    state,
    legal,
    dispatch,
    mode: adapter.mode,
    reset,
  };
}
