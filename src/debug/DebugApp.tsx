import { useState } from "react";
import { LOCAL_PLAYER_ID } from "../localPlayer";
import { reactKey } from "../react/reactKey";
import {
  GameRecordKind,
  WeaponAbilityDefinition,
  WeaponAbilityKind,
  WarscrollAbilityEffectKind,
  type CombatResult,
  type Fighter,
  type Game,
  type WarscrollAbilityEffect,
} from "../domain";
import {
  combatDebugScenarios,
  createCombatDebugSnapshot,
  createDelveDebugSnapshot,
  createEndPhaseDebugSnapshot,
  createPloyDebugSnapshot,
  createUpgradeDebugSnapshot,
  getCombatDebugScenario,
  type CombatDebugSnapshot,
  type CombatDebugDefenderState,
  type PloyDebugOption,
  type CombatDebugScenarioId,
  type UpgradeDebugOption,
} from "./createCombatDebugGame";

const debugAbilityKinds = Object.values(WeaponAbilityKind);
const supportedDebugAbilities = new Set<WeaponAbilityKind>([
  WeaponAbilityKind.Stagger,
  WeaponAbilityKind.Grievous,
  WeaponAbilityKind.Cleave,
  WeaponAbilityKind.Ensnare,
  WeaponAbilityKind.Brutal,
]);

function DebugApp() {
  const [scenarioId, setScenarioId] = useState<CombatDebugScenarioId>("success");
  const [defenderHasGuardToken, setDefenderHasGuardToken] = useState(false);
  const [defenderHasStaggerToken, setDefenderHasStaggerToken] = useState(false);
  const [defenderIsOnCoverToken, setDefenderIsOnCoverToken] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState<WeaponAbilityKind | null>(null);
  const [selectedWarscrollAbilityIndex, setSelectedWarscrollAbilityIndex] = useState<number | null>(null);
  const [selectedPloyActionKey, setSelectedPloyActionKey] = useState<string | null>(null);
  const [selectedUpgradeActionKey, setSelectedUpgradeActionKey] = useState<string | null>(null);
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
  const delveDebugGame = createDelveDebugSnapshot().game;
  const endPhaseDebugGame = createEndPhaseDebugSnapshot().game;
  const ployDebugSnapshot = createPloyDebugSnapshot(selectedPloyActionKey);
  const upgradeDebugSnapshot = createUpgradeDebugSnapshot(selectedUpgradeActionKey);
  const ployDebugGame = ployDebugSnapshot.game;
  const upgradeDebugGame = upgradeDebugSnapshot.game;
  const debugGame = debugSnapshot.game;
  const latestCombat = getLatestCombatResult(debugGame);
  const combatHistory = getCombatHistory(debugGame);
  const recentEvents = debugGame.eventLog.slice(-8).reverse();

  return (
    <main className="max-w-[1120px] mx-auto px-5 pt-8 pb-14 max-sm:px-3.5 max-sm:pt-5 max-sm:pb-10 grid gap-[18px]">
      <section className="bg-surface border border-[rgba(116,86,51,0.18)] rounded-[22px] p-6 max-sm:p-[18px] shadow-[0_18px_44px_rgba(69,47,22,0.12)] backdrop-blur-[10px]">
        <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Combat Debug View</p>
        <h1 className="m-0 font-heading text-[clamp(2rem,3vw,3rem)] leading-[1.05] max-w-[12ch]">Latest combat result and history are now visible in the browser.</h1>
        <p className="mt-4 max-w-[62ch] leading-[1.6] text-ink-soft">
          This screen uses the existing setup fixture, runs a short deterministic move/pass
          sequence through the real engine, can spend a warscroll ability in player one&apos;s
          power step, and stops after one resolved attack.
        </p>
        <div className="mt-5 p-4 px-[18px] bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card">
          <div className="flex flex-wrap gap-2.5" role="tablist" aria-label="Combat roll presets">
            {combatDebugScenarios.map((scenario) => (
              <button
                key={scenario.id}
                className={`border border-[rgba(138,68,42,0.28)] bg-[rgba(255,251,242,0.85)] text-[#5a3a20] rounded-pill py-2.5 px-3.5 font-[inherit] font-bold cursor-pointer transition-all duration-[120ms] ease-in-out hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:!translate-y-0${scenario.id === scenarioId ? " !bg-accent !text-[#fff6ed]" : ""}`}
                type="button"
                onClick={() => setScenarioId(scenario.id)}
                aria-pressed={scenario.id === scenarioId}
              >
                {scenario.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-ink-soft">{selectedScenario.description}</p>
          <p className="mt-3 text-ink-soft">
            Attack: <code className="font-mono text-[#442b19]">{formatRoll(selectedScenario.attackRoll)}</code>
            {"  "}
            Save: <code className="font-mono text-[#442b19]">{formatRoll(selectedScenario.saveRoll)}</code>
          </p>
        </div>
        <div className="mt-3.5 p-4 px-[18px] bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card">
          <p className="m-0 mb-3 text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Defender tokens</p>
          <div className="flex flex-wrap gap-2.5" role="group" aria-label="Defender token toggles">
            <button
              className={`border border-[rgba(138,68,42,0.28)] bg-[rgba(255,251,242,0.85)] text-[#5a3a20] rounded-pill py-2.5 px-3.5 font-[inherit] font-bold cursor-pointer transition-all duration-[120ms] ease-in-out hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:!translate-y-0${defenderHasGuardToken ? " !bg-accent !text-[#fff6ed]" : ""}`}
              type="button"
              onClick={() => setDefenderHasGuardToken((value) => !value)}
              aria-pressed={defenderHasGuardToken}
            >
              Guard
            </button>
            <button
              className={`border border-[rgba(138,68,42,0.28)] bg-[rgba(255,251,242,0.85)] text-[#5a3a20] rounded-pill py-2.5 px-3.5 font-[inherit] font-bold cursor-pointer transition-all duration-[120ms] ease-in-out hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:!translate-y-0${defenderHasStaggerToken ? " !bg-accent !text-[#fff6ed]" : ""}`}
              type="button"
              onClick={() => setDefenderHasStaggerToken((value) => !value)}
              aria-pressed={defenderHasStaggerToken}
            >
              Stagger
            </button>
            <button
              className={`border border-[rgba(138,68,42,0.28)] bg-[rgba(255,251,242,0.85)] text-[#5a3a20] rounded-pill py-2.5 px-3.5 font-[inherit] font-bold cursor-pointer transition-all duration-[120ms] ease-in-out hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:!translate-y-0${defenderIsOnCoverToken ? " !bg-accent !text-[#fff6ed]" : ""}`}
              type="button"
              onClick={() => setDefenderIsOnCoverToken((value) => !value)}
              aria-pressed={defenderIsOnCoverToken}
            >
              Cover
            </button>
          </div>
          <p className="mt-3 text-ink-soft">{formatDefenderStateDescription(defenderState)}</p>
          {defenderHasGuardToken && defenderHasStaggerToken ? (
            <p className="mt-3 text-accent font-bold">
              Stagger currently suppresses the defender&apos;s guard benefit in combat resolution.
            </p>
          ) : defenderIsOnCoverToken ? (
            <p className="mt-3 text-accent font-bold">
              Cover currently makes save support icons count as successes for the defender.
            </p>
          ) : null}
        </div>
        <div className="mt-3.5 p-4 px-[18px] bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card">
          <p className="m-0 mb-3 text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Selected ability</p>
          <div className="flex flex-wrap gap-2.5" role="group" aria-label="Attacker ability selection">
            <button
              className={`border border-[rgba(138,68,42,0.28)] bg-[rgba(255,251,242,0.85)] text-[#5a3a20] rounded-pill py-2.5 px-3.5 font-[inherit] font-bold cursor-pointer transition-all duration-[120ms] ease-in-out hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:!translate-y-0${selectedAbility === null ? " !bg-accent !text-[#fff6ed]" : ""}`}
              type="button"
              onClick={() => setSelectedAbility(null)}
              aria-pressed={selectedAbility === null}
            >
              None
            </button>
            {debugAbilityKinds.map((ability) => (
              <button
                key={ability}
                className={`border border-[rgba(138,68,42,0.28)] bg-[rgba(255,251,242,0.85)] text-[#5a3a20] rounded-pill py-2.5 px-3.5 font-[inherit] font-bold cursor-pointer transition-all duration-[120ms] ease-in-out hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:!translate-y-0${selectedAbility === ability ? " !bg-accent !text-[#fff6ed]" : ""}`}
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
          <p className="mt-3 text-ink-soft">{formatSelectedAbilityDescription(debugSnapshot)}</p>
          <p className="mt-3 text-accent font-bold">
            Current end-to-end support covers the base attack plus <code className="font-mono text-[#442b19]">Stagger</code> and
            <code className="font-mono text-[#442b19]"> Grievous</code> and <code className="font-mono text-[#442b19]"> Cleave</code> and <code className="font-mono text-[#442b19]"> Ensnare</code> and
            <code className="font-mono text-[#442b19]"> Brutal</code>, and any of those can now be marked critical on the weapon
            definition.
          </p>
        </div>
        <div className="mt-3.5 p-4 px-[18px] bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card">
          <p className="m-0 mb-3 text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Player One warscroll power step</p>
          <div className="flex flex-wrap gap-2.5" role="group" aria-label="Player one warscroll ability selection">
            <button
              className={`border border-[rgba(138,68,42,0.28)] bg-[rgba(255,251,242,0.85)] text-[#5a3a20] rounded-pill py-2.5 px-3.5 font-[inherit] font-bold cursor-pointer transition-all duration-[120ms] ease-in-out hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:!translate-y-0${selectedWarscrollAbilityIndex === null ? " !bg-accent !text-[#fff6ed]" : ""}`}
              type="button"
              onClick={() => setSelectedWarscrollAbilityIndex(null)}
              aria-pressed={selectedWarscrollAbilityIndex === null}
            >
              None
            </button>
            {debugSnapshot.warscrollAbilityOptions.map((option) => (
              <button
                key={option.abilityIndex}
                className={`border border-[rgba(138,68,42,0.28)] bg-[rgba(255,251,242,0.85)] text-[#5a3a20] rounded-pill py-2.5 px-3.5 font-[inherit] font-bold cursor-pointer transition-all duration-[120ms] ease-in-out hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:!translate-y-0${selectedWarscrollAbilityIndex === option.abilityIndex ? " !bg-accent !text-[#fff6ed]" : ""}`}
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
          <p className="mt-3 text-ink-soft">{formatSelectedWarscrollDescription(debugSnapshot)}</p>
          {debugSnapshot.warscrollAbilityError !== null ? (
            <p className="mt-3 text-accent font-bold">{debugSnapshot.warscrollAbilityError}</p>
          ) : null}
        </div>
        <dl className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-3">
          <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
            <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">State</dt>
            <dd className="mt-1.5 text-base font-bold m-0">{debugGame.state.kind}</dd>
          </div>
          <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
            <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Phase</dt>
            <dd className="mt-1.5 text-base font-bold m-0">{debugGame.phase}</dd>
          </div>
          <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
            <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Turn Step</dt>
            <dd className="mt-1.5 text-base font-bold m-0">{debugGame.turnStep ?? "n/a"}</dd>
          </div>
          <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
            <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Active Player</dt>
            <dd className="mt-1.5 text-base font-bold m-0">{getPlayerName(debugGame, debugGame.activePlayerId)}</dd>
          </div>
          <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
            <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Round</dt>
            <dd className="mt-1.5 text-base font-bold m-0">{debugGame.roundNumber}</dd>
          </div>
          <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
            <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Combat History</dt>
            <dd className="mt-1.5 text-base font-bold m-0">{combatHistory.length}</dd>
          </div>
        </dl>
      </section>

      <section className="bg-surface border border-[rgba(116,86,51,0.18)] rounded-[22px] p-6 max-sm:p-[18px] shadow-[0_18px_44px_rgba(69,47,22,0.12)] backdrop-blur-[10px]">
        <div className="mb-4">
          <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Last Combat</p>
          <h2 className="m-0 font-heading">Resolved attack summary</h2>
        </div>
        {debugSnapshot.attackError !== null ? (
          <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-[18px]">
            <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Attack Blocked</p>
            <h3 className="m-0 font-heading">Selected ability is not supported in the current attack flow.</h3>
            <p className="text-ink-soft">{debugSnapshot.attackError}</p>
          </article>
        ) : latestCombat === null ? (
          <p className="text-ink-soft">No combat has resolved yet.</p>
        ) : (
          <CombatResultCard
            game={debugGame}
            result={latestCombat}
            isLatest
            defenderFeatureTokenBeforeAttack={debugSnapshot.defenderFeatureTokenBeforeAttack}
          />
        )}
      </section>

      <section className="bg-surface border border-[rgba(116,86,51,0.18)] rounded-[22px] p-6 max-sm:p-[18px] shadow-[0_18px_44px_rgba(69,47,22,0.12)] backdrop-blur-[10px]">
        <div className="mb-4">
          <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Ability Support</p>
          <h2 className="m-0 font-heading">Ability support on the current weapon</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          {debugAbilityKinds.map((ability) => {
            const definedAbility = debugSnapshot.attackerWeapon.getAbility(ability);
            const definedOnWeapon = definedAbility !== null;
            const supported = definedOnWeapon && supportedDebugAbilities.has(ability);

            return (
              <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-4 grid gap-2.5" key={ability}>
                <div>
                  <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">
                    {definedAbility?.displayName ?? WeaponAbilityDefinition.formatName(ability)}
                  </p>
                  <h3 className="m-0 font-heading">{debugSnapshot.attackerWeapon.name}</h3>
                </div>
                <p className="mt-1.5 text-ink-soft">
                  {definedOnWeapon
                    ? definedAbility?.requiresCritical
                      ? "Defined on weapon as critical"
                      : "Defined on weapon"
                    : "Not defined on weapon"}
                </p>
                <span className={`w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase ${supported ? "bg-success-bg text-success" : "bg-failure-bg text-failure"}`}>
                  {supported ? "supported" : "unsupported"}
                </span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-surface border border-[rgba(116,86,51,0.18)] rounded-[22px] p-6 max-sm:p-[18px] shadow-[0_18px_44px_rgba(69,47,22,0.12)] backdrop-blur-[10px]">
        <div className="mb-4">
          <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Ploys</p>
          <h2 className="m-0 font-heading">Stored ploy resolutions</h2>
        </div>
        <div className="mt-3.5 p-4 px-[18px] bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card">
          <p className="m-0 mb-3 text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Player One power-step ploys</p>
          <div className="flex flex-wrap gap-2.5" role="group" aria-label="Player one ploy selection">
            <button
              className={`border border-[rgba(138,68,42,0.28)] bg-[rgba(255,251,242,0.85)] text-[#5a3a20] rounded-pill py-2.5 px-3.5 font-[inherit] font-bold cursor-pointer transition-all duration-[120ms] ease-in-out hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:!translate-y-0${selectedPloyActionKey === null ? " !bg-accent !text-[#fff6ed]" : ""}`}
              type="button"
              onClick={() => setSelectedPloyActionKey(null)}
              aria-pressed={selectedPloyActionKey === null}
            >
              None
            </button>
            {ployDebugSnapshot.ployOptions.map((option) => (
              <button
                key={option.actionKey}
                className={`border border-[rgba(138,68,42,0.28)] bg-[rgba(255,251,242,0.85)] text-[#5a3a20] rounded-pill py-2.5 px-3.5 font-[inherit] font-bold cursor-pointer transition-all duration-[120ms] ease-in-out hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:!translate-y-0${selectedPloyActionKey === option.actionKey ? " !bg-accent !text-[#fff6ed]" : ""}`}
                type="button"
                onClick={() => setSelectedPloyActionKey(option.actionKey)}
                aria-pressed={selectedPloyActionKey === option.actionKey}
                title={formatPloyOptionTitle(option)}
              >
                {formatPloyOptionButton(option)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-ink-soft">{formatSelectedPloyDescription(ployDebugSnapshot)}</p>
          {ployDebugSnapshot.ployActionError !== null ? (
            <p className="mt-3 text-accent font-bold">{ployDebugSnapshot.ployActionError}</p>
          ) : null}
        </div>
        <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-[18px]">
          <div className="flex gap-3 justify-between items-start max-sm:flex-col">
            <div>
              <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Power Step Snapshot</p>
              <h3 className="m-0 font-heading text-[1.35rem]">{formatPloyHeadline(ployDebugGame)}</h3>
            </div>
            <span className={`w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase ${getResolutionStatusTw(getLatestPloyResolution(ployDebugGame))}`}>
              {getResolutionStatusLabel(getLatestPloyResolution(ployDebugGame))}
            </span>
          </div>
          <p className="text-ink-soft">
            This snapshot reaches Player One&apos;s first power step, exposes the legal ploy actions
            in that exact moment, then replays the selected one through the real engine and reads
            the stored ploy resolution objects directly from game state.
          </p>
          <dl className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-3">
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Last Ploy</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{formatPloyHeadline(ployDebugGame)}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Legal Actions</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{ployDebugSnapshot.ployOptions.length}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Latest Target</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{formatPloyTargetHeadline(ployDebugGame)}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Effects</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{formatPloyEffectHeadline(ployDebugGame)}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Turn Step</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{ployDebugGame.turnStep ?? "n/a"}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">History</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{getPloyHistory(ployDebugGame).length}</dd>
            </div>
          </dl>
        </article>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          {getPloyHistory(ployDebugGame).length === 0 ? (
            <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-4 grid gap-2.5">
              <div>
                <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">No Ploy Yet</p>
                <h3 className="m-0 font-heading">Choose a legal action above</h3>
              </div>
              <p className="mt-1.5 text-ink-soft">
                The snapshot is parked on Player One&apos;s power step until you replay one of the
                legal ploys.
              </p>
              <span className="w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase bg-idle-bg text-idle">idle</span>
            </article>
          ) : null}
          {getPloyHistory(ployDebugGame).map((resolution, index) => (
            <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-4 grid gap-2.5" key={`${resolution.cardId}:${index}`}>
              <div>
                <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Ploy {index + 1}</p>
                <h3 className="m-0 font-heading">{resolution.cardName}</h3>
              </div>
              <p className="mt-1.5 text-ink-soft">{resolution.playerName}</p>
              <p className="mt-1.5 text-ink-soft">{formatPloyResolutionTarget(resolution)}</p>
              <p className="mt-1.5 text-ink-soft">{resolution.effectSummaries.join(", ")}</p>
              <span className="w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase bg-success-bg text-success">recorded</span>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-surface border border-[rgba(116,86,51,0.18)] rounded-[22px] p-6 max-sm:p-[18px] shadow-[0_18px_44px_rgba(69,47,22,0.12)] backdrop-blur-[10px]">
        <div className="mb-4">
          <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Delve</p>
          <h2 className="m-0 font-heading">Stored delve resolution</h2>
        </div>
        <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-[18px]">
          <div className="flex gap-3 justify-between items-start max-sm:flex-col">
            <div>
              <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Power Step Snapshot</p>
              <h3 className="m-0 font-heading text-[1.35rem]">{formatDelveHeadline(delveDebugGame)}</h3>
            </div>
            <span className={`w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase ${getResolutionStatusTw(getLatestDelveResolution(delveDebugGame))}`}>
              {getResolutionStatusLabel(getLatestDelveResolution(delveDebugGame))}
            </span>
          </div>
          <p className="text-ink-soft">
            This snapshot moves one fighter onto a treasure token, delves it in a real power step,
            then reads the stored delve resolution directly from game state.
          </p>
          <dl className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-3">
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Last Delve</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{formatDelveHeadline(delveDebugGame)}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Feature Token</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{formatDelveFeatureToken(delveDebugGame)}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Transition</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{formatDelveTransition(delveDebugGame)}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Holder After</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{formatDelveHolderAfter(delveDebugGame)}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Stagger</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{formatDelveStagger(delveDebugGame)}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">History</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{getDelveHistory(delveDebugGame).length}</dd>
            </div>
          </dl>
        </article>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-4 grid gap-2.5">
            <div>
              <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Delve Result</p>
              <h3 className="m-0 font-heading">{formatDelveHeadline(delveDebugGame)}</h3>
            </div>
            {formatDelveDetails(delveDebugGame).map((detail) => (
              <p className="mt-1.5 text-ink-soft" key={detail}>{detail}</p>
            ))}
            <span className={`w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase ${getResolutionStatusTw(getLatestDelveResolution(delveDebugGame))}`}>
              {getResolutionStatusLabel(getLatestDelveResolution(delveDebugGame))}
            </span>
          </article>
        </div>
      </section>

      <section className="bg-surface border border-[rgba(116,86,51,0.18)] rounded-[22px] p-6 max-sm:p-[18px] shadow-[0_18px_44px_rgba(69,47,22,0.12)] backdrop-blur-[10px]">
        <div className="mb-4">
          <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Upgrades</p>
          <h2 className="m-0 font-heading">Power-step upgrade replay</h2>
        </div>
        <div className="mt-3.5 p-4 px-[18px] bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card">
          <p className="m-0 mb-3 text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Player One power-step upgrades</p>
          <div className="flex flex-wrap gap-2.5" role="group" aria-label="Player one upgrade selection">
            <button
              className={`border border-[rgba(138,68,42,0.28)] bg-[rgba(255,251,242,0.85)] text-[#5a3a20] rounded-pill py-2.5 px-3.5 font-[inherit] font-bold cursor-pointer transition-all duration-[120ms] ease-in-out hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:!translate-y-0${selectedUpgradeActionKey === null ? " !bg-accent !text-[#fff6ed]" : ""}`}
              type="button"
              onClick={() => setSelectedUpgradeActionKey(null)}
              aria-pressed={selectedUpgradeActionKey === null}
            >
              None
            </button>
            {upgradeDebugSnapshot.upgradeOptions.map((option) => (
              <button
                key={option.actionKey}
                className={`border border-[rgba(138,68,42,0.28)] bg-[rgba(255,251,242,0.85)] text-[#5a3a20] rounded-pill py-2.5 px-3.5 font-[inherit] font-bold cursor-pointer transition-all duration-[120ms] ease-in-out hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:!translate-y-0${selectedUpgradeActionKey === option.actionKey ? " !bg-accent !text-[#fff6ed]" : ""}`}
                type="button"
                onClick={() => setSelectedUpgradeActionKey(option.actionKey)}
                aria-pressed={selectedUpgradeActionKey === option.actionKey}
                title={formatUpgradeOptionTitle(option)}
              >
                {formatUpgradeOptionButton(option)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-ink-soft">{formatSelectedUpgradeDescription(upgradeDebugSnapshot)}</p>
          {upgradeDebugSnapshot.upgradeActionError !== null ? (
            <p className="mt-3 text-accent font-bold">{upgradeDebugSnapshot.upgradeActionError}</p>
          ) : null}
        </div>
        <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-[18px]">
          <div className="flex gap-3 justify-between items-start max-sm:flex-col">
            <div>
              <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Power Step Snapshot</p>
              <h3 className="m-0 font-heading text-[1.35rem]">{formatUpgradeHeadline(upgradeDebugGame)}</h3>
            </div>
            <span className={`w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase ${getUpgradeUsageStatusTw(upgradeDebugSnapshot)}`}>
              {getUpgradeUsageLabel(upgradeDebugSnapshot)}
            </span>
          </div>
          <p className="text-ink-soft">
            This snapshot reaches the same Player One power step, grants a small debug glory pool,
            exposes legal upgrade plays, and replays the selected one through the real engine.
          </p>
          <dl className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-3">
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Legal Actions</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{upgradeDebugSnapshot.upgradeOptions.length}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Glory</dt>
              <dd className="mt-1.5 text-base font-bold m-0">
                {upgradeDebugSnapshot.gloryBeforeUpgrades} to {upgradeDebugSnapshot.gloryAfterUpgrades}
              </dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Equipped</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{upgradeDebugGame.getPlayer(LOCAL_PLAYER_ID)?.equippedUpgrades.length ?? 0}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Attached To</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{formatLatestUpgradeTarget(upgradeDebugGame)}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Turn Step</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{upgradeDebugGame.turnStep ?? "n/a"}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">History</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{getUpgradeHistory(upgradeDebugGame).length}</dd>
            </div>
          </dl>
        </article>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          {upgradeDebugSnapshot.selectedUpgradeActionKey === null ? (
            <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-4 grid gap-2.5">
              <div>
                <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">No Upgrade Yet</p>
                <h3 className="m-0 font-heading">Choose a legal action above</h3>
              </div>
              <p className="mt-1.5 text-ink-soft">
                The snapshot is parked on Player One&apos;s power step until you replay one of the
                legal upgrades.
              </p>
              <span className="w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase bg-idle-bg text-idle">idle</span>
            </article>
          ) : (
            <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-4 grid gap-2.5">
              <div>
                <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Latest Upgrade</p>
                <h3 className="m-0 font-heading">{formatUpgradeHeadline(upgradeDebugGame)}</h3>
              </div>
              <p className="mt-1.5 text-ink-soft">{formatLatestUpgradeTarget(upgradeDebugGame)}</p>
              <p className="mt-1.5 text-ink-soft">
                {formatLatestUpgradeResult(upgradeDebugSnapshot)}
              </p>
              <span className={`w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase ${getUpgradeUsageStatusTw(upgradeDebugSnapshot)}`}>
                {getUpgradeUsageLabel(upgradeDebugSnapshot)}
              </span>
            </article>
          )}
        </div>
      </section>

      <section className="bg-surface border border-[rgba(116,86,51,0.18)] rounded-[22px] p-6 max-sm:p-[18px] shadow-[0_18px_44px_rgba(69,47,22,0.12)] backdrop-blur-[10px]">
        <div className="mb-4">
          <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Warscroll</p>
          <h2 className="m-0 font-heading">Player one power-step warscroll state</h2>
        </div>
        <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-[18px]">
          <div className="flex gap-3 justify-between items-start max-sm:flex-col">
            <div>
              <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Pre-Attack Power Step</p>
              <h3 className="m-0 font-heading text-[1.35rem]">{debugSnapshot.playerWarscrollName}</h3>
            </div>
            <span className={`w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase ${getWarscrollUsageStatusTw(debugSnapshot)}`}>
              {getWarscrollUsageLabel(debugSnapshot)}
            </span>
          </div>
          <p className="text-ink-soft">
            Player one reaches a real power step before the final attack. This panel shows the
            captured legal warscroll actions and any token spend from the selected one.
          </p>
          <dl className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-3">
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Tokens Before</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{formatWarscrollTokens(debugSnapshot.warscrollTokensBefore)}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Tokens After</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{formatWarscrollTokens(debugSnapshot.warscrollTokensAfter)}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Power Hand</dt>
              <dd className="mt-1.5 text-base font-bold m-0">
                {debugSnapshot.powerHandBeforeWarscroll} to {debugSnapshot.powerHandAfterWarscroll}
              </dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Legal Abilities</dt>
              <dd className="mt-1.5 text-base font-bold m-0">
                {debugSnapshot.warscrollAbilityOptions.filter((option) => option.isLegal).length}
              </dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Recorded Result</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{formatWarscrollResolution(debugGame)}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">History</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{getWarscrollAbilityHistory(debugGame).length}</dd>
            </div>
          </dl>
        </article>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          {debugSnapshot.warscrollAbilityOptions.map((option) => (
            <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-4 grid gap-2.5" key={option.abilityIndex}>
              <div>
                <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Ability {option.abilityIndex + 1}</p>
                <h3 className="m-0 font-heading">{option.definition.name}</h3>
              </div>
              <p className="mt-1.5 text-ink-soft">{option.definition.text}</p>
              <p className="mt-1.5 text-ink-soft">
                Cost: {formatWarscrollTokenCosts(option.definition.tokenCosts)}. Effect:{" "}
                {formatWarscrollEffects(option.definition.effects)}.
              </p>
              <span className={`w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase ${getWarscrollAbilityStatusTw(debugSnapshot, option.abilityIndex, option.isLegal)}`}>
                {getWarscrollAbilityStatusLabel(debugSnapshot, option.abilityIndex, option.isLegal)}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-surface border border-[rgba(116,86,51,0.18)] rounded-[22px] p-6 max-sm:p-[18px] shadow-[0_18px_44px_rgba(69,47,22,0.12)] backdrop-blur-[10px]">
        <div className="mb-4">
          <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.72rem] text-accent">End Phase</p>
          <h2 className="m-0 font-heading">Stored end-phase resolutions</h2>
        </div>
        <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-[18px]">
          <div className="flex gap-3 justify-between items-start max-sm:flex-col">
            <div>
              <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Full Round Snapshot</p>
              <h3 className="m-0 font-heading text-[1.35rem]">{endPhaseDebugGame.state.kind}</h3>
            </div>
            <span className="w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase bg-success-bg text-success">recorded</span>
          </div>
          <p className="text-ink-soft">
            This snapshot runs a deterministic round through cleanup, then reads the stored
            objective scoring, objective draw, power draw, and cleanup resolution objects
            directly from game state.
          </p>
          <dl className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-3">
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Round</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{endPhaseDebugGame.roundNumber}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Scoring History</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{getObjectiveScoringHistory(endPhaseDebugGame).length}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Objective Draw History</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{getObjectiveDrawHistory(endPhaseDebugGame).length}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Power Draw History</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{getPowerDrawHistory(endPhaseDebugGame).length}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Cleanup History</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{getCleanupHistory(endPhaseDebugGame).length}</dd>
            </div>
            <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
              <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Last Cleanup</dt>
              <dd className="mt-1.5 text-base font-bold m-0">{formatCleanupHeadline(endPhaseDebugGame)}</dd>
            </div>
          </dl>
        </article>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-4 grid gap-2.5">
            <div>
              <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Score Objectives</p>
              <h3 className="m-0 font-heading">{formatObjectiveScoringHeadline(endPhaseDebugGame)}</h3>
            </div>
            {formatObjectiveScoringDetails(endPhaseDebugGame).map((detail) => (
              <p className="mt-1.5 text-ink-soft" key={detail}>{detail}</p>
            ))}
            <span className={`w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase ${getResolutionStatusTw(getLatestObjectiveScoringResolution(endPhaseDebugGame))}`}>
              {getResolutionStatusLabel(getLatestObjectiveScoringResolution(endPhaseDebugGame))}
            </span>
          </article>
          <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-4 grid gap-2.5">
            <div>
              <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Draw Objectives</p>
              <h3 className="m-0 font-heading">{formatObjectiveDrawHeadline(endPhaseDebugGame)}</h3>
            </div>
            {formatObjectiveDrawDetails(endPhaseDebugGame).map((detail) => (
              <p className="mt-1.5 text-ink-soft" key={detail}>{detail}</p>
            ))}
            <span className={`w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase ${getResolutionStatusTw(getLatestObjectiveDrawResolution(endPhaseDebugGame))}`}>
              {getResolutionStatusLabel(getLatestObjectiveDrawResolution(endPhaseDebugGame))}
            </span>
          </article>
          <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-4 grid gap-2.5">
            <div>
              <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Draw Power Cards</p>
              <h3 className="m-0 font-heading">{formatPowerDrawHeadline(endPhaseDebugGame)}</h3>
            </div>
            {formatPowerDrawDetails(endPhaseDebugGame).map((detail) => (
              <p className="mt-1.5 text-ink-soft" key={detail}>{detail}</p>
            ))}
            <span className={`w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase ${getResolutionStatusTw(getLatestPowerDrawResolution(endPhaseDebugGame))}`}>
              {getResolutionStatusLabel(getLatestPowerDrawResolution(endPhaseDebugGame))}
            </span>
          </article>
          <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-4 grid gap-2.5">
            <div>
              <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Cleanup</p>
              <h3 className="m-0 font-heading">{formatCleanupHeadline(endPhaseDebugGame)}</h3>
            </div>
            {formatCleanupDetails(endPhaseDebugGame).map((detail) => (
              <p className="mt-1.5 text-ink-soft" key={detail}>{detail}</p>
            ))}
            <span className={`w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase ${getResolutionStatusTw(getLatestCleanupResolution(endPhaseDebugGame))}`}>
              {getResolutionStatusLabel(getLatestCleanupResolution(endPhaseDebugGame))}
            </span>
          </article>
        </div>
      </section>

      <section className="bg-surface border border-[rgba(116,86,51,0.18)] rounded-[22px] p-6 max-sm:p-[18px] shadow-[0_18px_44px_rgba(69,47,22,0.12)] backdrop-blur-[10px]">
        <div className="mb-4">
          <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.72rem] text-accent">History</p>
          <h2 className="m-0 font-heading">Combat results</h2>
        </div>
        <div className="grid gap-3">
          {combatHistory.map((result, index) => (
            <CombatResultCard
              key={`${result.context.attackerFighterId}:${result.context.targetFighterId}:${index}`}
              game={debugGame}
              result={result}
              label={`Attack ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="bg-surface border border-[rgba(116,86,51,0.18)] rounded-[22px] p-6 max-sm:p-[18px] shadow-[0_18px_44px_rgba(69,47,22,0.12)] backdrop-blur-[10px] grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[18px]">
        <div>
          <div className="mb-4">
            <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Board Snapshot</p>
            <h2 className="m-0 font-heading">Fighters after the attack</h2>
          </div>
          <div className="grid gap-3">
            {debugGame.players.flatMap((player) =>
              player.fighters.map((fighter) => (
                <article className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-4" key={reactKey(fighter)}>
                  <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">{player.name}</p>
                  <h3 className="m-0 font-heading text-[1.15rem]">{getFighterName(debugGame, fighter.id)}</h3>
                  <p className="mt-1.5 text-ink-soft">{fighter.currentHex?.id ?? "slain / off-board"}</p>
                  <p className="mt-1.5 text-ink-soft">Damage: {fighter.damage}</p>
                  <p className="mt-1.5 text-ink-soft">Tokens: {formatFighterTokens(fighter)}</p>
                </article>
              )),
            )}
          </div>
        </div>

        <div>
          <div className="mb-4">
            <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.72rem] text-accent">Event Log</p>
            <h2 className="m-0 font-heading">Recent engine events</h2>
          </div>
          <ol className="m-0 pl-5 grid gap-2 leading-[1.5] text-ink-soft">
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
    <article className={`bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-[18px]${isLatest ? " bg-linear-to-br from-[rgba(246,228,206,0.92)] to-[rgba(255,249,239,0.96)]" : ""}`}>
      <div className="flex gap-3 justify-between items-start max-sm:flex-col">
        <div>
          <p className="m-0 mb-1.5 uppercase tracking-[0.14em] text-[0.72rem] text-accent">{label}</p>
          <h3 className="m-0 font-heading text-[1.35rem]">
            {attackerName} attacked {defenderName}
          </h3>
        </div>
        <span className={`py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold capitalize ${getOutcomeTw(result.outcome)}`}>{result.outcome}</span>
      </div>

      <p className="text-ink-soft">
        {attackerPlayerName} used {weaponName}{selectedAbilityText} into {defenderPlayerName}.
      </p>

      <dl className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-3">
        <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
          <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Attack Roll</dt>
          <dd className="mt-1.5 text-base font-bold m-0">{formatRoll(result.attackRoll)}</dd>
        </div>
        <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
          <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Save Roll</dt>
          <dd className="mt-1.5 text-base font-bold m-0">{formatRoll(result.saveRoll)}</dd>
        </div>
        <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
          <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Successes</dt>
          <dd className="mt-1.5 text-base font-bold m-0">
            {result.attackSuccesses} vs {result.saveSuccesses}
          </dd>
        </div>
        <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
          <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Criticals</dt>
          <dd className="mt-1.5 text-base font-bold m-0">
            {result.attackCriticals} vs {result.saveCriticals}
          </dd>
        </div>
        <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
          <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Damage</dt>
          <dd className="mt-1.5 text-base font-bold m-0">{result.damageInflicted}</dd>
        </div>
        <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
          <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Effects</dt>
          <dd className="mt-1.5 text-base font-bold m-0">{formatCombatEffects(result)}</dd>
        </div>
        {defenderFeatureTokenBeforeAttack !== undefined ? (
          <div className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
            <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">Defender Feature</dt>
            <dd className="mt-1.5 text-base font-bold m-0">{formatDefenderFeatureToken(game, defenderFeatureTokenBeforeAttack)}</dd>
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

  return game.players.find((p) => p.id === playerId)?.name ?? playerId;
}

function getFighterName(game: Game, fighterId: string): string {
  for (const player of game.players) {
    const fighter = player.fighters.find((f) => f.id === fighterId);
    if (fighter !== undefined) {
      return fighter.definition.name;
    }
  }

  return fighterId;
}

function getWeaponName(game: Game, fighterId: string, weaponId: string): string {
  for (const player of game.players) {
    const fighter = player.fighters.find((f) => f.id === fighterId);
    const weapon = fighter?.definition.getWeapon(weaponId);
    if (weapon !== undefined && weapon !== null) {
      return weapon.name;
    }
  }

  return weaponId;
}

function getLatestCombatResult(game: Game) {
  return game.getLatestRecord(GameRecordKind.Combat);
}

function getCombatHistory(game: Game) {
  return game.getRecordHistory(GameRecordKind.Combat);
}

function getLatestDelveResolution(game: Game) {
  return game.getLatestRecord(GameRecordKind.Delve);
}

function getDelveHistory(game: Game) {
  return game.getRecordHistory(GameRecordKind.Delve);
}

function getLatestPloyResolution(game: Game) {
  return game.getLatestRecord(GameRecordKind.Ploy);
}

function getPloyHistory(game: Game) {
  return game.getRecordHistory(GameRecordKind.Ploy);
}

function getLatestUpgradeResolution(game: Game) {
  return game.getLatestRecord(GameRecordKind.Upgrade);
}

function getUpgradeHistory(game: Game) {
  return game.getRecordHistory(GameRecordKind.Upgrade);
}

function getLatestWarscrollAbilityResolution(game: Game) {
  return game.getLatestRecord(GameRecordKind.WarscrollAbility);
}

function getWarscrollAbilityHistory(game: Game) {
  return game.getRecordHistory(GameRecordKind.WarscrollAbility);
}

function getLatestObjectiveScoringResolution(game: Game) {
  return game.getLatestRecord(GameRecordKind.ObjectiveScoring);
}

function getObjectiveScoringHistory(game: Game) {
  return game.getRecordHistory(GameRecordKind.ObjectiveScoring);
}

function getLatestObjectiveDrawResolution(game: Game) {
  return game.getLatestRecord(GameRecordKind.ObjectiveDraw);
}

function getObjectiveDrawHistory(game: Game) {
  return game.getRecordHistory(GameRecordKind.ObjectiveDraw);
}

function getLatestPowerDrawResolution(game: Game) {
  return game.getLatestRecord(GameRecordKind.PowerDraw);
}

function getPowerDrawHistory(game: Game) {
  return game.getRecordHistory(GameRecordKind.PowerDraw);
}

function getLatestCleanupResolution(game: Game) {
  return game.getLatestRecord(GameRecordKind.Cleanup);
}

function getCleanupHistory(game: Game) {
  return game.getRecordHistory(GameRecordKind.Cleanup);
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

function formatFighterTokens(fighter: Fighter): string {
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

function formatDefenderFeatureToken(
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
  const resolution = getLatestWarscrollAbilityResolution(debugSnapshot.game);

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
  const resolution = getLatestWarscrollAbilityResolution(game);
  if (resolution === null) {
    return "none";
  }

  return `${resolution.abilityName}: ${resolution.effectSummaries.join(", ")}`;
}

function formatPloyHeadline(game: Game): string {
  const resolution = getLatestPloyResolution(game);
  if (resolution === null) {
    return "No ploy recorded";
  }

  return `${resolution.cardName} by ${resolution.playerName}`;
}

function formatPloyTargetHeadline(game: Game): string {
  const resolution = getLatestPloyResolution(game);
  if (resolution === null || resolution.targetFighterId === null) {
    return "none";
  }

  return `${resolution.targetFighterName} (${resolution.targetOwnerPlayerName})`;
}

function formatPloyEffectHeadline(game: Game): string {
  const resolution = getLatestPloyResolution(game);
  if (resolution === null) {
    return "none";
  }

  return resolution.effectSummaries.join(", ");
}

function formatPloyResolutionTarget(
  resolution: NonNullable<ReturnType<typeof getLatestPloyResolution>>,
): string {
  if (resolution.targetFighterId === null) {
    return "No fighter target";
  }

  return `Target: ${resolution.targetFighterName} (${resolution.targetOwnerPlayerName})`;
}

function formatSelectedPloyDescription(
  ployDebugSnapshot: ReturnType<typeof createPloyDebugSnapshot>,
): string {
  if (ployDebugSnapshot.ployOptions.length === 0) {
    return "No legal ploy actions were available in the captured power step.";
  }

  if (ployDebugSnapshot.selectedPloyActionKey === null) {
    return "Choose any legal ploy action from Player One's captured power step to replay it through the engine.";
  }

  const selectedOption = ployDebugSnapshot.ployOptions.find(
    (option) => option.actionKey === ployDebugSnapshot.selectedPloyActionKey,
  );
  if (selectedOption === undefined) {
    return `Selected ploy action ${ployDebugSnapshot.selectedPloyActionKey} is not available in this snapshot.`;
  }

  if (ployDebugSnapshot.ployActionError !== null) {
    return `${formatPloyOptionTitle(selectedOption)} failed during replay.`;
  }

  return `${formatPloyOptionTitle(selectedOption)} resolved through the captured power step.`;
}

function formatPloyOptionButton(option: PloyDebugOption): string {
  return option.targetFighterName === null ? option.cardName : `${option.cardName} -> ${option.targetFighterName}`;
}

function formatPloyOptionTitle(option: PloyDebugOption): string {
  if (option.targetFighterName === null) {
    return option.cardName;
  }

  if (option.targetOwnerPlayerName === null) {
    return `${option.cardName} targeting ${option.targetFighterName}`;
  }

  return `${option.cardName} targeting ${option.targetFighterName} (${option.targetOwnerPlayerName})`;
}

function formatDelveHeadline(game: Game): string {
  const resolution = getLatestDelveResolution(game);
  if (resolution === null) {
    return "No delve recorded";
  }

  return `${resolution.fighterName} delved ${resolution.featureTokenId}`;
}

function formatDelveFeatureToken(game: Game): string {
  const resolution = getLatestDelveResolution(game);
  if (resolution === null) {
    return "none";
  }

  return `${resolution.featureTokenId} on ${resolution.featureTokenHexId}`;
}

function formatDelveTransition(game: Game): string {
  const resolution = getLatestDelveResolution(game);
  if (resolution === null) {
    return "none";
  }

  return `${resolution.sideBeforeDelve} to ${resolution.sideAfterDelve}`;
}

function formatDelveHolderAfter(game: Game): string {
  const resolution = getLatestDelveResolution(game);
  if (resolution === null || resolution.holderAfterFighterId === null) {
    return "none";
  }

  return resolution.holderAfterFighterName ?? resolution.holderAfterFighterId;
}

function formatDelveStagger(game: Game): string {
  const resolution = getLatestDelveResolution(game);
  if (resolution === null) {
    return "none";
  }

  return resolution.staggerApplied ? "applied" : "already staggered";
}

function formatDelveDetails(game: Game): string[] {
  const resolution = getLatestDelveResolution(game);
  if (resolution === null) {
    return ["The debug snapshot did not record a delve action."];
  }

  return [
    `${resolution.playerName}: ${resolution.fighterName} delved ${resolution.featureTokenId}.`,
    `Feature token flipped from ${resolution.sideBeforeDelve} to ${resolution.sideAfterDelve}.`,
    resolution.holderAfterFighterId === null
      ? "No fighter holds the feature token after the delve."
      : `${resolution.holderAfterFighterName ?? resolution.holderAfterFighterId} holds the feature token after the delve.`,
    resolution.staggerApplied
      ? `${resolution.fighterName} gained a stagger token.`
      : `${resolution.fighterName} was already staggered before the delve.`,
  ];
}

function formatSelectedUpgradeDescription(
  upgradeDebugSnapshot: ReturnType<typeof createUpgradeDebugSnapshot>,
): string {
  if (upgradeDebugSnapshot.upgradeOptions.length === 0) {
    return "No legal upgrade actions were available in the captured power step.";
  }

  if (upgradeDebugSnapshot.selectedUpgradeActionKey === null) {
    return "Choose any legal upgrade action from Player One's captured power step to replay it through the engine.";
  }

  const selectedOption = upgradeDebugSnapshot.upgradeOptions.find(
    (option) => option.actionKey === upgradeDebugSnapshot.selectedUpgradeActionKey,
  );
  if (selectedOption === undefined) {
    return `Selected upgrade action ${upgradeDebugSnapshot.selectedUpgradeActionKey} is not available in this snapshot.`;
  }

  if (upgradeDebugSnapshot.upgradeActionError !== null) {
    return `${formatUpgradeOptionTitle(selectedOption)} failed during replay.`;
  }

  const resolution = getLatestUpgradeResolution(upgradeDebugSnapshot.game);
  if (resolution === null) {
    return `${formatUpgradeOptionTitle(selectedOption)} resolved, but no upgrade resolution was recorded.`;
  }

  return `${resolution.cardName} on ${resolution.fighterName} resolved and spent ${resolution.gloryPaid} glory.`;
}

function formatUpgradeOptionButton(option: UpgradeDebugOption): string {
  return `${option.cardName} -> ${option.fighterName}`;
}

function formatUpgradeOptionTitle(option: UpgradeDebugOption): string {
  return `${option.cardName} on ${option.fighterName} (${option.gloryCost} glory)`;
}

function formatUpgradeHeadline(game: Game): string {
  const resolution = getLatestUpgradeResolution(game);
  if (resolution === null) {
    return "No upgrade recorded";
  }

  return `${resolution.cardName} on ${resolution.fighterName}`;
}

function formatLatestUpgradeTarget(game: Game): string {
  const resolution = getLatestUpgradeResolution(game);
  if (resolution === null) {
    return "none";
  }

  return resolution.fighterName;
}

function formatLatestUpgradeResult(
  upgradeDebugSnapshot: ReturnType<typeof createUpgradeDebugSnapshot>,
): string {
  const resolution = getLatestUpgradeResolution(upgradeDebugSnapshot.game);
  if (resolution === null) {
    return "No upgrade has been replayed yet.";
  }

  if (upgradeDebugSnapshot.upgradeActionError !== null) {
    return upgradeDebugSnapshot.upgradeActionError;
  }

  const playerOne = upgradeDebugSnapshot.game.players.find((p) => p.id === resolution.playerId);
  const fighter = playerOne?.getFighter(resolution.fighterId);
  const attachedCount = fighter?.upgrades.length ?? 0;
  return `Glory ${upgradeDebugSnapshot.gloryBeforeUpgrades} to ${upgradeDebugSnapshot.gloryAfterUpgrades}. ${resolution.fighterName} now has ${attachedCount} attached upgrade${attachedCount === 1 ? "" : "s"}.`;
}

function getUpgradeUsageLabel(
  upgradeDebugSnapshot: ReturnType<typeof createUpgradeDebugSnapshot>,
): string {
  if (upgradeDebugSnapshot.selectedUpgradeActionKey === null) {
    return "unused";
  }

  if (upgradeDebugSnapshot.upgradeActionError !== null) {
    return "failed";
  }

  return getResolutionStatusLabel(getLatestUpgradeResolution(upgradeDebugSnapshot.game));
}

function getUpgradeUsageStatusTw(
  upgradeDebugSnapshot: ReturnType<typeof createUpgradeDebugSnapshot>,
): string {
  if (upgradeDebugSnapshot.selectedUpgradeActionKey === null) {
    return "bg-idle-bg text-idle";
  }

  if (upgradeDebugSnapshot.upgradeActionError !== null) {
    return "bg-failure-bg text-failure";
  }

  return getResolutionStatusTw(getLatestUpgradeResolution(upgradeDebugSnapshot.game));
}

function getWarscrollUsageLabel(debugSnapshot: CombatDebugSnapshot): string {
  if (debugSnapshot.selectedWarscrollAbilityIndex === null) {
    return "unused";
  }

  return debugSnapshot.warscrollAbilityError === null ? "used" : "failed";
}

function getWarscrollUsageStatusTw(debugSnapshot: CombatDebugSnapshot): string {
  if (debugSnapshot.selectedWarscrollAbilityIndex === null) {
    return "bg-idle-bg text-idle";
  }

  return debugSnapshot.warscrollAbilityError === null ? "bg-success-bg text-success" : "bg-failure-bg text-failure";
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

function getWarscrollAbilityStatusTw(
  debugSnapshot: CombatDebugSnapshot,
  abilityIndex: number,
  isLegal: boolean,
): string {
  if (debugSnapshot.selectedWarscrollAbilityIndex === abilityIndex) {
    return debugSnapshot.warscrollAbilityError === null ? "bg-success-bg text-success" : "bg-failure-bg text-failure";
  }

  return isLegal ? "bg-success-bg text-success" : "bg-failure-bg text-failure";
}

function formatObjectiveScoringHeadline(game: Game): string {
  const resolution = getLatestObjectiveScoringResolution(game);
  if (resolution === null) {
    return "No scoring recorded";
  }

  return `${resolution.totalObjectivesScored} objective${resolution.totalObjectivesScored === 1 ? "" : "s"} / ${resolution.totalGloryGained} glory`;
}

function formatObjectiveScoringDetails(game: Game): string[] {
  const resolution = getLatestObjectiveScoringResolution(game);
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
  const resolution = getLatestObjectiveDrawResolution(game);
  if (resolution === null) {
    return "No objective draw recorded";
  }

  return `${resolution.totalCardsDrawn} objective card${resolution.totalCardsDrawn === 1 ? "" : "s"} drawn`;
}

function formatObjectiveDrawDetails(game: Game): string[] {
  const resolution = getLatestObjectiveDrawResolution(game);
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
  const resolution = getLatestPowerDrawResolution(game);
  if (resolution === null) {
    return "No power draw recorded";
  }

  return `${resolution.totalCardsDrawn} power card${resolution.totalCardsDrawn === 1 ? "" : "s"} drawn`;
}

function formatPowerDrawDetails(game: Game): string[] {
  const resolution = getLatestPowerDrawResolution(game);
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
  const resolution = getLatestCleanupResolution(game);
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
  const resolution = getLatestCleanupResolution(game);
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

function getResolutionStatusTw(resolution: object | null): string {
  return resolution === null ? "bg-failure-bg text-failure" : "bg-success-bg text-success";
}

function getOutcomeTw(outcome: string): string {
  switch (outcome) {
    case "success":
      return "bg-success-bg text-success";
    case "draw":
      return "bg-idle-bg text-idle";
    case "failure":
      return "bg-failure-bg text-failure";
    default:
      return "bg-idle-bg text-idle";
  }
}

export { DebugApp };
