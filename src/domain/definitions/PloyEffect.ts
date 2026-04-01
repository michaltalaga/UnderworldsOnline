import { FighterTokenKind, PloyEffectKind, PloyEffectTargetKind } from "../values/enums";

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
    kind: typeof PloyEffectKind.GainFighterToken;
    target: PloyEffectTargetKind;
    token: FighterTokenKind;
  };
