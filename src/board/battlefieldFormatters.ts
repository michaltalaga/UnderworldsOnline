import {
  FeatureTokenSide,
  HexKind,
  type FeatureToken,
  type Fighter,
  type Game,
  type HexCell,
} from "../domain";
import { LOCAL_PLAYER_ID } from "../localPlayer";

// Pure formatters and label helpers used by the battlefield view. Kept
// isolated from the main component so they can be unit-tested, reused, and
// so that `PracticeBattlefieldApp.tsx` stays focused on orchestration.

export function formatWeaponAccuracy(accuracy: string): string {
  return accuracy.charAt(0).toUpperCase() + accuracy.slice(1);
}

export function formatTerritoryLabel(_game: Game, hex: HexCell): string {
  return hex.territory?.name ?? "neutral";
}

export function formatHexKind(kind: HexKind): string {
  return kind === HexKind.Empty ? "open" : kind;
}

export function compactHexId(hexId: string): string {
  return hexId.replace("hex:", "");
}

export function formatFeatureTokenSide(side: FeatureTokenSide): string {
  return side === FeatureTokenSide.Hidden ? "hidden" : side;
}

export function getFeatureTokenBadge(featureToken: FeatureToken): string {
  const prefix =
    featureToken.side === FeatureTokenSide.Hidden
      ? "H"
      : featureToken.side === FeatureTokenSide.Treasure
        ? "T"
        : "C";

  return `${prefix}${featureToken.value}`;
}

export function getPlayerToneClass(playerId: string): string {
  return playerId === LOCAL_PLAYER_ID
    ? "bg-linear-to-b from-player-one to-player-one-dark"
    : "bg-linear-to-b from-player-two to-player-two-dark";
}

export function getFighterName(game: Game, fighterId: string): string {
  const fighter = game.getFighter(fighterId);
  if (fighter === undefined) {
    return fighterId;
  }

  const player = fighter.owner;
  return player?.getFighterDefinition(fighter.id)?.name ?? fighter.id;
}

export function getFighterMapLabel(_game: Game, fighter: Fighter): string {
  const player = fighter.owner;
  const fighterName = player?.getFighterDefinition(fighter.id)?.name ?? fighter.id;
  const numericSuffix = fighterName.match(/(\d+)$/);
  if (numericSuffix !== null) {
    return `F${numericSuffix[1]}`;
  }

  return fighterName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getFighterStatusTags(fighter: Fighter): string[] {
  const tags: string[] = [];

  if (fighter.hasMoveToken) {
    tags.push("move");
  }

  if (fighter.hasChargeToken) {
    tags.push("charge");
  }

  if (fighter.hasGuardToken) {
    tags.push("guard");
  }

  if (fighter.hasStaggerToken) {
    tags.push("stagger");
  }

  if (fighter.upgrades.length > 0) {
    tags.push(`upgrades ${fighter.upgrades.length}`);
  }

  if (fighter.isInspired) {
    tags.push("inspired");
  }

  if (fighter.isSlain) {
    tags.push("slain");
  }

  return tags;
}

export function buildHexTitle(
  game: Game,
  hex: HexCell,
  fighter: Fighter | null,
  featureToken: FeatureToken | null,
): string {
  const parts = [hex.id, formatTerritoryLabel(game, hex)];

  if (hex.isStartingHex) {
    parts.push("starting hex");
  }

  if (hex.isEdgeHex) {
    parts.push("edge hex");
  }

  if (hex.kind !== HexKind.Empty) {
    parts.push(hex.kind);
  }

  if (featureToken !== null) {
    parts.push(`${featureToken.id} ${featureToken.side}`);
  }

  if (fighter !== null) {
    parts.push(getFighterName(game, fighter.id));
  }

  return parts.join(" | ");
}
