import { cardEntityIdsInZone, cardName } from "../engine/state";
import type { GameAction, GameState } from "../engine/types";

type OpeningHandModalProps = {
  state: GameState;
  onDispatch: (action: GameAction) => void;
};

function cardList(state: GameState, cardIds: string[], emptyLabel: string) {
  if (cardIds.length === 0) {
    return <li className="muted">{emptyLabel}</li>;
  }

  return cardIds.map((cardId) => <li key={cardId}>{cardName(state, cardId)}</li>);
}

export function OpeningHandModal({ state, onDispatch }: OpeningHandModalProps) {
  const objectiveHand = cardEntityIdsInZone(state, "red", "objective-hand");
  const powerHand = cardEntityIdsInZone(state, "red", "power-hand");
  const objectiveTemp = cardEntityIdsInZone(state, "red", "objective-temp-discard");
  const powerTemp = cardEntityIdsInZone(state, "red", "power-temp-discard");
  const mulliganPending = objectiveTemp.length > 0 || powerTemp.length > 0;
  const canChooseMulligan =
    state.round === 1 &&
    state.turnInRound === 1 &&
    state.turnStep === "action" &&
    state.activeTeam === "red" &&
    !state.teams.red.mulliganUsed &&
    !state.winner;

  if (!canChooseMulligan && !mulliganPending) {
    return null;
  }

  return (
    <section className="opening-hand-modal panel">
      <div className="opening-copy">
        <p className="eyebrow">Opening Hand</p>
        <h2>Keep your draw or take a mulligan</h2>
        <p className="muted">
          Under the rules, you may redraw your full objective hand, your full power hand, or both. You only get one
          mulligan.
        </p>
      </div>

      <div className="opening-hand-grid">
        <div className="opening-hand-card">
          <div className="opening-hand-head">
            <h3>Objectives</h3>
            <span>{objectiveHand.length} cards</span>
          </div>
          <ul>{cardList(state, objectiveHand, "No objectives in hand")}</ul>
          {!mulliganPending && (
            <button
              type="button"
              className="opening-action-btn"
              onClick={() => onDispatch({ type: "start-mulligan", actorTeam: "red", objective: true, power: false })}
              disabled={!canChooseMulligan}
            >
              Redraw Objectives
            </button>
          )}
        </div>

        <div className="opening-hand-card">
          <div className="opening-hand-head">
            <h3>Power</h3>
            <span>{powerHand.length} cards</span>
          </div>
          <ul>{cardList(state, powerHand, "No power cards in hand")}</ul>
          {!mulliganPending && (
            <button
              type="button"
              className="opening-action-btn"
              onClick={() => onDispatch({ type: "start-mulligan", actorTeam: "red", objective: false, power: true })}
              disabled={!canChooseMulligan}
            >
              Redraw Power
            </button>
          )}
        </div>
      </div>

      {!mulliganPending && (
        <div className="opening-hand-footer">
          <button
            type="button"
            className="opening-action-btn secondary"
            onClick={() => onDispatch({ type: "start-mulligan", actorTeam: "red", objective: true, power: true })}
            disabled={!canChooseMulligan}
          >
            Redraw Both Hands
          </button>
          <button
            type="button"
            className="opening-action-btn ghost"
            onClick={() => onDispatch({ type: "pass", actorTeam: "red" })}
            disabled={!canChooseMulligan}
          >
            Keep This Hand
          </button>
        </div>
      )}

      {mulliganPending && (
        <div className="opening-hand-review">
          <div className="opening-review-card">
            <h3>Set Aside For Mulligan</h3>
            <ul>
              {objectiveTemp.map((cardId) => (
                <li key={cardId}>Objective: {cardName(state, cardId)}</li>
              ))}
              {powerTemp.map((cardId) => (
                <li key={cardId}>Power: {cardName(state, cardId)}</li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="opening-action-btn"
            onClick={() => onDispatch({ type: "resolve-mulligan", actorTeam: "red" })}
            disabled={state.activeTeam !== "red"}
          >
            Shuffle Set-Aside Cards Back In
          </button>
        </div>
      )}
    </section>
  );
}
