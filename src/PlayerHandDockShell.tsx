import type { CardId, Player } from "./domain";
import DeckPileWidget from "./DeckPileWidget";
import PlayerHandDock, { type DockInteraction, type ScorableObjective } from "./PlayerHandDock";

// The fixed bar at the bottom of the screen that hosts the hand dock in
// the center and the deck/discard pile widgets on the sides. This wrapper
// owns the fixed positioning so the dock itself can stay a flex child.
//
// Callers (`SetupApp`, `PracticeBattlefieldApp`) mount this instead of
// `PlayerHandDock` directly.
type PlayerHandDockShellProps = {
  player: Player;
  interaction: DockInteraction;
  scorableObjectives?: ScorableObjective[];
  onScoreObjective?: (cardId: CardId) => void;
};

export default function PlayerHandDockShell({
  player,
  interaction,
  scorableObjectives,
  onScoreObjective,
}: PlayerHandDockShellProps) {
  return (
    <div className="player-hand-dock-shell shrink-0 grow-0 basis-[28vh] h-[28vh] max-h-[28vh] min-h-[28vh] grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3.5 px-5 pt-3.5 pb-[18px] bg-[rgba(253,249,242,0.96)] border-t border-border shadow-[0_-14px_32px_rgba(63,46,29,0.18)] backdrop-blur-[12px] font-body text-ink min-h-0 overflow-hidden items-stretch box-border max-sm:grid-cols-1">
      <DeckPileWidget
        label="Objective"
        drawCount={player.objectiveDeck.drawPile.length}
        discardCount={player.objectiveDeck.discardPile.length}
        tone="objective"
      />
      <PlayerHandDock
        player={player}
        interaction={interaction}
        scorableObjectives={scorableObjectives}
        onScoreObjective={onScoreObjective}
      />
      <DeckPileWidget
        label="Power"
        drawCount={player.powerDeck.drawPile.length}
        discardCount={player.powerDeck.discardPile.length}
        tone="power"
      />
    </div>
  );
}
