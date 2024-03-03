"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavAIGuidePage = exports.OpenAIError = exports.OpenAIModels = exports.OpenAIModel = exports.OpenAIEnum = void 0;
const utils_1 = require("./utils");
/**
 * Enum representing different OpenAI models.
 */
var OpenAIEnum;
(function (OpenAIEnum) {
    OpenAIEnum["GPT35_TURBO"] = "gpt-3.5-turbo";
    OpenAIEnum["GPT35_TURBO_16K"] = "gpt-3.5-turbo-16k";
    OpenAIEnum["GPT4_TURBO"] = "gpt-4-1106-preview";
    OpenAIEnum["GPT4_TURBO_VISION"] = "gpt-4-vision-preview";
})(OpenAIEnum || (exports.OpenAIEnum = OpenAIEnum = {}));
/**
 * Class representing an OpenAI model.
 */
class OpenAIModel {
    /**
     * Constructs a new instance of the OpenAIModel class.
     * @param key - The key of the model.
     * @param azureAIValue - The value of the Azure AI model.
     * @param openAIValue - The value of the OpenAI model.
     */
    constructor({ key, azureAIValue, openAIValue, }) {
        /**
         * The key of the OpenAI model.
         */
        Object.defineProperty(this, "key", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * The value of the Azure AI model.
         */
        Object.defineProperty(this, "azureAIValue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * The value of the OpenAI model.
         */
        Object.defineProperty(this, "openAIValue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.key = key;
        this.azureAIValue = azureAIValue;
        this.openAIValue = openAIValue;
    }
}
exports.OpenAIModel = OpenAIModel;
/**
 * Class representing a collection of OpenAI models.
 */
class OpenAIModels {
    constructor() { }
    /**
     * Retrieves the OpenAI model with the specified key.
     * @param key - The key of the model to retrieve.
     * @returns The OpenAIModel instance corresponding to the specified key.
     */
    static getModel(key) {
        return OpenAIModels.models[key];
    }
}
exports.OpenAIModels = OpenAIModels;
/**
 * A dictionary of OpenAI models.
 * The key is the model key, and the value is an instance of OpenAIModel.
 */
Object.defineProperty(OpenAIModels, "models", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        [OpenAIEnum.GPT35_TURBO]: new OpenAIModel({
            key: OpenAIEnum.GPT35_TURBO,
            azureAIValue: "SET_BY_CALLER",
            openAIValue: "gpt-3.5-turbo-1106",
        }),
        [OpenAIEnum.GPT35_TURBO_16K]: new OpenAIModel({
            key: OpenAIEnum.GPT35_TURBO_16K,
            azureAIValue: "SET_BY_CALLER",
            openAIValue: "gpt-3.5-turbo-16k",
        }),
        [OpenAIEnum.GPT4_TURBO]: new OpenAIModel({
            key: OpenAIEnum.GPT4_TURBO_VISION,
            azureAIValue: "SET_BY_CALLER",
            openAIValue: "gpt-4-1106-preview",
        }),
        [OpenAIEnum.GPT4_TURBO_VISION]: new OpenAIModel({
            key: OpenAIEnum.GPT4_TURBO_VISION,
            azureAIValue: "SET_BY_CALLER",
            openAIValue: "gpt-4-vision-preview",
        }),
    }
});
class OpenAIError extends Error {
    constructor(message, code) {
        super(message);
        Object.defineProperty(this, "code", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.code = code;
        this.name = 'APIError';
    }
}
exports.OpenAIError = OpenAIError;
/**
 * Class representing a NavAIGuide page as input to NavAIGuide.
 * @property {string} location - The location of the page.
 * @property {PageScreen[]} screens - The screens of the page.
 * @property {string} domContent - The DOM content of the page.
 * @property {string} reducedDomContent - The reduced DOM content of the page.
 * @property {string[]} reducedDomChunks - The reduced DOM chunks of the page.
 */
class NavAIGuidePage {
    /**
     * Creates a NavAIGuidePage instance.
     * @param {Object} params - The parameters for the NavAIGuidePage.
     * @param {string} params.location - The location of the page.
     * @param {PageScreen[]} params.screens - The screens of the page.
     * @param {string} params.domContent - The DOM content of the page.
     * @param {string} params.reducedDomContent - The reduced DOM content of the page.
     * @param {string[]} params.reducedDomChunks - The reduced DOM chunks of the page.
     */
    constructor({ location, screens, domContent, reducedDomContent, reducedDomChunks }) {
        Object.defineProperty(this, "location", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "screens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "domContent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "reducedDomContent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "reducedDomChunks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.location = location;
        this.screens = screens;
        this.domContent = domContent;
        this.reducedDomContent = reducedDomContent;
        this.reducedDomChunks = reducedDomChunks;
    }
    /**
     * Draws a watermark on the screens of the page.
     * @returns {Promise<NavAIGuidePage>} - The page with watermarked screens.
     */
    async drawBeforeWatermarkAsync() {
        // Watermark the image with a BEFORE watermark
        await Promise.all(this.screens.map(async (screen) => {
            screen.base64ValueWithBeforeWatermark = await (0, utils_1.insertTextIntoImage)(screen.base64Value, "BEFORE");
        }));
        return this;
    }
    /**
     * Draws a watermark on the screens of the page.
     * @returns {Promise<NavAIGuidePage>} - The page with watermarked screens.
     */
    async drawAfterWatermarkAsync() {
        // Watermark the image with a AFTER watermark
        await Promise.all(this.screens.map(async (screen) => {
            screen.base64ValueWithAfterWatermark = await (0, utils_1.insertTextIntoImage)(screen.base64Value, "AFTER");
        }));
        return this;
    }
}
exports.NavAIGuidePage = NavAIGuidePage;
;
