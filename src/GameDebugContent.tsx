import type { FighterId, Game, HexId, Player } from "./domain";
import { TurnStep } from "./domain";
import type {
  AttackProfileSummary,
  ChargeProfileSummary,
  FighterActionLens,
} from "./board/battlefieldModels";
import {
  formatFeatureTokenSide,
  getFighterName,
} from "./board/battlefieldFormatters";
import PlayerPanel from "./board/PlayerPanel";

export type GameDebugContentProps = {
  game: Game;
  localPlayer: Player | null;
  activePlayer: Player | null;
  selectedFighterId: FighterId | null;
  selectedFighterName: string;
  selectedMoveHexId: HexId | null;
  selectedMoveOption: { hexId: HexId; label: string; action: unknown } | null;
  selectedChargeOption: { key: string; label: string; action: unknown } | null;
  actionLens: FighterActionLens;
  actionPrompt: string;
  attackProfiles: AttackProfileSummary[];
  chargeProfiles: ChargeProfileSummary[];
  pendingChargeHexId: HexId | null;
  pendingFocus: boolean;
  pendingGuardFighterId: FighterId | null;
  pendingPassPower: boolean;
  moveOptions: ReadonlyArray<{ hexId: HexId; label: string; action: unknown }>;
  chargeOptions: ReadonlyArray<{ key: string; label: string; action: unknown }>;
  recentEvents: string[];
  selectFighter: (fighterId: FighterId | null) => void;
  selectAttackProfile: (targetId: FighterId, attackKey: string) => void;
  selectChargeProfile: (targetId: FighterId, chargeKey: string) => void;
  focusHand: () => void;
  guardSelectedFighter: () => void;
  passTurn: () => void;
  applyAction: (action: any) => void;
  setSelectedMoveHexId: (hexId: HexId | null) => void;
  setSelectedChargeKey: (key: string | null) => void;
};

export default function GameDebugContent({
  game,
  localPlayer,
  activePlayer,
  selectedFighterId,
  selectedFighterName,
  selectedMoveHexId,
  selectedMoveOption,
  selectedChargeOption,
  actionLens,
  actionPrompt,
  attackProfiles,
  chargeProfiles,
  pendingChargeHexId,
  pendingFocus,
  pendingGuardFighterId,
  pendingPassPower,
  moveOptions,
  chargeOptions,
  recentEvents,
  selectFighter,
  selectAttackProfile,
  selectChargeProfile,
  focusHand,
  guardSelectedFighter,
  passTurn,
  applyAction,
  setSelectedMoveHexId,
  setSelectedChargeKey,
}: GameDebugContentProps) {
  return (
    <>
      <div className="grid gap-3">
        <section className="bg-[rgba(255,252,245,0.72)] border border-[rgba(85,66,40,0.14)] rounded-[14px] p-3.5">
          <div className="mb-4">
            <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.74rem] text-[#8a5630]">Action Lens</p>
            <h2 className="m-0 font-heading">Legal actions for the selected fighter</h2>
            <p className="mt-3 text-[#645345] leading-relaxed">
              Click one of {activePlayer?.name ?? "the active player"}&apos;s fighters on the board or in the roster.
            </p>
          </div>
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-2 [&>div]:bg-[rgba(239,231,219,0.76)] [&>div]:border [&>div]:border-[rgba(117,92,64,0.18)] [&>div]:rounded-card [&>div]:py-2 [&>div]:px-2.5 [&_dt]:text-[0.76rem] [&_dt]:uppercase [&_dt]:tracking-[0.08em] [&_dt]:text-[#8e7a66] [&_dd]:mt-1.5 [&_dd]:ml-0 [&_dd]:text-base [&_dd]:font-bold">
            <div>
              <dt>Selected</dt>
              <dd>{selectedFighterName}</dd>
            </div>
            <div>
              <dt>Move Hexes</dt>
              <dd>{actionLens.moveCount}</dd>
            </div>
            <div>
              <dt>Attack Targets</dt>
              <dd>{actionLens.attackCount}</dd>
            </div>
            <div>
              <dt>Charge Paths</dt>
              <dd>{actionLens.chargeCount}</dd>
            </div>
            <div>
              <dt>Delve</dt>
              <dd>{actionLens.delveAvailable ? "legal" : "no"}</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>{actionLens.focusAvailable ? "legal" : "no"}</dd>
            </div>
            <div>
              <dt>Guard</dt>
              <dd>{actionLens.guardAvailable ? "legal" : "no"}</dd>
            </div>
          </dl>
          <p className="mt-3.5 text-[#645345] font-bold">{actionPrompt}</p>
          <div className="grid gap-2.5 mt-3.5">
            {attackProfiles.length === 0 ? (
              <p className="mt-1.5 text-[#645345]">No legal attack profiles right now.</p>
            ) : (
              attackProfiles.map((profile) => (
                <article key={profile.targetId} className="py-3 px-3.5 rounded-[16px] bg-[rgba(244,233,238,0.86)] border border-[rgba(128,57,84,0.16)]">
                  <div className="flex justify-between gap-2.5 items-center text-[#4f2334]">
                    <strong>{profile.targetName}</strong>
                    <span className="py-[3px] px-2 rounded-pill bg-[rgba(123,28,58,0.92)] text-[#fff4f8] text-[0.68rem] font-bold uppercase tracking-[0.04em]">
                      {profile.selectedKey === profile.defaultKey ? "map default" : "custom pick"}
                    </span>
                  </div>
                  <div className="grid gap-2 mt-2.5">
                    {profile.options.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        className={[
                          "text-left border border-[rgba(128,57,84,0.16)] rounded-button py-2.5 px-3 bg-[rgba(255,249,251,0.86)] text-inherit cursor-pointer transition-all duration-[120ms] ease-in-out hover:enabled:-translate-y-px hover:enabled:shadow-[0_8px_16px_rgba(79,35,52,0.1)] disabled:opacity-[0.68] disabled:cursor-not-allowed",
                          option.key === profile.selectedKey ? "border-[rgba(123,28,58,0.44)] bg-[rgba(253,240,245,0.96)] shadow-[inset_0_0_0_1px_rgba(123,28,58,0.1)]" : "",
                        ].filter(Boolean).join(" ")}
                        disabled={game.turnStep !== TurnStep.Action}
                        onClick={() => selectAttackProfile(profile.targetId, option.key)}
                      >
                        <span className="flex justify-between gap-2.5 items-center">
                          <span className="text-[#3d2230] font-bold">{option.label}</span>
                          {option.isDefault ? (
                            <span className="py-0.5 px-[7px] rounded-pill bg-[rgba(84,63,45,0.08)] border border-[rgba(84,63,45,0.12)] text-[#5e4b3a] text-[0.66rem] font-bold uppercase tracking-[0.04em]">default</span>
                          ) : null}
                        </span>
                        <span className="mt-1.5 text-[#645345]">{option.stats}</span>
                      </button>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
          {pendingChargeHexId === null ? null : (
            <div className="mt-4">
              <p className="m-0 text-[#645345] font-bold">Charge Profiles from {pendingChargeHexId}</p>
              <div className="grid gap-2.5 mt-3.5">
                {chargeProfiles.length === 0 ? (
                  <p className="mt-1.5 text-[#645345]">No legal charge profiles from this hex.</p>
                ) : (
                  chargeProfiles.map((profile) => (
                    <article key={`${pendingChargeHexId}:${profile.targetId}`} className="py-3 px-3.5 rounded-[16px] bg-[rgba(244,233,238,0.86)] border border-[rgba(128,57,84,0.16)]">
                      <div className="flex justify-between gap-2.5 items-center text-[#4f2334]">
                        <strong>{profile.targetName}</strong>
                        <span className="py-[3px] px-2 rounded-pill bg-[rgba(123,28,58,0.92)] text-[#fff4f8] text-[0.68rem] font-bold uppercase tracking-[0.04em]">
                          {profile.selectedKey === profile.defaultKey ? "charge default" : "custom pick"}
                        </span>
                      </div>
                      <div className="grid gap-2 mt-2.5">
                        {profile.options.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            className={[
                              "text-left border border-[rgba(128,57,84,0.16)] rounded-button py-2.5 px-3 bg-[rgba(255,249,251,0.86)] text-inherit cursor-pointer transition-all duration-[120ms] ease-in-out hover:enabled:-translate-y-px hover:enabled:shadow-[0_8px_16px_rgba(79,35,52,0.1)] disabled:opacity-[0.68] disabled:cursor-not-allowed",
                              option.key === profile.selectedKey ? "border-[rgba(123,28,58,0.44)] bg-[rgba(253,240,245,0.96)] shadow-[inset_0_0_0_1px_rgba(123,28,58,0.1)]" : "",
                            ].filter(Boolean).join(" ")}
                            disabled={game.turnStep !== TurnStep.Action}
                            onClick={() => selectChargeProfile(profile.targetId, option.key)}
                          >
                            <span className="flex justify-between gap-2.5 items-center">
                              <span className="text-[#3d2230] font-bold">{option.label}</span>
                              {option.isDefault ? (
                                <span className="py-0.5 px-[7px] rounded-pill bg-[rgba(84,63,45,0.08)] border border-[rgba(84,63,45,0.12)] text-[#5e4b3a] text-[0.66rem] font-bold uppercase tracking-[0.04em]">default</span>
                              ) : null}
                            </span>
                            <span className="mt-1.5 text-[#645345]">{option.stats}</span>
                          </button>
                        ))}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          )}
          <div className="grid gap-3 mt-3.5 [&_select]:border [&_select]:border-[rgba(84,63,45,0.18)] [&_select]:rounded-[12px] [&_select]:py-2.5 [&_select]:px-3 [&_select]:font-[inherit] [&_select]:bg-[rgba(255,251,243,0.88)] [&_select]:text-heading [&_select]:disabled:opacity-60 [&_select]:disabled:cursor-not-allowed [&_button]:border [&_button]:border-[rgba(84,63,45,0.18)] [&_button]:rounded-[12px] [&_button]:py-2.5 [&_button]:px-3 [&_button]:font-[inherit] [&_button]:bg-[rgba(255,251,243,0.88)] [&_button]:text-heading [&_button]:cursor-pointer [&_button]:font-bold [&_button]:disabled:opacity-60 [&_button]:disabled:cursor-not-allowed">
            <label className="grid gap-2 text-[#5e4b3a] font-bold">
              <span>Move</span>
              <select
                value={selectedMoveOption?.hexId ?? ""}
                onChange={(event) => setSelectedMoveHexId(event.target.value === "" ? null : event.target.value as HexId)}
                disabled={selectedMoveOption === null || game.turnStep !== TurnStep.Action}
              >
                {moveOptions.length === 0 ? (
                  <option value="">No legal move</option>
                ) : (
                  moveOptions.map((option) => (
                    <option key={option.hexId} value={option.hexId}>
                      {option.label}
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (selectedMoveOption !== null) {
                    applyAction(selectedMoveOption.action);
                  }
                }}
                disabled={selectedMoveOption === null || game.turnStep !== TurnStep.Action}
              >
                Apply
              </button>
            </label>
            <label className="grid gap-2 text-[#5e4b3a] font-bold">
              <span>Charge</span>
              <select
                value={selectedChargeOption?.key ?? ""}
                onChange={(event) => setSelectedChargeKey(event.target.value === "" ? null : event.target.value)}
                disabled={selectedChargeOption === null || game.turnStep !== TurnStep.Action}
              >
                {chargeOptions.length === 0 ? (
                  <option value="">No legal charge</option>
                ) : (
                  chargeOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (selectedChargeOption !== null) {
                    applyAction(selectedChargeOption.action);
                  }
                }}
                disabled={selectedChargeOption === null || game.turnStep !== TurnStep.Action}
              >
                Apply
              </button>
            </label>
            <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5">
              <button
                type="button"
                onClick={focusHand}
                disabled={actionLens.focusAction === null || game.turnStep !== TurnStep.Action}
              >
                {pendingFocus ? "Confirm Focus" : "Focus"}
              </button>
              <button
                type="button"
                onClick={guardSelectedFighter}
                disabled={actionLens.guardAction === null || game.turnStep !== TurnStep.Action}
              >
                {pendingGuardFighterId === selectedFighterId && selectedFighterId !== null ? "Confirm Guard" : "Guard"}
              </button>
              <button
                type="button"
                onClick={passTurn}
                disabled={actionLens.passAction === null}
              >
                {game.turnStep === TurnStep.Power
                  ? pendingPassPower ? "Confirm Pass Power" : "Pass Power"
                  : "Pass"}
              </button>
            </div>
          </div>
        </section>

        <section className="bg-[rgba(255,252,245,0.72)] border border-[rgba(85,66,40,0.14)] rounded-[14px] p-3.5">
          <div className="mb-4">
            <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.74rem] text-[#8a5630]">Warbands</p>
            <h2 className="m-0 font-heading">Players and fighters</h2>
          </div>
          <div className="grid gap-3">
            {game.players.map((player) => (
              <PlayerPanel
                key={player.id}
                activePlayerId={activePlayer?.id ?? null}
                game={game}
                player={player}
                selectedFighterId={selectedFighterId}
                onSelectFighter={selectFighter}
              />
            ))}
          </div>
        </section>

        <section className="bg-[rgba(255,252,245,0.72)] border border-[rgba(85,66,40,0.14)] rounded-[14px] p-3.5">
          <div className="mb-4">
            <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.74rem] text-[#8a5630]">Feature Tokens</p>
            <h2 className="m-0 font-heading">Placed objectives and cover</h2>
          </div>
          <div className="grid gap-3">
            {game.board.featureTokens.map((featureToken) => {
              const sideBg = featureToken.side === "hidden" ? "bg-[rgba(236,231,224,0.92)]" : featureToken.side === "treasure" ? "bg-[rgba(239,223,142,0.92)]" : "bg-[rgba(196,223,177,0.92)]";
              return (
              <article key={featureToken.id} className="bg-[rgba(239,231,219,0.76)] border border-[rgba(117,92,64,0.18)] rounded-card p-3.5">
                <div className="flex justify-between gap-3 items-start">
                  <strong>{featureToken.id}</strong>
                  <span className={`py-[3px] px-2 rounded-pill text-[0.64rem] font-bold border border-[rgba(73,56,39,0.22)] text-[#2e241b] ${sideBg}`}>
                    {formatFeatureTokenSide(featureToken.side)}
                  </span>
                </div>
                <p className="text-[#645345]">Hex: {featureToken.hexId}</p>
                <p className="text-[#645345]">
                  Holder: {featureToken.heldByFighterId === null ? "none" : getFighterName(game, featureToken.heldByFighterId)}
                </p>
              </article>
              );
            })}
          </div>
        </section>

        <section className="bg-[rgba(255,252,245,0.72)] border border-[rgba(85,66,40,0.14)] rounded-[14px] p-3.5">
          <div className="mb-4">
            <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.74rem] text-[#8a5630]">Match Log</p>
            <h2 className="m-0 font-heading">Recent events</h2>
          </div>
          <ol className="m-0 pl-[18px] grid gap-2 leading-relaxed text-[#645345]">
            {recentEvents.map((event, index) => (
              <li key={`${index}-${event}`}>{event}</li>
            ))}
          </ol>
        </section>

        <section className="bg-[rgba(255,252,245,0.72)] border border-[rgba(85,66,40,0.14)] rounded-[14px] p-3.5">
          <div className="mb-4">
            <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.74rem] text-[#8a5630]">Debug</p>
            <h2 className="m-0 font-heading">Game Records</h2>
          </div>
          {game.pendingCombat !== null && (
            <div style={{ background: "#2a1a00", border: "1px solid #c90", padding: "6px 8px", marginBottom: 8, fontSize: 11, fontFamily: "monospace", color: "#ffd" }}>
              <strong>pendingCombat:</strong> phase={game.pendingCombat.phase},
              attacker={game.pendingCombat.attackerFighterId},
              target={game.pendingCombat.targetFighterId},
              weapon={game.pendingCombat.weaponId},
              ability={String(game.pendingCombat.selectedAbility)},
              attackRoll=[{game.pendingCombat.attackRoll.join(",")}],
              saveRoll=[{game.pendingCombat.saveRoll.join(",")}],
              outcome={String(game.pendingCombat.outcome)},
              dmg={game.pendingCombat.damageInflicted}
            </div>
          )}
          {localPlayer !== null && (
            <div style={{ background: "#1a1a2a", border: "1px solid #669", padding: "6px 8px", marginBottom: 8, fontSize: 11, fontFamily: "monospace", color: "#ddf" }}>
              <strong>Power Hand ({localPlayer.powerHand.length} cards):</strong>
              {localPlayer.powerHand.map((card) => {
                const targets = card.getLegalTargets(game);
                return (
                  <div key={card.id} style={{ color: targets.length > 0 ? "#0f0" : "#666", paddingLeft: 8 }}>
                    {card.name} [{card.kind}] zone={card.zone} targets={targets.length}
                  </div>
                );
              })}
            </div>
          )}
          <ol style={{ fontSize: 11, fontFamily: "monospace", listStyle: "none", padding: 0, margin: 0, maxHeight: 300, overflowY: "auto" }}>
            {[...game.records].reverse().slice(0, 30).map((record, index) => (
              <li key={index} style={{ padding: "2px 4px", borderBottom: "1px solid #333", color: "#ccc" }}>
                <strong style={{ color: "#8cf" }}>{record.kind}</strong>
                {record.invokedByPlayerId && <span> by={record.invokedByPlayerId}</span>}
                {record.invokedByFighterId && <span> fighter={record.invokedByFighterId}</span>}
                {record.invokedByCardId && <span> card={record.invokedByCardId}</span>}
                {record.actionKind && <span> action={record.actionKind}</span>}
                <span style={{ color: "#999" }}> r{record.roundNumber}</span>
                <div style={{ color: "#aaa", paddingLeft: 8 }}>{JSON.stringify(record.data, null, 0).slice(0, 200)}</div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="bg-[rgba(255,252,245,0.72)] border border-[rgba(85,66,40,0.14)] rounded-[14px] p-3.5 grid gap-5">
        <div>
          <p className="m-0 mb-2 uppercase tracking-[0.14em] text-[0.74rem] text-[#8a5630]">Game State</p>
          <h1 className="m-0 font-heading text-[1.1rem] leading-[1.2]">Battlefield</h1>
        </div>
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-2 [&>div]:bg-[rgba(239,231,219,0.76)] [&>div]:border [&>div]:border-[rgba(117,92,64,0.18)] [&>div]:rounded-card [&>div]:py-2 [&>div]:px-2.5 [&_dt]:text-[0.76rem] [&_dt]:uppercase [&_dt]:tracking-[0.08em] [&_dt]:text-[#8e7a66] [&_dd]:mt-1.5 [&_dd]:ml-0 [&_dd]:text-base [&_dd]:font-bold">
          <div>
            <dt>State</dt>
            <dd>{game.state.kind}</dd>
          </div>
          <div>
            <dt>Active Player</dt>
            <dd>{activePlayer?.name ?? "none"}</dd>
          </div>
          <div>
            <dt>Turn Step</dt>
            <dd>{game.turnStep ?? "n/a"}</dd>
          </div>
          <div>
            <dt>Phase</dt>
            <dd>{game.phase}</dd>
          </div>
          <div>
            <dt>Board Side</dt>
            <dd>{game.board.side}</dd>
          </div>
          <div>
            <dt>Hexes</dt>
            <dd>{game.board.hexes.length}</dd>
          </div>
          <div>
            <dt>Feature Tokens</dt>
            <dd>{game.board.featureTokens.length}</dd>
          </div>
          <div>
            <dt>Round</dt>
            <dd>{game.roundNumber}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
