import { BoundingBox, NLAction, NavAIGuide, NavAIGuidePage } from "@navaiguide/core";
export declare class iOSActionHandler {
    private readonly wdioClient;
    private readonly navAIGuide;
    private readonly runCodeSelectorMaxRetries;
    constructor(wdioClient: WebdriverIO.Browser, navAIGuide: NavAIGuide);
    performAction(nextAction: NLAction, currentPage: NavAIGuidePage): Promise<void>;
    performActionTap(selector: string): Promise<boolean>;
    performActionScroll(scrollDirection: string): Promise<boolean>;
    performActionTypeOnKeyboard(inputString: string): Promise<void>;
    private isKeyAvailable;
    private isUpperCase;
    private isKeyboardMoreCharacter;
    private tapShiftKey;
    private generateKeySelector;
    performActionTapWithCoordinates(page: NavAIGuidePage, boundingBox: BoundingBox): Promise<void>;
    performActionType(text: string): Promise<void>;
    private performActionTap_Internal;
}
