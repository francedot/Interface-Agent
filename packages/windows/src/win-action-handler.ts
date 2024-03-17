import { NLAction, NavAIGuide } from "@navaiguide/core";
import { sPrompt_Generate_Code_Selectors_Windows } from "./prompts/generate-code-selector";
import { performActionTap, performActionType } from "./utils";
import { WindowsNavAIGuidePage } from "./types";

export class WindowsActionHandler {
    private readonly navAIGuide: NavAIGuide;
    private readonly runCodeSelectorMaxRetries = 3;

    constructor(navAIGuide: NavAIGuide) {
        this.navAIGuide = navAIGuide;
    }

    public async performAction(nextAction: NLAction, currentPage: WindowsNavAIGuidePage): Promise<void> {

        const codeSelectorsResult = await this.navAIGuide.generateCodeSelectorsWithRetry_Agent({
            prompt: sPrompt_Generate_Code_Selectors_Windows,
            inputPage: currentPage,
            nextAction: nextAction,
            maxRetries: 3,
            codeEvalFunc: async (codeSelector) => {
                switch (nextAction.actionType) {
                    case 'tap':
                        return await performActionTap(currentPage.winHandle, codeSelector);
                    case 'type':
                        return await performActionType(currentPage.winHandle, codeSelector, nextAction.actionInput);
                    case 'scroll':
                        throw new Error(`Action type ${nextAction.actionType} is not supported`);
                    default:
                        throw new Error(`Action type ${nextAction.actionType} is not supported`);
                }
            },
          });
  
          if (!codeSelectorsResult.success) {
            console.log(`The code action was unsuccessful after ${this.runCodeSelectorMaxRetries} retries.`);
          }
          console.log(`The code action was successful.`);
    }
}