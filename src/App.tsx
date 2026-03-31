import { useState } from "react";
import "./App.css";
import type { CombatResult, FighterState, Game } from "./domain";
import {
  combatDebugScenarios,
  createCombatDebugGame,
  getCombatDebugScenario,
  type CombatDebugDefenderState,
  type CombatDebugScenarioId,
} from "./debug/createCombatDebugGame";

function App() {
  const [scenarioId, setScenarioId] = useState<CombatDebugScenarioId>("success");
  const [defenderHasGuardToken, setDefenderHasGuardToken] = useState(false);
  const [defenderHasStaggerToken, setDefenderHasStaggerToken] = useState(false);
  const selectedScenario = getCombatDebugScenario(scenarioId);
  const defenderState: CombatDebugDefenderState = {
    hasGuardToken: defenderHasGuardToken,
    hasStaggerToken: defenderHasStaggerToken,
  };
  const debugGame = createCombatDebugGame(scenarioId, defenderState);
  const latestCombat = debugGame.lastCombatResult;
  const recentEvents = debugGame.eventLog.slice(-8).reverse();

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Combat Debug View</p>
        <h1>Latest combat result and history are now visible in the browser.</h1>
        <p className="hero-copy">
          This screen uses the existing setup fixture, runs a short deterministic move/pass
          sequence through the real engine, and stops after one resolved attack.
        </p>
        <div className="roll-controls">
          <div className="roll-switcher" role="tablist" aria-label="Combat roll presets">
            {combatDebugScenarios.map((scenario) => (
              <button
                key={scenario.id}
                className={`roll-button${scenario.id === scenarioId ? " roll-button-active" : ""}`}
                type="button"
                onClick={() => setScenarioId(scenario.id)}
                aria-pressed={scenario.id === scenarioId}
              >
                {scenario.label}
              </button>
            ))}
          </div>
          <p className="roll-description">{selectedScenario.description}</p>
          <p className="roll-preview">
            Attack: <code>{formatRoll(selectedScenario.attackRoll)}</code>
            {"  "}
            Save: <code>{formatRoll(selectedScenario.saveRoll)}</code>
          </p>
        </div>
        <div className="token-controls">
          <p className="token-heading">Defender tokens</p>
          <div className="roll-switcher" role="group" aria-label="Defender token toggles">
            <button
              className={`roll-button${defenderHasGuardToken ? " roll-button-active" : ""}`}
              type="button"
              onClick={() => setDefenderHasGuardToken((value) => !value)}
              aria-pressed={defenderHasGuardToken}
            >
              Guard
            </button>
            <button
              className={`roll-button${defenderHasStaggerToken ? " roll-button-active" : ""}`}
              type="button"
              onClick={() => setDefenderHasStaggerToken((value) => !value)}
              aria-pressed={defenderHasStaggerToken}
            >
              Stagger
            </button>
          </div>
          <p className="token-description">{formatDefenderStateDescription(defenderState)}</p>
          {defenderHasGuardToken && defenderHasStaggerToken ? (
            <p className="token-note">
              Stagger currently suppresses the defender&apos;s guard benefit in combat resolution.
            </p>
          ) : null}
        </div>
        <dl className="overview-grid">
          <div>
            <dt>State</dt>
            <dd>{debugGame.state.kind}</dd>
          </div>
          <div>
            <dt>Phase</dt>
            <dd>{debugGame.phase}</dd>
          </div>
          <div>
            <dt>Turn Step</dt>
            <dd>{debugGame.turnStep ?? "n/a"}</dd>
          </div>
          <div>
            <dt>Active Player</dt>
            <dd>{getPlayerName(debugGame, debugGame.activePlayerId)}</dd>
          </div>
          <div>
            <dt>Round</dt>
            <dd>{debugGame.roundNumber}</dd>
          </div>
          <div>
            <dt>Combat History</dt>
            <dd>{debugGame.combatHistory.length}</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Last Combat</p>
          <h2>Resolved attack summary</h2>
        </div>
        {latestCombat === null ? (
          <p className="empty-state">No combat has resolved yet.</p>
        ) : (
          <CombatResultCard game={debugGame} result={latestCombat} isLatest />
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">History</p>
          <h2>Combat results</h2>
        </div>
        <div className="history-list">
          {debugGame.combatHistory.map((result, index) => (
            <CombatResultCard
              key={`${result.context.attackerFighterId}:${result.context.targetFighterId}:${index}`}
              game={debugGame}
              result={result}
              label={`Attack ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="panel split-panel">
        <div>
          <div className="section-heading">
            <p className="eyebrow">Board Snapshot</p>
            <h2>Fighters after the attack</h2>
          </div>
          <div className="fighter-list">
            {debugGame.players.flatMap((player) =>
              player.fighters.map((fighter) => (
                <article className="fighter-card" key={fighter.id}>
                  <p className="fighter-owner">{player.name}</p>
                  <h3>{getFighterName(debugGame, fighter.id)}</h3>
                  <p className="fighter-meta">{fighter.currentHexId ?? "slain / off-board"}</p>
                  <p className="fighter-meta">Damage: {fighter.damage}</p>
                  <p className="fighter-meta">Tokens: {formatFighterTokens(fighter)}</p>
                </article>
              )),
            )}
          </div>
        </div>

        <div>
          <div className="section-heading">
            <p className="eyebrow">Event Log</p>
            <h2>Recent engine events</h2>
          </div>
          <ol className="event-list">
            {recentEvents.map((event, index) => (
              <li key={`${event}:${index}`}>{event}</li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}

type CombatResultCardProps = {
  game: Game;
  result: CombatResult;
  isLatest?: boolean;
  label?: string;
};

function CombatResultCard({
  game,
  result,
  isLatest = false,
  label = "Recorded attack",
}: CombatResultCardProps) {
  const attackerName = getFighterName(game, result.context.attackerFighterId);
  const defenderName = getFighterName(game, result.context.targetFighterId);
  const attackerPlayerName = getPlayerName(game, result.context.attackerPlayerId);
  const defenderPlayerName = getPlayerName(game, result.context.defenderPlayerId);
  const weaponName = getWeaponName(game, result.context.attackerFighterId, result.context.weaponId);

  return (
    <article className={`combat-card${isLatest ? " combat-card-latest" : ""}`}>
      <div className="combat-card-header">
        <div>
          <p className="combat-label">{label}</p>
          <h3>
            {attackerName} attacked {defenderName}
          </h3>
        </div>
        <span className={`outcome-badge outcome-${result.outcome}`}>{result.outcome}</span>
      </div>

      <p className="combat-meta">
        {attackerPlayerName} used {weaponName} into {defenderPlayerName}.
      </p>

      <dl className="combat-grid">
        <div>
          <dt>Attack Roll</dt>
          <dd>{formatRoll(result.attackRoll)}</dd>
        </div>
        <div>
          <dt>Save Roll</dt>
          <dd>{formatRoll(result.saveRoll)}</dd>
        </div>
        <div>
          <dt>Successes</dt>
          <dd>
            {result.attackSuccesses} vs {result.saveSuccesses}
          </dd>
        </div>
        <div>
          <dt>Criticals</dt>
          <dd>
            {result.attackCriticals} vs {result.saveCriticals}
          </dd>
        </div>
        <div>
          <dt>Damage</dt>
          <dd>{result.damageInflicted}</dd>
        </div>
        <div>
          <dt>Effects</dt>
          <dd>{formatCombatEffects(result)}</dd>
        </div>
      </dl>
    </article>
  );
}

function getPlayerName(game: Game, playerId: string | null): string {
  if (playerId === null) {
    return "None";
  }

  return game.getPlayer(playerId)?.name ?? playerId;
}

function getFighterName(game: Game, fighterId: string): string {
  for (const player of game.players) {
    const fighterDefinition = player.getFighterDefinition(fighterId);
    if (fighterDefinition !== undefined) {
      return fighterDefinition.name;
    }
  }

  return fighterId;
}

function getWeaponName(game: Game, fighterId: string, weaponId: string): string {
  for (const player of game.players) {
    const fighterDefinition = player.getFighterDefinition(fighterId);
    const weapon = fighterDefinition?.weapons.find((candidate) => candidate.id === weaponId);
    if (weapon !== undefined) {
      return weapon.name;
    }
  }

  return weaponId;
}

function formatRoll(roll: readonly string[]): string {
  return roll.length === 0 ? "None" : roll.join(" / ");
}

function formatCombatEffects(result: CombatResult): string {
  const effects: string[] = [];

  if (result.targetSlain) {
    effects.push("target slain");
  }

  if (result.staggerApplied) {
    effects.push("stagger applied");
  }

  if (result.targetMoved) {
    effects.push("target moved");
  }

  if (result.attackerMoved) {
    effects.push("attacker moved");
  }

  return effects.length === 0 ? "none" : effects.join(", ");
}

function formatFighterTokens(fighter: FighterState): string {
  const tokens: string[] = [];

  if (fighter.hasMoveToken) {
    tokens.push("move");
  }

  if (fighter.hasChargeToken) {
    tokens.push("charge");
  }

  if (fighter.hasGuardToken) {
    tokens.push("guard");
  }

  if (fighter.hasStaggerToken) {
    tokens.push("stagger");
  }

  return tokens.length === 0 ? "none" : tokens.join(", ");
}

function formatDefenderStateDescription(defenderState: CombatDebugDefenderState): string {
  const states: string[] = [];

  if (defenderState.hasGuardToken) {
    states.push("guarded");
  }

  if (defenderState.hasStaggerToken) {
    states.push("staggered");
  }

  return states.length === 0 ? "Defender starts clean." : `Defender starts ${states.join(" and ")}.`;
}

export default App;
