import type { PlayerState } from "./domain";
import DeckPileWidget from "./DeckPileWidget";
import PlayerHandDock, { type DockInteraction } from "./PlayerHandDock";

// The fixed bar at the bottom of the screen that hosts the hand dock in
// the center and the deck/discard pile widgets on the sides. This wrapper
// owns the fixed positioning so the dock itself can stay a flex child.
//
// Callers (`SetupApp`, `PracticeBattlefieldApp`) mount this instead of
// `PlayerHandDock` directly.
type PlayerHandDockShellProps = {
  player: PlayerState;
  interaction: DockInteraction;
};

export default function PlayerHandDockShell({
  player,
  interaction,
}: PlayerHandDockShellProps) {
  return (
    <div className="player-hand-dock-shell">
      <DeckPileWidget
        label="Objective"
        drawCount={player.objectiveDeck.drawPile.length}
        discardCount={player.objectiveDeck.discardPile.length}
        tone="objective"
      />
      <PlayerHandDock player={player} interaction={interaction} />
      <DeckPileWidget
        label="Power"
        drawCount={player.powerDeck.drawPile.length}
        discardCount={player.powerDeck.discardPile.length}
        tone="power"
      />
    </div>
  );
}
