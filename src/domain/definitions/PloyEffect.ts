import { PloyEffectKind, PloyEffectTargetKind } from "../values/enums";

export type PloyEffect =
  | {
    kind: typeof PloyEffectKind.DrawPowerCards;
    count: number;
  }
  | {
    kind: typeof PloyEffectKind.GainWarscrollTokens;
    tokens: Readonly<Record<string, number>>;
  }
  | {
    kind: typeof PloyEffectKind.GainGuardToken;
    target: typeof PloyEffectTargetKind.FriendlyFighter;
  }
  | {
    kind: typeof PloyEffectKind.GainStaggerToken;
    target: typeof PloyEffectTargetKind.EnemyFighter;
  };
