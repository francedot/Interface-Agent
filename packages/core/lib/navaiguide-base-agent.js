"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavAIGuideBaseAgent = void 0;
const navaiguide_1 = require("./navaiguide");
/**
 * The NavAIGuideBaseAgent class is an abstract class that provides a base for creating multi-modal agents that use the NavAIGuide framework to achieve a specified end goal using a series of actions.
 */
class NavAIGuideBaseAgent {
    /**
     * Constructs a new NavAIGuideBaseAgent instance.
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
exports.NavAIGuideBaseAgent = NavAIGuideBaseAgent;
