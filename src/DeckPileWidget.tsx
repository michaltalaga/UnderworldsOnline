// A tiny presentational widget that renders a draw pile + discard pile
// stack for one deck kind (objective or power). Used by
// `PlayerHandDockShell` to flank the hand dock with the player's card
// zones. Purely visual — no interactivity in v1.

type DeckPileWidgetProps = {
  label: string;
  drawCount: number;
  discardCount: number;
  tone: "objective" | "power";
};

export default function DeckPileWidget({
  label,
  drawCount,
  discardCount,
  tone,
}: DeckPileWidgetProps) {
  return (
    <aside className={`deck-pile-widget deck-pile-widget-${tone}`}>
      <p className="deck-pile-widget-label">{label}</p>
      <div className="deck-pile-widget-stacks">
        <DeckPileStack kind="draw" label="Deck" count={drawCount} />
        <DeckPileStack kind="discard" label="Discard" count={discardCount} />
      </div>
    </aside>
  );
}

function DeckPileStack({
  kind,
  label,
  count,
}: {
  kind: "draw" | "discard";
  label: string;
  count: number;
}) {
  return (
    <div className={`deck-pile-stack deck-pile-stack-${kind}`}>
      <span className="deck-pile-stack-count">{count}</span>
      <span className="deck-pile-stack-label">{label}</span>
    </div>
  );
}
