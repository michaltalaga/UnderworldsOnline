import { TurnStep } from "../values/enums";

export class WarscrollAbilityDefinition {
  public readonly name: string;
  public readonly text: string;
  public readonly timing: TurnStep;
  public readonly tokenCosts: Readonly<Record<string, number>>;
  public readonly drawPowerCards: number;

  public constructor(
    name: string,
    text: string,
    timing: TurnStep,
    tokenCosts: Readonly<Record<string, number>> = {},
    drawPowerCards: number = 0,
  ) {
    this.name = name;
    this.text = text;
    this.timing = timing;
    this.tokenCosts = tokenCosts;
    this.drawPowerCards = drawPowerCards;
  }
}
