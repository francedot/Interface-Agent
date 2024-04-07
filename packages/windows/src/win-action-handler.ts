import { NLAction, OSAgentCore } from "@osagent/core";
import { sPrompt_Generate_Code_Selectors_Windows } from "./prompts/generate-code-selector";
import { performActionTap, performActionType } from "./utils";
import { WindowsOSAgentPage } from "./types";

export class WindowsActionHandler {
    private readonly osAgent: OSAgentCore;
    private readonly runCodeSelectorMaxRetries = 3;

    constructor(osAgent: OSAgentCore) {
        this.osAgent = osAgent;
    }

    public async performAction(nextAction: NLAction, currentPage: WindowsOSAgentPage): Promise<void> {

        const codeSelectorsResult = await this.osAgent.generateCodeSelectorsWithRetry_Agent({
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
                        throw new Error(`Action type ${nextAction.actionType} is not supported`);
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