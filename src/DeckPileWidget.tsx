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
    <aside className={`grid gap-1.5 px-3 py-2.5 border rounded-button min-w-[130px] content-start max-sm:min-w-0 ${tone === "objective" ? "bg-objective-bg border-objective-border" : "bg-power-card-bg border-power-card-border"}`}>
      <p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.08em] text-[#7a624d]">{label}</p>
      <div className="grid grid-cols-2 gap-1.5">
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
    <div className={`grid gap-0.5 px-1 py-1.5 rounded-[10px] text-center ${kind === "discard" ? "bg-[rgba(235,225,210,0.9)] border border-solid border-[rgba(85,66,40,0.2)]" : "bg-[rgba(255,253,246,0.9)] border border-dashed border-[rgba(85,66,40,0.2)]"}`}>
      <span className="font-heading text-[1.15rem] font-bold text-heading">{count}</span>
      <span className="text-[0.62rem] uppercase tracking-[0.08em] text-[#8a7560]">{label}</span>
    </div>
  );
}
