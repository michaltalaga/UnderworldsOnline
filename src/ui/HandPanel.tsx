import type { GameAction, GameState } from "../engine/types";

type HandPanelProps = {
  state: GameState;
  onDispatch: (action: GameAction) => void;
};

function DeckTrack({
  label,
  deck,
  discard,
  tempDiscard,
  handCount,
}: {
  label: string;
  deck: number;
  discard: number;
  tempDiscard: number;
  handCount: number;
}) {
  return (
    <div className="deck-track">
      <h5>{label}</h5>
      <div className="pile-row">
        <span>Deck: {deck}</span>
        <span>Discard: {discard}</span>
        <span>Temp: {tempDiscard}</span>
        <span>Hand: {handCount}</span>
      </div>
    </div>
  );
}

export function HandPanel({ state, onDispatch }: HandPanelProps) {
  const myTeam = state.teams.red;
  const enemyTeam = state.teams.blue;

  const mulliganPending = myTeam.objectiveTempDiscard.length > 0 || myTeam.powerTempDiscard.length > 0;
  const canMulligan = state.round === 1 && state.turnInRound === 1 && !myTeam.mulliganUsed && !state.winner;

  return (
    <div className="panel hand-panel">
      <h3>Card Zones</h3>

      <div className="section deck-section">
        <h4>You (Red)</h4>
        <DeckTrack
          label="Objectives"
          deck={myTeam.objectiveDeck.length}
          discard={myTeam.objectiveDiscard.length}
          tempDiscard={myTeam.objectiveTempDiscard.length}
          handCount={myTeam.objectiveHand.length}
        />
        <DeckTrack
          label="Power"
          deck={myTeam.powerDeck.length}
          discard={myTeam.discardPower.length}
          tempDiscard={myTeam.powerTempDiscard.length}
          handCount={myTeam.powerHand.length}
        />
      </div>

      <div className="section deck-section">
        <h4>Opponent (Blue)</h4>
        <DeckTrack
          label="Objectives"
          deck={enemyTeam.objectiveDeck.length}
          discard={enemyTeam.objectiveDiscard.length}
          tempDiscard={enemyTeam.objectiveTempDiscard.length}
          handCount={enemyTeam.objectiveHand.length}
        />
        <DeckTrack
          label="Power"
          deck={enemyTeam.powerDeck.length}
          discard={enemyTeam.discardPower.length}
          tempDiscard={enemyTeam.powerTempDiscard.length}
          handCount={enemyTeam.powerHand.length}
        />
      </div>

      <div className="section mulligan-controls">
        <h4>Mulligan</h4>
        {!mulliganPending && (
          <button
            type="button"
            onClick={() => onDispatch({ type: "start-mulligan", actorTeam: "red" })}
            disabled={!canMulligan || state.activeTeam !== "red"}
          >
            Mulligan My Hand
          </button>
        )}
        {mulliganPending && (
          <button
            type="button"
            onClick={() => onDispatch({ type: "resolve-mulligan", actorTeam: "red" })}
            disabled={state.activeTeam !== "red"}
          >
            Finalize Mulligan
          </button>
        )}
      </div>

      <h3>Your Hand (Red)</h3>
      <div className="section">
        <h4>Objectives</h4>
        <ul>
          {myTeam.objectiveHand.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
          {myTeam.objectiveHand.length === 0 && <li className="muted">No objectives in hand</li>}
        </ul>
      </div>
      <div className="section">
        <h4>Power Cards</h4>
        <ul>
          {myTeam.powerHand.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
          {myTeam.powerHand.length === 0 && <li className="muted">No power cards in hand</li>}
        </ul>
      </div>

      {mulliganPending && (
        <div className="section">
          <h4>Temp Discard (During Mulligan)</h4>
          <ul>
            {myTeam.objectiveTempDiscard.map((c) => (
              <li key={c.id}>Objective: {c.name}</li>
            ))}
            {myTeam.powerTempDiscard.map((c) => (
              <li key={c.id}>Power: {c.name}</li>
            ))}
            {myTeam.objectiveTempDiscard.length + myTeam.powerTempDiscard.length === 0 && (
              <li className="muted">No cards in temp discard</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
