import type { GameAction, GameState } from "../engine/types";
import { cardEntityIdsInZone, cardName } from "../engine/state";

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

  const myObjectiveDeck = cardEntityIdsInZone(state, "red", "objective-deck");
  const myObjectiveHand = cardEntityIdsInZone(state, "red", "objective-hand");
  const myObjectiveDiscard = cardEntityIdsInZone(state, "red", "objective-discard");
  const myObjectiveTemp = cardEntityIdsInZone(state, "red", "objective-temp-discard");

  const myPowerDeck = cardEntityIdsInZone(state, "red", "power-deck");
  const myPowerHand = cardEntityIdsInZone(state, "red", "power-hand");
  const myPowerDiscard = cardEntityIdsInZone(state, "red", "power-discard");
  const myPowerTemp = cardEntityIdsInZone(state, "red", "power-temp-discard");

  const enemyObjectiveDeck = cardEntityIdsInZone(state, "blue", "objective-deck");
  const enemyObjectiveHand = cardEntityIdsInZone(state, "blue", "objective-hand");
  const enemyObjectiveDiscard = cardEntityIdsInZone(state, "blue", "objective-discard");
  const enemyObjectiveTemp = cardEntityIdsInZone(state, "blue", "objective-temp-discard");

  const enemyPowerDeck = cardEntityIdsInZone(state, "blue", "power-deck");
  const enemyPowerHand = cardEntityIdsInZone(state, "blue", "power-hand");
  const enemyPowerDiscard = cardEntityIdsInZone(state, "blue", "power-discard");
  const enemyPowerTemp = cardEntityIdsInZone(state, "blue", "power-temp-discard");

  const mulliganPending = myObjectiveTemp.length > 0 || myPowerTemp.length > 0;
  const canMulligan = state.round === 1 && state.turnInRound === 1 && !myTeam.mulliganUsed && !state.winner;

  return (
    <div className="panel hand-panel">
      <h3>Card Zones</h3>

      <div className="section deck-section">
        <h4>You (Red)</h4>
        <DeckTrack
          label="Objectives"
          deck={myObjectiveDeck.length}
          discard={myObjectiveDiscard.length}
          tempDiscard={myObjectiveTemp.length}
          handCount={myObjectiveHand.length}
        />
        <DeckTrack
          label="Power"
          deck={myPowerDeck.length}
          discard={myPowerDiscard.length}
          tempDiscard={myPowerTemp.length}
          handCount={myPowerHand.length}
        />
      </div>

      <div className="section deck-section">
        <h4>Opponent (Blue)</h4>
        <DeckTrack
          label="Objectives"
          deck={enemyObjectiveDeck.length}
          discard={enemyObjectiveDiscard.length}
          tempDiscard={enemyObjectiveTemp.length}
          handCount={enemyObjectiveHand.length}
        />
        <DeckTrack
          label="Power"
          deck={enemyPowerDeck.length}
          discard={enemyPowerDiscard.length}
          tempDiscard={enemyPowerTemp.length}
          handCount={enemyPowerHand.length}
        />
      </div>

      <div className="section mulligan-controls">
        <h4>Mulligan</h4>
        {!mulliganPending && <p className="muted">Choose your opening redraw from the board overlay.</p>}
        {mulliganPending && (
          <button
            type="button"
            onClick={() => onDispatch({ type: "resolve-mulligan", actorTeam: "red" })}
            disabled={state.activeTeam !== "red"}
          >
            Finalize Mulligan
          </button>
        )}
        {!mulliganPending && !canMulligan && <p className="muted">Opening mulligan already used or no longer available.</p>}
      </div>

      <h3>Your Hand (Red)</h3>
      <div className="section">
        <h4>Objectives</h4>
        <ul>
          {myObjectiveHand.map((cardId) => (
            <li key={cardId}>{cardName(state, cardId)}</li>
          ))}
          {myObjectiveHand.length === 0 && <li className="muted">No objectives in hand</li>}
        </ul>
      </div>
      <div className="section">
        <h4>Power Cards</h4>
        <ul>
          {myPowerHand.map((cardId) => (
            <li key={cardId}>{cardName(state, cardId)}</li>
          ))}
          {myPowerHand.length === 0 && <li className="muted">No power cards in hand</li>}
        </ul>
      </div>

      {mulliganPending && (
        <div className="section">
          <h4>Temp Discard (During Mulligan)</h4>
          <ul>
            {myObjectiveTemp.map((cardId) => (
              <li key={cardId}>Objective: {cardName(state, cardId)}</li>
            ))}
            {myPowerTemp.map((cardId) => (
              <li key={cardId}>Power: {cardName(state, cardId)}</li>
            ))}
            {myObjectiveTemp.length + myPowerTemp.length === 0 && (
              <li className="muted">No cards in temp discard</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
