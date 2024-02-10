"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavAIGuideAgent = void 0;
const navaiguide_1 = require("./navaiguide");
/**
 * The PlaywrightAgent class orchestrates the process of performing and reasoning about actions on a web page towards achieving a specified end goal.
 */
class NavAIGuideAgent {
    /**
     * Constructs a new NavAIGuideAgent instance.
     * @param fields - Configuration fields including OpenAI and AzureAI inputs.
     */
    constructor(fields) {
        Object.defineProperty(this, "navAIGuide", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.navAIGuide = new navaiguide_1.NavAIGuide(fields);
    }
}
exports.NavAIGuideAgent = NavAIGuideAgent;
