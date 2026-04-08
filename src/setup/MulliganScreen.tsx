import {
  CardKind,
  ResolveMulliganAction,
  type CardInstance,
  type PlayerState,
} from "../domain";

type MulliganScreenProps = {
  player: PlayerState;
  onResolve: (action: ResolveMulliganAction) => void;
};

export default function MulliganScreen({ player, onResolve }: MulliganScreenProps) {
  const objectiveCards = player.objectiveHand;
  const powerCards = player.powerHand;

  const handleResolve = (redrawObjectives: boolean, redrawPower: boolean): void => {
    onResolve(new ResolveMulliganAction(player.id, redrawObjectives, redrawPower));
  };

  return (
    <main className="setup-shell">
      <header className="setup-hero">
        <span className="setup-active-player">Mulligan</span>
        <h1>{player.name}: keep or redraw?</h1>
        <p>Set any of your starting hands aside and draw replacements. You only get one mulligan.</p>
      </header>
      <section className="setup-mulligan-grid">
        <article className="setup-panel">
          <h2>Objective hand</h2>
          <p className="setup-panel-meta">{objectiveCards.length} cards</p>
          <ul className="setup-card-list">
            {objectiveCards.map((card) => (
              <li key={card.id}>
                <span className="setup-card-name">{getCardName(player, card)}</span>
                <span className="setup-card-meta">{getCardGlory(player, card)} glory</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="setup-panel">
          <h2>Power hand</h2>
          <p className="setup-panel-meta">{powerCards.length} cards</p>
          <ul className="setup-card-list">
            {powerCards.map((card) => (
              <li key={card.id}>
                <span className="setup-card-name">{getCardName(player, card)}</span>
                <span className="setup-card-meta">{getCardKindLabel(player, card)}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
      <div className="setup-button-row">
        <button
          type="button"
          className="setup-button setup-button-primary"
          onClick={() => handleResolve(false, false)}
        >
          Keep both
        </button>
        <button
          type="button"
          className="setup-button"
          onClick={() => handleResolve(true, false)}
        >
          Mulligan objectives
        </button>
        <button
          type="button"
          className="setup-button"
          onClick={() => handleResolve(false, true)}
        >
          Mulligan power
        </button>
        <button
          type="button"
          className="setup-button"
          onClick={() => handleResolve(true, true)}
        >
          Mulligan both
        </button>
      </div>
    </main>
  );
}

function getCardName(player: PlayerState, card: CardInstance): string {
  return player.getCardDefinition(card.id)?.name ?? card.definitionId;
}

function getCardGlory(player: PlayerState, card: CardInstance): number {
  return player.getCardDefinition(card.id)?.gloryValue ?? 0;
}

function getCardKindLabel(player: PlayerState, card: CardInstance): string {
  const definition = player.getCardDefinition(card.id);
  if (definition === undefined) {
    return "";
  }
  if (definition.kind === CardKind.Ploy) {
    return "Ploy";
  }
  if (definition.kind === CardKind.Upgrade) {
    return "Upgrade";
  }
  return "Power";
}
