import { PloyEffectKind } from "../values/enums";

export type PloyEffect =
  | {
    kind: typeof PloyEffectKind.DrawPowerCards;
    count: number;
  }
  | {
    kind: typeof PloyEffectKind.GainWarscrollTokens;
    tokens: Readonly<Record<string, number>>;
  };
