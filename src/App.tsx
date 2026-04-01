import { useState } from "react";
import "./App.css";
import {
  WeaponAbilityDefinition,
  WeaponAbilityKind,
  WarscrollAbilityEffectKind,
  type CombatResult,
  type FighterState,
  type Game,
  type WarscrollAbilityEffect,
} from "./domain";
import {
  combatDebugScenarios,
  createCombatDebugSnapshot,
  createEndPhaseDebugSnapshot,
  getCombatDebugScenario,
  type CombatDebugSnapshot,
  type CombatDebugDefenderState,
  type CombatDebugScenarioId,
} from "./debug/createCombatDebugGame";

const debugAbilityKinds = Object.values(WeaponAbilityKind);
const supportedDebugAbilities = new Set<WeaponAbilityKind>([
  WeaponAbilityKind.Stagger,
  WeaponAbilityKind.Grievous,
  WeaponAbilityKind.Cleave,
  WeaponAbilityKind.Ensnare,
  WeaponAbilityKind.Brutal,
]);

function App() {
  const [scenarioId, setScenarioId] = useState<CombatDebugScenarioId>("success");
  const [defenderHasGuardToken, setDefenderHasGuardToken] = useState(false);
  const [defenderHasStaggerToken, setDefenderHasStaggerToken] = useState(false);
  const [defenderIsOnCoverToken, setDefenderIsOnCoverToken] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState<WeaponAbilityKind | null>(null);
  const [selectedWarscrollAbilityIndex, setSelectedWarscrollAbilityIndex] = useState<number | null>(null);
  const selectedScenario = getCombatDebugScenario(scenarioId);
  const defenderState: CombatDebugDefenderState = {
    hasGuardToken: defenderHasGuardToken,
    hasStaggerToken: defenderHasStaggerToken,
    isOnCoverToken: defenderIsOnCoverToken,
  };
  const debugSnapshot = createCombatDebugSnapshot(
    scenarioId,
    defenderState,
    selectedAbility,
    selectedWarscrollAbilityIndex,
  );
  const endPhaseDebugGame = createEndPhaseDebugSnapshot().game;
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
          sequence through the real engine, can spend a warscroll ability in player one&apos;s
          power step, and stops after one resolved attack.
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
            <button
              className={`roll-button${defenderIsOnCoverToken ? " roll-button-active" : ""}`}
              type="button"
              onClick={() => setDefenderIsOnCoverToken((value) => !value)}
              aria-pressed={defenderIsOnCoverToken}
            >
              Cover
            </button>
          </div>
          <p className="token-description">{formatDefenderStateDescription(defenderState)}</p>
          {defenderHasGuardToken && defenderHasStaggerToken ? (
            <p className="token-note">
              Stagger currently suppresses the defender&apos;s guard benefit in combat resolution.
            </p>
          ) : defenderIsOnCoverToken ? (
            <p className="token-note">
              Cover currently makes save support icons count as successes for the defender.
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
                {WeaponAbilityDefinition.formatName(
                  ability,
                  debugSnapshot.attackerWeapon.getAbility(ability)?.requiresCritical ?? false,
                )}
              </button>
            ))}
          </div>
          <p className="token-description">{formatSelectedAbilityDescription(debugSnapshot)}</p>
          <p className="token-note">
            Current end-to-end support covers the base attack plus <code>Stagger</code> and
            <code> Grievous</code> and <code> Cleave</code> and <code> Ensnare</code> and
            <code> Brutal</code>, and any of those can now be marked critical on the weapon
            definition.
          </p>
        </div>
        <div className="warscroll-controls">
          <p className="token-heading">Player One warscroll power step</p>
          <div className="roll-switcher" role="group" aria-label="Player one warscroll ability selection">
            <button
              className={`roll-button${selectedWarscrollAbilityIndex === null ? " roll-button-active" : ""}`}
              type="button"
              onClick={() => setSelectedWarscrollAbilityIndex(null)}
              aria-pressed={selectedWarscrollAbilityIndex === null}
            >
              None
            </button>
            {debugSnapshot.warscrollAbilityOptions.map((option) => (
              <button
                key={option.abilityIndex}
                className={`roll-button${selectedWarscrollAbilityIndex === option.abilityIndex ? " roll-button-active" : ""}`}
                type="button"
                onClick={() => setSelectedWarscrollAbilityIndex(option.abilityIndex)}
                aria-pressed={selectedWarscrollAbilityIndex === option.abilityIndex}
                disabled={!option.isLegal}
                title={option.isLegal ? option.definition.text : "Not legal in the captured power step."}
              >
                {option.definition.name}
              </button>
            ))}
          </div>
          <p className="token-description">{formatSelectedWarscrollDescription(debugSnapshot)}</p>
          {debugSnapshot.warscrollAbilityError !== null ? (
            <p className="token-note">{debugSnapshot.warscrollAbilityError}</p>
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
        {debugSnapshot.attackError !== null ? (
          <article className="blocked-card">
            <p className="combat-label">Attack Blocked</p>
            <h3>Selected ability is not supported in the current attack flow.</h3>
            <p className="empty-state">{debugSnapshot.attackError}</p>
          </article>
        ) : latestCombat === null ? (
          <p className="empty-state">No combat has resolved yet.</p>
        ) : (
          <CombatResultCard
            game={debugGame}
            result={latestCombat}
            isLatest
            defenderFeatureTokenBeforeAttack={debugSnapshot.defenderFeatureTokenBeforeAttack}
          />
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Ability Support</p>
          <h2>Ability support on the current weapon</h2>
        </div>
        <div className="ability-status-list">
          {debugAbilityKinds.map((ability) => {
            const definedAbility = debugSnapshot.attackerWeapon.getAbility(ability);
            const definedOnWeapon = definedAbility !== null;
            const supported = definedOnWeapon && supportedDebugAbilities.has(ability);

            return (
              <article className="ability-status-card" key={ability}>
                <div>
                  <p className="combat-label">
                    {definedAbility?.displayName ?? WeaponAbilityDefinition.formatName(ability)}
                  </p>
                  <h3>{debugSnapshot.attackerWeapon.name}</h3>
                </div>
                <p className="fighter-meta">
                  {definedOnWeapon
                    ? definedAbility?.requiresCritical
                      ? "Defined on weapon as critical"
                      : "Defined on weapon"
                    : "Not defined on weapon"}
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
          <p className="eyebrow">Warscroll</p>
          <h2>Player one power-step warscroll state</h2>
        </div>
        <article className="warscroll-card">
          <div className="combat-card-header">
            <div>
              <p className="combat-label">Pre-Attack Power Step</p>
              <h3>{debugSnapshot.playerWarscrollName}</h3>
            </div>
            <span className={`status-badge ${getWarscrollUsageStatusClass(debugSnapshot)}`}>
              {getWarscrollUsageLabel(debugSnapshot)}
            </span>
          </div>
          <p className="combat-meta">
            Player one reaches a real power step before the final attack. This panel shows the
            captured legal warscroll actions and any token spend from the selected one.
          </p>
          <dl className="combat-grid">
            <div>
              <dt>Tokens Before</dt>
              <dd>{formatWarscrollTokens(debugSnapshot.warscrollTokensBefore)}</dd>
            </div>
            <div>
              <dt>Tokens After</dt>
              <dd>{formatWarscrollTokens(debugSnapshot.warscrollTokensAfter)}</dd>
            </div>
            <div>
              <dt>Power Hand</dt>
              <dd>
                {debugSnapshot.powerHandBeforeWarscroll} to {debugSnapshot.powerHandAfterWarscroll}
              </dd>
            </div>
            <div>
              <dt>Legal Abilities</dt>
              <dd>
                {debugSnapshot.warscrollAbilityOptions.filter((option) => option.isLegal).length}
              </dd>
            </div>
            <div>
              <dt>Recorded Result</dt>
              <dd>{formatWarscrollResolution(debugGame)}</dd>
            </div>
            <div>
              <dt>History</dt>
              <dd>{debugGame.warscrollAbilityHistory.length}</dd>
            </div>
          </dl>
        </article>
        <div className="ability-status-list">
          {debugSnapshot.warscrollAbilityOptions.map((option) => (
            <article className="ability-status-card" key={option.abilityIndex}>
              <div>
                <p className="combat-label">Ability {option.abilityIndex + 1}</p>
                <h3>{option.definition.name}</h3>
              </div>
              <p className="fighter-meta">{option.definition.text}</p>
              <p className="fighter-meta">
                Cost: {formatWarscrollTokenCosts(option.definition.tokenCosts)}. Effect:{" "}
                {formatWarscrollEffects(option.definition.effects)}.
              </p>
              <span className={`status-badge ${getWarscrollAbilityStatusClass(debugSnapshot, option.abilityIndex, option.isLegal)}`}>
                {getWarscrollAbilityStatusLabel(debugSnapshot, option.abilityIndex, option.isLegal)}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">End Phase</p>
          <h2>Stored end-phase resolutions</h2>
        </div>
        <article className="warscroll-card">
          <div className="combat-card-header">
            <div>
              <p className="combat-label">Full Round Snapshot</p>
              <h3>{endPhaseDebugGame.state.kind}</h3>
            </div>
            <span className="status-badge status-supported">recorded</span>
          </div>
          <p className="combat-meta">
            This snapshot runs a deterministic round through cleanup, then reads the stored
            objective scoring, objective draw, power draw, and cleanup resolution objects
            directly from game state.
          </p>
          <dl className="combat-grid">
            <div>
              <dt>Round</dt>
              <dd>{endPhaseDebugGame.roundNumber}</dd>
            </div>
            <div>
              <dt>Scoring History</dt>
              <dd>{endPhaseDebugGame.objectiveScoringHistory.length}</dd>
            </div>
            <div>
              <dt>Objective Draw History</dt>
              <dd>{endPhaseDebugGame.objectiveDrawHistory.length}</dd>
            </div>
            <div>
              <dt>Power Draw History</dt>
              <dd>{endPhaseDebugGame.powerDrawHistory.length}</dd>
            </div>
            <div>
              <dt>Cleanup History</dt>
              <dd>{endPhaseDebugGame.cleanupHistory.length}</dd>
            </div>
            <div>
              <dt>Last Cleanup</dt>
              <dd>{formatCleanupHeadline(endPhaseDebugGame)}</dd>
            </div>
          </dl>
        </article>
        <div className="ability-status-list">
          <article className="ability-status-card">
            <div>
              <p className="combat-label">Score Objectives</p>
              <h3>{formatObjectiveScoringHeadline(endPhaseDebugGame)}</h3>
            </div>
            {formatObjectiveScoringDetails(endPhaseDebugGame).map((detail) => (
              <p className="fighter-meta" key={detail}>{detail}</p>
            ))}
            <span className={`status-badge ${getResolutionStatusClass(endPhaseDebugGame.lastObjectiveScoringResolution)}`}>
              {getResolutionStatusLabel(endPhaseDebugGame.lastObjectiveScoringResolution)}
            </span>
          </article>
          <article className="ability-status-card">
            <div>
              <p className="combat-label">Draw Objectives</p>
              <h3>{formatObjectiveDrawHeadline(endPhaseDebugGame)}</h3>
            </div>
            {formatObjectiveDrawDetails(endPhaseDebugGame).map((detail) => (
              <p className="fighter-meta" key={detail}>{detail}</p>
            ))}
            <span className={`status-badge ${getResolutionStatusClass(endPhaseDebugGame.lastObjectiveDrawResolution)}`}>
              {getResolutionStatusLabel(endPhaseDebugGame.lastObjectiveDrawResolution)}
            </span>
          </article>
          <article className="ability-status-card">
            <div>
              <p className="combat-label">Draw Power Cards</p>
              <h3>{formatPowerDrawHeadline(endPhaseDebugGame)}</h3>
            </div>
            {formatPowerDrawDetails(endPhaseDebugGame).map((detail) => (
              <p className="fighter-meta" key={detail}>{detail}</p>
            ))}
            <span className={`status-badge ${getResolutionStatusClass(endPhaseDebugGame.lastPowerDrawResolution)}`}>
              {getResolutionStatusLabel(endPhaseDebugGame.lastPowerDrawResolution)}
            </span>
          </article>
          <article className="ability-status-card">
            <div>
              <p className="combat-label">Cleanup</p>
              <h3>{formatCleanupHeadline(endPhaseDebugGame)}</h3>
            </div>
            {formatCleanupDetails(endPhaseDebugGame).map((detail) => (
              <p className="fighter-meta" key={detail}>{detail}</p>
            ))}
            <span className={`status-badge ${getResolutionStatusClass(endPhaseDebugGame.lastCleanupResolution)}`}>
              {getResolutionStatusLabel(endPhaseDebugGame.lastCleanupResolution)}
            </span>
          </article>
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
  defenderFeatureTokenBeforeAttack?: CombatDebugSnapshot["defenderFeatureTokenBeforeAttack"];
  isLatest?: boolean;
  label?: string;
};

function CombatResultCard({
  game,
  result,
  defenderFeatureTokenBeforeAttack,
  isLatest = false,
  label = "Recorded attack",
}: CombatResultCardProps) {
  const attackerName = getFighterName(game, result.context.attackerFighterId);
  const defenderName = getFighterName(game, result.context.targetFighterId);
  const attackerPlayerName = getPlayerName(game, result.context.attackerPlayerId);
  const defenderPlayerName = getPlayerName(game, result.context.defenderPlayerId);
  const weaponName = getWeaponName(game, result.context.attackerFighterId, result.context.weaponId);
  const selectedAbilityText =
    result.context.selectedAbility === null
      ? ""
      : ` using ${WeaponAbilityDefinition.formatName(
        result.context.selectedAbility,
        result.selectedAbilityRequiresCritical,
      )}`;

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
        {defenderFeatureTokenBeforeAttack !== undefined ? (
          <div>
            <dt>Defender Feature</dt>
            <dd>{formatDefenderFeatureTokenState(game, defenderFeatureTokenBeforeAttack)}</dd>
          </div>
        ) : null}
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
    const weapon = player.getFighterWeaponDefinition(fighterId, weaponId);
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

  if (
    result.context.selectedAbility !== null &&
    result.selectedAbilityRequiresCritical &&
    !result.selectedAbilityTriggered
  ) {
    effects.push("critical ability not triggered");
  }

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

  if (defenderState.isOnCoverToken) {
    states.push("on a cover token");
  }

  return states.length === 0 ? "Defender starts clean." : `Defender starts ${states.join(" and ")}.`;
}

function formatDefenderFeatureTokenState(
  game: Game,
  featureTokenSnapshot: CombatDebugSnapshot["defenderFeatureTokenBeforeAttack"],
): string {
  if (featureTokenSnapshot.featureTokenId === null || featureTokenSnapshot.featureTokenSide === null) {
    return `none on ${featureTokenSnapshot.fighterHexId}`;
  }

  const holderText =
    featureTokenSnapshot.heldByFighterId === null
      ? ""
      : `, held by ${getFighterName(game, featureTokenSnapshot.heldByFighterId)}`;

  return `${featureTokenSnapshot.featureTokenSide} ${featureTokenSnapshot.featureTokenId} on ${featureTokenSnapshot.fighterHexId}${holderText}`;
}

function formatSelectedAbilityDescription(debugSnapshot: CombatDebugSnapshot): string {
  const selectedAbilityDefinition = debugSnapshot.attackerWeapon.getAbility(debugSnapshot.selectedAbility);

  if (debugSnapshot.selectedAbility === null) {
    return `No ability selected. ${debugSnapshot.attackerWeapon.name} follows the current supported path.`;
  }

  if (
    selectedAbilityDefinition !== null &&
    supportedDebugAbilities.has(debugSnapshot.selectedAbility)
  ) {
    if (selectedAbilityDefinition.requiresCritical) {
      return `${selectedAbilityDefinition.displayName} is defined on ${debugSnapshot.attackerWeapon.name} and will only trigger if the attack roll includes a critical.`;
    }

    return `${selectedAbilityDefinition.displayName} is defined on ${debugSnapshot.attackerWeapon.name} and now resolves through the current attack flow.`;
  }

  if (selectedAbilityDefinition !== null) {
    return `${selectedAbilityDefinition.displayName} is defined on ${debugSnapshot.attackerWeapon.name}, but it is still unsupported in the current attack flow.`;
  }

  if (debugSnapshot.attackerWeapon.abilities.length === 0) {
    return `${debugSnapshot.attackerWeapon.name} defines no abilities, so ${WeaponAbilityDefinition.formatName(debugSnapshot.selectedAbility)} is only a debug probe right now.`;
  }

  return `${WeaponAbilityDefinition.formatName(debugSnapshot.selectedAbility)} is not defined on ${debugSnapshot.attackerWeapon.name}. Defined abilities: ${formatAbilityList(debugSnapshot.attackerWeapon.abilities)}.`;
}

function formatAbilityList(
  abilities: readonly WeaponAbilityDefinition[],
): string {
  return abilities.map((ability) => ability.displayName).join(", ");
}

function formatSelectedWarscrollDescription(debugSnapshot: CombatDebugSnapshot): string {
  const resolution = debugSnapshot.game.lastWarscrollAbilityResolution;

  if (debugSnapshot.warscrollAbilityOptions.length === 0) {
    return `${debugSnapshot.playerWarscrollName} defines no warscroll abilities in this debug snapshot.`;
  }

  if (debugSnapshot.selectedWarscrollAbilityIndex === null) {
    return `${debugSnapshot.playerWarscrollName} reaches a real player-one power step before the attack. Choose a legal ability to spend tokens there.`;
  }

  const selectedOption = debugSnapshot.warscrollAbilityOptions.find(
    (option) => option.abilityIndex === debugSnapshot.selectedWarscrollAbilityIndex,
  );
  if (selectedOption === undefined) {
    return `Selected warscroll ability ${debugSnapshot.selectedWarscrollAbilityIndex + 1} is not defined on ${debugSnapshot.playerWarscrollName}.`;
  }

  if (debugSnapshot.warscrollAbilityError !== null) {
    return `${selectedOption.definition.name} was selected but failed during the captured power step.`;
  }

  if (resolution === null) {
    return `${selectedOption.definition.name} resolved, but no warscroll resolution was recorded.`;
  }

  return `${selectedOption.definition.name} resolved in player one's power step: ${resolution.effectSummaries.join(", ")}.`;
}

function formatWarscrollTokens(tokens: Readonly<Record<string, number>>): string {
  const entries = Object.entries(tokens);
  if (entries.length === 0) {
    return "none";
  }

  return entries.map(([tokenName, tokenCount]) => `${tokenName} ${tokenCount}`).join(", ");
}

function formatWarscrollTokenCosts(tokenCosts: Readonly<Record<string, number>>): string {
  const entries = Object.entries(tokenCosts);
  if (entries.length === 0) {
    return "none";
  }

  return entries.map(([tokenName, tokenCount]) => `${tokenCount} ${tokenName}`).join(", ");
}

function formatWarscrollEffects(effects: readonly WarscrollAbilityEffect[]): string {
  if (effects.length === 0) {
    return "none";
  }

  return effects.map((effect) => formatWarscrollEffect(effect)).join(", ");
}

function formatWarscrollEffect(effect: WarscrollAbilityEffect): string {
  switch (effect.kind) {
    case WarscrollAbilityEffectKind.DrawPowerCards:
      return `draw ${effect.count} power card${effect.count === 1 ? "" : "s"}`;
    case WarscrollAbilityEffectKind.GainWarscrollTokens:
      return `gain ${formatWarscrollTokenCosts(effect.tokens)} token${isSingleTokenAmount(effect.tokens) ? "" : "s"}`;
  }
}

function isSingleTokenAmount(tokens: Readonly<Record<string, number>>): boolean {
  return Object.values(tokens).reduce((total, tokenCount) => total + tokenCount, 0) === 1;
}

function formatWarscrollResolution(game: Game): string {
  const resolution = game.lastWarscrollAbilityResolution;
  if (resolution === null) {
    return "none";
  }

  return `${resolution.abilityName}: ${resolution.effectSummaries.join(", ")}`;
}

function getWarscrollUsageLabel(debugSnapshot: CombatDebugSnapshot): string {
  if (debugSnapshot.selectedWarscrollAbilityIndex === null) {
    return "unused";
  }

  return debugSnapshot.warscrollAbilityError === null ? "used" : "failed";
}

function getWarscrollUsageStatusClass(debugSnapshot: CombatDebugSnapshot): string {
  if (debugSnapshot.selectedWarscrollAbilityIndex === null) {
    return "status-idle";
  }

  return debugSnapshot.warscrollAbilityError === null ? "status-supported" : "status-unsupported";
}

function getWarscrollAbilityStatusLabel(
  debugSnapshot: CombatDebugSnapshot,
  abilityIndex: number,
  isLegal: boolean,
): string {
  if (debugSnapshot.selectedWarscrollAbilityIndex === abilityIndex) {
    return debugSnapshot.warscrollAbilityError === null ? "used" : "failed";
  }

  return isLegal ? "legal" : "not legal";
}

function getWarscrollAbilityStatusClass(
  debugSnapshot: CombatDebugSnapshot,
  abilityIndex: number,
  isLegal: boolean,
): string {
  if (debugSnapshot.selectedWarscrollAbilityIndex === abilityIndex) {
    return debugSnapshot.warscrollAbilityError === null ? "status-supported" : "status-unsupported";
  }

  return isLegal ? "status-supported" : "status-unsupported";
}

function formatObjectiveScoringHeadline(game: Game): string {
  const resolution = game.lastObjectiveScoringResolution;
  if (resolution === null) {
    return "No scoring recorded";
  }

  return `${resolution.totalObjectivesScored} objective${resolution.totalObjectivesScored === 1 ? "" : "s"} / ${resolution.totalGloryGained} glory`;
}

function formatObjectiveScoringDetails(game: Game): string[] {
  const resolution = game.lastObjectiveScoringResolution;
  if (resolution === null) {
    return ["The debug snapshot did not record objective scoring."];
  }

  return resolution.playerResolutions.map((playerResolution) => {
    if (playerResolution.scoredObjectives.length === 0) {
      return `${playerResolution.playerName}: no objectives scored.`;
    }

    const scoredObjectiveNames = playerResolution.scoredObjectives
      .map((objective) => `${objective.cardName} (+${objective.gloryValue})`)
      .join(", ");
    return `${playerResolution.playerName}: ${scoredObjectiveNames}.`;
  });
}

function formatObjectiveDrawHeadline(game: Game): string {
  const resolution = game.lastObjectiveDrawResolution;
  if (resolution === null) {
    return "No objective draw recorded";
  }

  return `${resolution.totalCardsDrawn} objective card${resolution.totalCardsDrawn === 1 ? "" : "s"} drawn`;
}

function formatObjectiveDrawDetails(game: Game): string[] {
  const resolution = game.lastObjectiveDrawResolution;
  if (resolution === null) {
    return ["The debug snapshot did not record objective refills."];
  }

  return resolution.playerResolutions.map((playerResolution) => {
    if (playerResolution.cardsDrawn.length === 0) {
      return `${playerResolution.playerName}: no objective cards drawn.`;
    }

    return `${playerResolution.playerName}: ${playerResolution.cardsDrawn.map((card) => card.cardName).join(", ")}.`;
  });
}

function formatPowerDrawHeadline(game: Game): string {
  const resolution = game.lastPowerDrawResolution;
  if (resolution === null) {
    return "No power draw recorded";
  }

  return `${resolution.totalCardsDrawn} power card${resolution.totalCardsDrawn === 1 ? "" : "s"} drawn`;
}

function formatPowerDrawDetails(game: Game): string[] {
  const resolution = game.lastPowerDrawResolution;
  if (resolution === null) {
    return ["The debug snapshot did not record power refills."];
  }

  return resolution.playerResolutions.map((playerResolution) => {
    if (playerResolution.cardsDrawn.length === 0) {
      return `${playerResolution.playerName}: no power cards drawn.`;
    }

    return `${playerResolution.playerName}: ${playerResolution.cardsDrawn.map((card) => card.cardName).join(", ")}.`;
  });
}

function formatCleanupHeadline(game: Game): string {
  const resolution = game.lastCleanupResolution;
  if (resolution === null) {
    return "No cleanup recorded";
  }

  if (resolution.nextStateKind === "finished") {
    return resolution.winnerPlayerId === null
      ? "Game finished in a draw"
      : `${getPlayerName(game, resolution.winnerPlayerId)} won`;
  }

  return `Round ${resolution.nextRoundNumber} ready`;
}

function formatCleanupDetails(game: Game): string[] {
  const resolution = game.lastCleanupResolution;
  if (resolution === null) {
    return ["The debug snapshot did not record cleanup."];
  }

  const details = [
    `Consecutive passes reset from ${resolution.consecutivePassesBeforeReset}; cleared ${resolution.totalTokensCleared} token${resolution.totalTokensCleared === 1 ? "" : "s"}.`,
  ];

  for (const playerResolution of resolution.playerResolutions) {
    if (playerResolution.fightersWithTokensCleared.length === 0) {
      details.push(`${playerResolution.playerName}: no move, charge, or guard tokens cleared.`);
      continue;
    }

    const clearedTokens = playerResolution.fightersWithTokensCleared.map((fighterResolution) => {
      const tokens: string[] = [];
      if (fighterResolution.clearedMoveToken) {
        tokens.push("move");
      }
      if (fighterResolution.clearedChargeToken) {
        tokens.push("charge");
      }
      if (fighterResolution.clearedGuardToken) {
        tokens.push("guard");
      }

      return `${fighterResolution.fighterName} (${tokens.join(", ")})`;
    });
    details.push(`${playerResolution.playerName}: ${clearedTokens.join(", ")}.`);
  }

  if (resolution.outcomeReason !== null) {
    details.push(resolution.outcomeReason);
  }

  return details;
}

function getResolutionStatusLabel(resolution: object | null): string {
  return resolution === null ? "missing" : "recorded";
}

function getResolutionStatusClass(resolution: object | null): string {
  return resolution === null ? "status-unsupported" : "status-supported";
}

export default App;
