import type { GameAction, GameState } from "../engine/types";
import { cardIdsInZone } from "../engine/state";
import { CardTile } from "./CardTile";

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

  const myObjectiveDeck = cardIdsInZone(state, "red", "objective-deck");
  const myObjectiveHand = cardIdsInZone(state, "red", "objective-hand");
  const myObjectiveDiscard = cardIdsInZone(state, "red", "objective-discard");
  const myObjectiveTemp = cardIdsInZone(state, "red", "objective-temp-discard");

  const myPowerDeck = cardIdsInZone(state, "red", "power-deck");
  const myPowerHand = cardIdsInZone(state, "red", "power-hand");
  const myPowerDiscard = cardIdsInZone(state, "red", "power-discard");
  const myPowerTemp = cardIdsInZone(state, "red", "power-temp-discard");

  const enemyObjectiveDeck = cardIdsInZone(state, "blue", "objective-deck");
  const enemyObjectiveHand = cardIdsInZone(state, "blue", "objective-hand");
  const enemyObjectiveDiscard = cardIdsInZone(state, "blue", "objective-discard");
  const enemyObjectiveTemp = cardIdsInZone(state, "blue", "objective-temp-discard");

  const enemyPowerDeck = cardIdsInZone(state, "blue", "power-deck");
  const enemyPowerHand = cardIdsInZone(state, "blue", "power-hand");
  const enemyPowerDiscard = cardIdsInZone(state, "blue", "power-discard");
  const enemyPowerTemp = cardIdsInZone(state, "blue", "power-temp-discard");

  const mulliganPending = myObjectiveTemp.length > 0 || myPowerTemp.length > 0;
  const canMulligan = state.round === 1 && state.turnInRound === 1 && !myTeam.mulliganUsed && !state.winner;
  const renderCards = (cardIds: string[], emptyLabel: string) => {
    if (cardIds.length === 0) {
      return <p className="muted">{emptyLabel}</p>;
    }

    return (
      <div className="card-fan compact side-hand">
        {cardIds.map((cardId) => (
          <CardTile key={cardId} state={state} cardId={cardId} compact />
        ))}
      </div>
    );
  };

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
        {renderCards(myObjectiveHand, "No objectives in hand")}
      </div>
      <div className="section">
        <h4>Power Cards</h4>
        {renderCards(myPowerHand, "No power cards in hand")}
      </div>

      {mulliganPending && (
        <div className="section">
          <h4>Temp Discard (During Mulligan)</h4>
          {renderCards([...myObjectiveTemp, ...myPowerTemp], "No cards in temp discard")}
        </div>
      )}
    </div>
  );
}
