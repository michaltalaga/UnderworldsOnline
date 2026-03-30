import { SetupActionKind } from "../values/enums";
import { SetupAction } from "./SetupAction";

export class CompleteMusterAction extends SetupAction {
  public constructor() {
    super(SetupActionKind.CompleteMuster);
  }
}
