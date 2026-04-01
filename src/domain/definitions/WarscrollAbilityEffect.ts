import { WarscrollAbilityEffectKind } from "../values/enums";

export type WarscrollAbilityEffect =
  | {
    kind: typeof WarscrollAbilityEffectKind.DrawPowerCards;
    count: number;
  }
  | {
    kind: typeof WarscrollAbilityEffectKind.GainWarscrollTokens;
    tokens: Readonly<Record<string, number>>;
  };
