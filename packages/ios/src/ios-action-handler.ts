import { ActionType, BoundingBox, NLAction, NavAIGuide, NavAIGuidePage, calculateBoundingBoxCenter, transformBoundingBox } from "@navaiguide/core";
import { sendWdaCommand } from "./utils";
import { sPrompt_Generate_Code_Selectors_iOS } from "./prompts/generate-code-selector";

export class iOSActionHandler {
    private readonly wdioClient: WebdriverIO.Browser;
    private readonly navAIGuide: NavAIGuide;
    private readonly runCodeSelectorMaxRetries = 3;

    constructor(wdioClient: WebdriverIO.Browser, navAIGuide: NavAIGuide) {
        this.navAIGuide = navAIGuide;
        this.wdioClient = wdioClient;
    }

    public async performAction(nextAction: NLAction, currentPage: NavAIGuidePage): Promise<void> {
        // TODO context as multi-type
        switch (nextAction.actionType) {
            case 'tap':
                const codeSelectorsResult = await this.navAIGuide.generateCodeSelectorsWithRetry({
                    prompt: sPrompt_Generate_Code_Selectors_iOS,
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
                  console.log(`The code action was successful.`);                break;
            case 'type':
                await this.performActionTypeOnKeyboard(nextAction.actionInput);
                break;
            case 'scroll':
                await this.performActionScroll(nextAction.actionScrollDirection);
                break;
            default:
                throw new Error(`Action type ${nextAction.actionType} is not supported`);
        }
    }

    public async performActionTap(selector: string): Promise<boolean> {
        const element = await this.wdioClient.$(selector);
        if (element.error) {
            console.error(`Element not found: ${selector}`);
            return false;
        }

        try {
            await element.click();
        } catch (error) {
            console.error(`Error tapping element: ${selector}`);
            return false;
        }

        return true;
    }

    public async performActionScroll(scrollDirection: string): Promise<boolean> {
        try {
            await this.wdioClient.execute("mobile:swipe", {direction: scrollDirection == "up" ? "down" : "up"}); // Inverse scroll direction
        } catch (error) {
            console.error(`Error scrolling: ${scrollDirection}`);
            return false;
        }
       
        return true;
    }

    public async performActionTypeOnKeyboard(inputString: string): Promise<void> {
        // Check if 'A' and ',' keys are available
        let isShifted = await this.isKeyAvailable('A');
        let isMore = await this.isKeyAvailable(',');

        // Generate the selector for the 'more' key
        const moreSelector = this.generateKeySelector('more');

        // Iterate over each character in the input string
        for (const char of inputString) {
            // Check if the character is a special character or a number
            const isSpecialOrNumber = this.isKeyboardMoreCharacter(char);

            // If the character type (special/number or not) doesn't match the current keyboard state (isMore), switch the keyboard state
            if (isSpecialOrNumber !== isMore) {
                await this.performActionTap(moreSelector)
            }

            // If the character is uppercase and the shift key isn't activated, or vice versa, tap the shift key
            if (this.isUpperCase(char) !== isShifted) {
                await this.tapShiftKey();
            }

            // Generate the selector for the current character and try to tap it
            const selector = this.generateKeySelector(char);
            if (!await this.performActionTap(selector)) {
                // If the tap action fails, log an error and break the loop
                console.error(`Failed to tap key: ${char}`);
            }

            isMore = false;
            isShifted = false;
        }

        // Search if available
        if (await this.isKeyAvailable('search')) {
            await this.performActionTap(this.generateKeySelector('search'));
        }

        // Done if available
        if (await this.isKeyAvailable('done')) {
            await this.performActionTap(this.generateKeySelector('done'));
        }
    }

    private async isKeyAvailable(key: string): Promise<boolean> {
        const selector = this.generateKeySelector(key); // Assume it's shifted (uppercase)
        const element = await this.wdioClient.$(selector);
        return !element.error;
    }

    private isUpperCase(char: string): boolean {
        return char === char.toUpperCase() && char !== char.toLowerCase();
    }

    private isKeyboardMoreCharacter(char: string): boolean {
        if (char === ' ') {
            return false;
        }

        if (!isNaN(Number(char))) {
            return true;
        }

        return ['.', '/', ':', ';', '(', ')', '$', '&', '@', "\"", '.', ',', '?', '!', "'"].includes(char);
    }

    private async tapShiftKey(): Promise<void> {
        const shiftSelector = `//XCUIElementTypeButton[@name='shift']`;
        await this.performActionTap(shiftSelector);
    }

    private generateKeySelector(key: string): string {
        // Handle shift key as a special case
        if (key.toLowerCase() === 'shift') {
            return `//XCUIElementTypeButton[@name='shift']`;
        }

        if (key.toLowerCase() === 'search') {
            return `//XCUIElementTypeButton[@name='Search']`;
        }

        if (key.toLowerCase() === 'done') {
            return `//XCUIElementTypeButton[@name='Done']`;
        }

        if (key === ' ') {
            return `//XCUIElementTypeKey[@name='space']`;
        }

        if (key === "'") {
            return `//XCUIElementTypeKey[@name="'"]`; // Use double quotes to wrap the attribute value when the key is a single quote
        }

        return `//XCUIElementTypeKey[@name='${key}']`;
    }

    public async performActionTapWithCoordinates(page: NavAIGuidePage, boundingBox: BoundingBox): Promise<void> {
        const size = await this.wdioClient.getWindowSize();
        const transformedBoundingBox = transformBoundingBox(page.screens[0].screenSize, boundingBox, size);
        const { centerX, centerY } = calculateBoundingBoxCenter(transformedBoundingBox);
        await this.performActionTap_Internal(centerX, centerY);
    }

    public async performActionType(text: string): Promise<void> {
        await this.wdioClient.keys(text);
    }

    private performActionTap_Internal(x: number, y: number): Promise<any> {
        const command = {
            "actions": [
                {
                    "type": "pointer",
                    "id": "finger1",
                    "parameters": { "pointerType": "touch" },
                    "actions": [
                        { "type": "pointerMove", "duration": 0, x, y, "button": 0 },
                        { "type": "pointerDown", "duration": 0, "button": 0 },
                        { "type": "pause", "duration": 50, "button": 0 },
                        { "type": "pointerUp", "duration": 0, "button": 0 }
                    ]
                }
            ]
        };

        return sendWdaCommand(this.wdioClient.sessionId, command);
    }
}