import type { GameState } from "../engine/types";

type HudProps = {
  state: GameState;
  mode: string;
};

export function Hud({ state, mode }: HudProps) {
  const powerDetail =
    state.turnStep === "power"
      ? `Priority ${state.powerPriorityTeam.toUpperCase()} | Passes ${state.powerPassCount}/2`
      : `First ${state.firstTeam.toUpperCase()}`;

  return (
    <div className="hud">
      <div className="pill">Mode: {mode}</div>
      <div className="pill">Round: {state.round}/3</div>
      <div className="pill">Turn: {Math.min(state.turnInRound, 8)}/8</div>
      <div className="pill">Step: {state.turnStep}</div>
      <div className="pill active">Active: {state.activeTeam.toUpperCase()}</div>
      <div className="pill">{powerDetail}</div>
      <div className="pill glory">Red Glory: {state.teams.red.glory}</div>
      <div className="pill glory">Blue Glory: {state.teams.blue.glory}</div>
    </div>
  );
}
