import type { GameAction, GameState } from "../engine/types";
import { cardsInZone } from "../engine/state";
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

  const myObjectiveDeck = cardsInZone(state, "red", "objective-deck");
  const myObjectiveHand = cardsInZone(state, "red", "objective-hand");
  const myObjectiveDiscard = cardsInZone(state, "red", "objective-discard");
  const myObjectiveTemp = cardsInZone(state, "red", "objective-temp-discard");

  const myPowerDeck = cardsInZone(state, "red", "power-deck");
  const myPowerHand = cardsInZone(state, "red", "power-hand");
  const myPowerDiscard = cardsInZone(state, "red", "power-discard");
  const myPowerTemp = cardsInZone(state, "red", "power-temp-discard");

  const enemyObjectiveDeck = cardsInZone(state, "blue", "objective-deck");
  const enemyObjectiveHand = cardsInZone(state, "blue", "objective-hand");
  const enemyObjectiveDiscard = cardsInZone(state, "blue", "objective-discard");
  const enemyObjectiveTemp = cardsInZone(state, "blue", "objective-temp-discard");

  const enemyPowerDeck = cardsInZone(state, "blue", "power-deck");
  const enemyPowerHand = cardsInZone(state, "blue", "power-hand");
  const enemyPowerDiscard = cardsInZone(state, "blue", "power-discard");
  const enemyPowerTemp = cardsInZone(state, "blue", "power-temp-discard");

  const mulliganPending = myObjectiveTemp.length > 0 || myPowerTemp.length > 0;
  const canMulligan = state.round === 1 && state.turnInRound === 1 && !myTeam.mulliganUsed && !state.winner;
  const renderCards = (cards: typeof myObjectiveHand, emptyLabel: string) => {
    if (cards.length === 0) {
      return <p className="muted">{emptyLabel}</p>;
    }

    return (
      <div className="card-fan compact side-hand">
        {cards.map((card) => (
          <CardTile key={`${card.owner}-${card.name}-${card.zone}`} state={state} card={card} compact />
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
