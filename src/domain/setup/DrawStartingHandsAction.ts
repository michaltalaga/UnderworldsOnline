import { SetupActionKind } from "../values/enums";
import { SetupAction } from "./SetupAction";

export class DrawStartingHandsAction extends SetupAction {
  public constructor() {
    super(SetupActionKind.DrawStartingHands);
  }
}
