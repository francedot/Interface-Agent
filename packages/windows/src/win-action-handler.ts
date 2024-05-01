import { NLAction, InterfaceAgentCore } from "@interface-agent/core";
import { sPrompt_Generate_Code_Selectors_Windows } from "./prompts/generate-code-selector";
import { performActionScroll, performActionTap, performActionType } from "./utils";
import { WindowsInterfaceAgentPage } from "./types";

export class WindowsActionHandler {
    private readonly InterfaceAgent: InterfaceAgentCore;
    private readonly runCodeSelectorMaxRetries = 3;

    constructor(InterfaceAgent: InterfaceAgentCore) {
        this.InterfaceAgent = InterfaceAgent;
    }

    public async performAction(nextAction: NLAction, currentPage: WindowsInterfaceAgentPage): Promise<void> {

        const codeSelectorsResult = await this.InterfaceAgent.generateCodeSelectorsWithRetry_Agent({
            prompt: sPrompt_Generate_Code_Selectors_Windows,
            inputPage: currentPage,
            nextAction: nextAction,
            maxRetries: 3,
            codeEvalFunc: async (codeSelector) => {
                switch (nextAction.actionType) {
                    case 'tap':
                        await performActionTap(currentPage.winHandle, codeSelector);
                        break;
                    case 'type':
                        await performActionType(currentPage.winHandle, codeSelector, nextAction.actionInput, nextAction.actionInputEditMode);
                        break;
                    case 'scroll':
                        await performActionScroll(currentPage.winHandle, codeSelector, nextAction.actionScrollDirection);
                        break;
                    case 'nop':
                    // Do nothing
                    break;
                    default:
                        throw new Error(`Action type ${nextAction.actionType} is not supported`);
                }

                return true;
            },
          });
  
          if (!codeSelectorsResult.success) {
            console.log(`The code action was unsuccessful after ${this.runCodeSelectorMaxRetries} retries.`);
            return;
          }

          console.log(`The code action was successful.`);
    }
}