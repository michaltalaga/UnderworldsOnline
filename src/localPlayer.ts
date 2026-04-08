import type { Game, PlayerState } from "./domain";

// The UI currently treats player:one as the viewer; the opponent is either
// auto-resolved during setup or will eventually be driven by AI / network.
// Any code that needs to render or react to "the human's side" should go
// through this helper so the concept lives in exactly one place.
export const LOCAL_PLAYER_ID = "player:one";

export function getLocalPlayer(game: Game): PlayerState | null {
  return (
    game.players.find((player) => player.id === LOCAL_PLAYER_ID) ??
    game.players[0] ??
    null
  );
}
