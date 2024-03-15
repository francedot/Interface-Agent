import { ActionType, BoundingBox, NLAction, NavAIGuide, NavAIGuidePage, transformBoundingBox } from "@navaiguide/core";
import { sPrompt_Generate_Code_Selectors_Windows } from "./prompts/generate-code-selector";

export class WindowsActionHandler {
    private readonly navAIGuide: NavAIGuide;
    private readonly runCodeSelectorMaxRetries = 3;

    constructor(navAIGuide: NavAIGuide) {
        this.navAIGuide = navAIGuide;
    }

    public async performAction(nextAction: NLAction, currentPage: NavAIGuidePage): Promise<void> {
        switch (nextAction.actionType) {
            case 'tap':
                const codeSelectorsResult = await this.navAIGuide.generateCodeSelectorsWithRetry_Agent({
                    prompt: sPrompt_Generate_Code_Selectors_Windows,
                    inputPage: currentPage,
                    nextAction: nextAction,
                    maxRetries: 3,
                    codeEvalFunc: async (codeSelector) => {
                      return await this.performActionTap(codeSelector);
                    },
                  });
          
                  if (!codeSelectorsResult.success) {
                    console.log(`The code action was unsuccessful after ${this.runCodeSelectorMaxRetries} retries.`);
                  }
                  console.log(`The code action was successful.`);
                  break;
            case 'type':
                await this.performActionType(nextAction.actionInput);
                break;
            case 'scroll':
                await this.performActionScroll(nextAction.actionScrollDirection);
                break;
            default:
                throw new Error(`Action type ${nextAction.actionType} is not supported`);
        }
    }

    public async performActionTap(selector: string): Promise<boolean> {
        // const element = await this.wdioClient.$(selector);
        // if (element.error) {
        //     console.error(`Element not found: ${selector}`);
        //     return false;
        // }

        // try {
        //     await element.click();
        // } catch (error) {
        //     console.error(`Error tapping element: ${selector}`);
        //     return false;
        // }

        return true;
    }

    public async performActionScroll(scrollDirection: string): Promise<boolean> {
        // try {
        //     await this.wdioClient.execute("mobile:swipe", {direction: scrollDirection == "up" ? "down" : "up"}); // Inverse scroll direction
        // } catch (error) {
        //     console.error(`Error scrolling: ${scrollDirection}`);
        //     return false;
        // }
       
        return true;
    }

    public async performActionType(inputString: string): Promise<boolean> {
        return true
    }


    public async performActionTapWithCoordinates(page: NavAIGuidePage, boundingBox: BoundingBox): Promise<void> {
        // const size = await this.wdioClient.getWindowSize();
        // const transformedBoundingBox = transformBoundingBox(page.screens[0].screenSize, boundingBox, size);
        // const { centerX, centerY } = calculateBoundingBoxCenter(transformedBoundingBox);
        // await this.performActionTap_Internal(centerX, centerY);
    }
}