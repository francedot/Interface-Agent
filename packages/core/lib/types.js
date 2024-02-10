"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodedFrameworkType = exports.NavAIGuidePage = exports.OpenAIError = exports.OpenAIModels = exports.OpenAIModel = exports.OpenAIEnum = void 0;
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
 * This class encapsulates the details of a webpage including its URL, screenshots, and DOM content.
 */
class NavAIGuidePage {
    constructor() {
        Object.defineProperty(this, "url", {
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
        Object.defineProperty(this, "pageSummary", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    /**
     * Creates a NavAIGuidePage instance.
     * @param url - The URL of the webpage.
     * @param domContent - The DOM content of the webpage.
     * @param screens - An array of screenshots of the webpage in base64 format.
     * @param reduce - Optional: A flag to determine if DOM should be reduced for grounding.
     * @returns A Promise that resolves to a NavAIGuidePage instance.
     */
    static create({ url, domContent, screens }) {
        if (!domContent) {
            throw new Error("DOM content is null or empty");
        }
        const { reducedDomContent, chunks } = (0, utils_1.reduceHtmlDomWithChunks)(domContent);
        return {
            url,
            domContent: domContent,
            reducedDomContent: reducedDomContent,
            reducedDomChunks: chunks,
            screens: screens.map((base64Value) => ({
                metadata: "TODO: add any metadata about the screenshot here",
                base64Value,
            })),
        };
    }
}
exports.NavAIGuidePage = NavAIGuidePage;
/**
 * Enum representing different types of coded frameworks.
 * This helps in categorizing the frameworks used in code actions.
 */
var CodedFrameworkType;
(function (CodedFrameworkType) {
    CodedFrameworkType[CodedFrameworkType["Playwright"] = 0] = "Playwright";
    CodedFrameworkType[CodedFrameworkType["BrowserApi"] = 1] = "BrowserApi";
})(CodedFrameworkType || (exports.CodedFrameworkType = CodedFrameworkType = {}));
