import { useState } from "react";
import "./App.css";
import {
  WeaponAbilityKind,
  type CombatResult,
  type FighterState,
  type Game,
} from "./domain";
import {
  combatDebugScenarios,
  createCombatDebugSnapshot,
  getCombatDebugScenario,
  type CombatDebugSnapshot,
  type CombatDebugDefenderState,
  type CombatDebugScenarioId,
} from "./debug/createCombatDebugGame";

const debugAbilityKinds = Object.values(WeaponAbilityKind);
const supportedDebugAbilities = new Set<WeaponAbilityKind>([
  WeaponAbilityKind.Stagger,
  WeaponAbilityKind.Grievous,
]);

function App() {
  const [scenarioId, setScenarioId] = useState<CombatDebugScenarioId>("success");
  const [defenderHasGuardToken, setDefenderHasGuardToken] = useState(false);
  const [defenderHasStaggerToken, setDefenderHasStaggerToken] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState<WeaponAbilityKind | null>(null);
  const selectedScenario = getCombatDebugScenario(scenarioId);
  const defenderState: CombatDebugDefenderState = {
    hasGuardToken: defenderHasGuardToken,
    hasStaggerToken: defenderHasStaggerToken,
  };
  const debugSnapshot = createCombatDebugSnapshot(scenarioId, defenderState, selectedAbility);
  const debugGame = debugSnapshot.game;
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
        <div className="ability-controls">
          <p className="token-heading">Selected ability</p>
          <div className="roll-switcher" role="group" aria-label="Attacker ability selection">
            <button
              className={`roll-button${selectedAbility === null ? " roll-button-active" : ""}`}
              type="button"
              onClick={() => setSelectedAbility(null)}
              aria-pressed={selectedAbility === null}
            >
              None
            </button>
            {debugAbilityKinds.map((ability) => (
              <button
                key={ability}
                className={`roll-button${selectedAbility === ability ? " roll-button-active" : ""}`}
                type="button"
                onClick={() => setSelectedAbility(ability)}
                aria-pressed={selectedAbility === ability}
              >
                {formatAbilityLabel(ability)}
              </button>
            ))}
          </div>
          <p className="token-description">{formatSelectedAbilityDescription(debugSnapshot)}</p>
          <p className="token-note">
            Current end-to-end support covers the base attack plus <code>Stagger</code> and
            <code> Grievous</code> when the weapon defines them.
          </p>
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
        {debugSnapshot.attackError !== null ? (
          <article className="blocked-card">
            <p className="combat-label">Attack Blocked</p>
            <h3>Selected ability is not supported in the current attack flow.</h3>
            <p className="empty-state">{debugSnapshot.attackError}</p>
          </article>
        ) : latestCombat === null ? (
          <p className="empty-state">No combat has resolved yet.</p>
        ) : (
          <CombatResultCard game={debugGame} result={latestCombat} isLatest />
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Ability Support</p>
          <h2>Ability support on the current weapon</h2>
        </div>
        <div className="ability-status-list">
          {debugAbilityKinds.map((ability) => {
            const definedOnWeapon = debugSnapshot.attackerWeaponAbilities.includes(ability);
            const supported = definedOnWeapon && supportedDebugAbilities.has(ability);

            return (
              <article className="ability-status-card" key={ability}>
                <div>
                  <p className="combat-label">{formatAbilityLabel(ability)}</p>
                  <h3>{debugSnapshot.attackerWeaponName}</h3>
                </div>
                <p className="fighter-meta">
                  {definedOnWeapon ? "Defined on weapon" : "Not defined on weapon"}
                </p>
                <span className={`status-badge ${supported ? "status-supported" : "status-unsupported"}`}>
                  {supported ? "supported" : "unsupported"}
                </span>
              </article>
            );
          })}
        </div>
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
  const selectedAbilityText =
    result.context.selectedAbility === null ? "" : ` using ${formatAbilityLabel(result.context.selectedAbility)}`;

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
        {attackerPlayerName} used {weaponName}{selectedAbilityText} into {defenderPlayerName}.
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

function formatSelectedAbilityDescription(debugSnapshot: CombatDebugSnapshot): string {
  if (debugSnapshot.selectedAbility === null) {
    return `No ability selected. ${debugSnapshot.attackerWeaponName} follows the current supported path.`;
  }

  if (
    debugSnapshot.selectedAbilityDefinedOnWeapon &&
    supportedDebugAbilities.has(debugSnapshot.selectedAbility)
  ) {
    return `${formatAbilityLabel(debugSnapshot.selectedAbility)} is defined on ${debugSnapshot.attackerWeaponName} and now resolves through the current attack flow.`;
  }

  if (debugSnapshot.selectedAbilityDefinedOnWeapon) {
    return `${formatAbilityLabel(debugSnapshot.selectedAbility)} is defined on ${debugSnapshot.attackerWeaponName}, but it is still unsupported in the current attack flow.`;
  }

  if (debugSnapshot.attackerWeaponAbilities.length === 0) {
    return `${debugSnapshot.attackerWeaponName} defines no abilities, so ${formatAbilityLabel(debugSnapshot.selectedAbility)} is only a debug probe right now.`;
  }

  return `${formatAbilityLabel(debugSnapshot.selectedAbility)} is not defined on ${debugSnapshot.attackerWeaponName}. Defined abilities: ${formatAbilityList(debugSnapshot.attackerWeaponAbilities)}.`;
}

function formatAbilityLabel(ability: WeaponAbilityKind): string {
  return ability.charAt(0).toUpperCase() + ability.slice(1);
}

function formatAbilityList(abilities: readonly WeaponAbilityKind[]): string {
  return abilities.map(formatAbilityLabel).join(", ");
}

export default App;
