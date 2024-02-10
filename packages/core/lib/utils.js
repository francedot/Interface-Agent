"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryAsyncEval = exports.asyncEval = exports.unescapeString = exports.extractNavigationLinks = exports.reduceHtmlDomWithChunks = exports.parseJsonFromAssets = exports.readFileFromAssets = exports.readImageBase64FromAssets = exports.readFile = exports.readImageBase64 = exports.getEnvironmentVariable = void 0;
const cheerio = __importStar(require("cheerio"));
const fs_1 = __importDefault(require("fs"));
const html_entities_1 = require("html-entities");
const path = __importStar(require("path"));
/**
 * Returns the value of the specified environment variable.
 *
 * @param name - The name of the environment variable.
 * @returns The value of the environment variable, or undefined if it doesn't exist.
 */
function getEnvironmentVariable(name) {
    try {
        return typeof process !== "undefined" ? process.env?.[name] : undefined;
    }
    catch (e) {
        return undefined;
    }
}
exports.getEnvironmentVariable = getEnvironmentVariable;
/**
 * Encodes the specified image file as a base64 string.
 *
 * @param imagePath - The path to the image file.
 * @returns A Promise that resolves to the base64 string.
 */
async function readImageBase64(imagePath) {
    return new Promise((resolve, reject) => {
        fs_1.default.readFile(imagePath, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.toString("base64"));
            }
        });
    });
}
exports.readImageBase64 = readImageBase64;
/**
 * Read from file as a utf-8 string.
 *
 * @param filePath - The path to the file.
 * @returns A Promise that resolves to the utf-8 string.
 */
async function readFile(filePath) {
    return new Promise((resolve, reject) => {
        fs_1.default.readFile(filePath, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.toString("utf-8"));
            }
        });
    });
}
exports.readFile = readFile;
/**
 * Encodes the specified image file from the assets directory as a base64 string.
 *
 * @param imageName - The name of the image file in the assets directory.
 * @returns A Promise that resolves to the base64 string.
 */
async function readImageBase64FromAssets(imageName) {
    const imagePath = path.join(__dirname, "assets", imageName);
    return await readImageBase64(imagePath);
}
exports.readImageBase64FromAssets = readImageBase64FromAssets;
/**
 * Read the file from the assets directory as a utf-8 string.
 *
 * @param fileName - The name of the file in the assets directory.
 * @returns A Promise that resolves to the base64 string.
 */
async function readFileFromAssets(fileName) {
    const filePath = path.join(__dirname, "assets", fileName);
    return await readFile(filePath);
}
exports.readFileFromAssets = readFileFromAssets;
/**
 * Parses the specified JSON file from the assets directory.
 *
 * @param fileName - The name of the JSON file in the assets directory.
 * @returns A Promise that resolves to the parsed JSON object.
 */
async function parseJsonFromAssets(fileName) {
    const filePath = path.join(__dirname, "assets", fileName);
    const fileContent = await fs_1.default.promises.readFile(filePath, "utf-8");
    return JSON.parse(fileContent);
}
exports.parseJsonFromAssets = parseJsonFromAssets;
/**
 * Reduces the DOM by removing non-essential elements and attributes,
 * and minifies the HTML.
 *
 * @param dom - The HTML string representing the DOM.
 * @returns A Promise that resolves to the reduced and minified HTML string.
 */
function reduceHtmlDomWithChunks(dom) {
    const $ = cheerio.load(dom);
    // Remove unwanted tags and attributes in one go, don't remove [style] attribute
    // $("script, style, link, [style], [hidden]").remove();
    $("script, style, link, [hidden]").remove();
    $("meta")
        .not('[name^="description"], [name^="keywords"], [name^="robots"], [property^="og:"], [name^="twitter:"]')
        .remove();
    const attrsToRemove = [
        "data-column-index",
        "data-column-width",
        "data-component-index",
        "data-displaytype",
        "version",
        "font",
        "font-size",
        // Add more attributes as needed
    ];
    // Consolidated element iteration for attribute cleanup
    $("*").each((_, element) => {
        if (element.type === "tag") {
            const $element = $(element);
            const attributes = Object.keys($element[0].attribs);
            attributes.forEach((attr) => {
                const value = $element.attr(attr);
                // Combine numerical check and unwanted attribute removal
                if (!isNaN(parseFloat(value)) || attrsToRemove.includes(attr)) {
                    $element.removeAttr(attr);
                }
            });
            // Remove empty attributes
            attributes
                .filter((attr) => !$element.attr(attr))
                .forEach((attr) => $element.removeAttr(attr));
        }
    });
    // Simplify and cleanup
    removeEmptyAndUnnecessaryElements($);
    minifyAndDecodeHtml($);
    const html = $.root().html();
    if (!html) {
        console.log("HTML is empty after cleanup");
    }
    const chunkMinTokens = 6500;
    const chunkMaxTokens = 7500;
    const chunks = chunkifyHtmlDom(html, chunkMinTokens, chunkMaxTokens);
    return {
        reducedDomContent: html,
        chunks: chunks,
    };
}
exports.reduceHtmlDomWithChunks = reduceHtmlDomWithChunks;
/**
 * Removes empty and unnecessary elements from the HTML document.
 *
 * @param {CheerioAPI} $ - The Cheerio object representing the HTML document.
 */
function removeEmptyAndUnnecessaryElements($) {
    // Remove all comments
    $("*")
        .contents()
        .filter((_, element) => element.type === "comment")
        .remove();
    // Iterate over all elements to remove attributes that start with 'xml'
    $("*").each((_, element) => {
        // Ensure the element is a tag (and thus has attributes) before proceeding
        if (element.type === "tag") {
            const $element = $(element);
            const elementAttribs = element.attribs; // Cast to Element to access attribs
            Object.keys(elementAttribs).forEach((attr) => {
                // Check if the attribute name starts with 'xml'
                if (attr.startsWith("xml")) {
                    $element.removeAttr(attr);
                }
            });
        }
    });
    // Continue with the removal of empty elements and any other unnecessary elements
    $("*")
        .filter((_, element) => $(element).is(":empty") && !$(element).is("img, input, br, hr"))
        .remove();
}
/**
 * Minifies and decodes the HTML document.
 *
 * @param {CheerioAPI} $ - The Cheerio object representing the HTML document.
 */
function minifyAndDecodeHtml($) {
    let html = $.html();
    html = html
        .replace(/\s{2,}/g, " ")
        .replace(/\n/g, " ")
        .trim();
    html = (0, html_entities_1.decode)(html);
    $.root().html(html);
}
/**
 * Splits the HTML document into chunks of a specified size.
 *
 * @param {string} htmlDom - The HTML document to chunkify.
 * @param {number} minChunkTokenSize - The minimum size of a chunk in tokens.
 * @param {number} maxChunkTokenSize - The maximum size of a chunk in tokens.
 * @returns {string[]} An array of chunks.
 */
function chunkifyHtmlDom(htmlDom, minChunkTokenSize, maxChunkTokenSize) {
    const minChunkSize = minChunkTokenSize * 4;
    const maxChunkSize = maxChunkTokenSize * 4;
    if (minChunkSize >= maxChunkSize || htmlDom.length <= minChunkSize) {
        return [htmlDom];
    }
    const chunks = [];
    let currentIndex = 0;
    while (currentIndex < htmlDom.length) {
        let nextChunkBoundary = findNextChunkBoundary(htmlDom, currentIndex, minChunkSize, maxChunkSize);
        let chunk = htmlDom.substring(currentIndex, nextChunkBoundary);
        chunks.push(chunk);
        currentIndex = nextChunkBoundary;
    }
    return chunks.filter((chunk) => chunk.trim() !== "");
}
/**
 * Finds the next boundary for a chunk in the HTML document.
 *
 * @param {string} html - The HTML document.
 * @param {number} startIndex - The index at which to start looking for the boundary.
 * @param {number} minChunkSize - The minimum size of a chunk.
 * @param {number} maxChunkSize - The maximum size of a chunk.
 * @returns {number} The index of the next chunk boundary.
 */
function findNextChunkBoundary(html, startIndex, minChunkSize, maxChunkSize) {
    let endIndex = startIndex + minChunkSize;
    endIndex = Math.min(endIndex, html.length);
    // Move endIndex forward to avoid splitting a tag
    while (endIndex < html.length && html[endIndex] !== '<') {
        endIndex++;
    }
    // Ensure we don't exceed the maximum chunk size
    endIndex = Math.min(endIndex, startIndex + maxChunkSize);
    return endIndex;
}
/**
 * Extracts links from a given DOM and URL, and returns an array of full URLs.
 *
 * @param url - The URL of the page.
 * @param dom - The HTML string representing the DOM.
 * @param withinDomain - A boolean flag indicating whether to extract links only within the same domain.
 * @returns An array of full URLs based on the 'withinDomain' flag.
 */
function extractNavigationLinks(url, dom, withinDomain) {
    try {
        // Parse the provided URL
        const baseUrl = new URL(url);
        // Load the DOM using cheerio
        const $ = cheerio.load(dom);
        // Extract all links from the DOM
        const links = [];
        $("a").each((_, element) => {
            const href = $(element).attr("href");
            if (href) {
                // Resolve relative URLs to absolute URLs using the 'url' module
                const absoluteURL = new URL(href, url);
                // Check if the 'withinDomain' flag is true and if the link's hostname matches the provided URL's hostname
                if (!withinDomain || absoluteURL.hostname === baseUrl.hostname) {
                    links.push(absoluteURL.toString());
                }
            }
        });
        return links;
    }
    catch (error) {
        throw new Error(`Error while extracting links from DOM and URL: ${error.message}`);
    }
}
exports.extractNavigationLinks = extractNavigationLinks;
/**
 * Unescapes the specified string by removing backslashes before quotes and backslashes.
 *
 * @param input - The string to unescape.
 * @returns The unescaped string.
 */
function unescapeString(input) {
    return input.replace(/\\(["'\\])/g, "$1");
}
exports.unescapeString = unescapeString;
/* Playwright-specific */
/**
 * Evaluates the specified code string in the context of the specified variables.
 *
 * @param context - The context variables.
 * @param codeString - The code to evaluate.
 * @returns A Promise that resolves to the result of the evaluation.
 */
async function asyncEval(context = {}, codeString) {
    // Create a function that includes the context variables and the code to execute
    const func = new Function(...Object.keys(context), `return (async () => { 
      try {
        ${codeString}
      } catch (error) {
        throw error;
      }
    })()`);
    try {
        // Call the function with the context values
        console.log("Evaluating code string: " + codeString);
        await func(...Object.values(context));
        console.log("Successfully evaluated code string: " + codeString);
    }
    catch (error) {
        // Handle any errors that occur during evaluation
        console.error("Error during evaluation: " + codeString, error);
        throw error; // Re-throw the error if you want to propagate it
    }
}
exports.asyncEval = asyncEval;
/**
 * Tries to evaluate a code string asynchronously within a given context.
 *
 * @param {Object} [context={}] - The context in which to evaluate the code.
 * @param {string} codeString - The code to evaluate.
 * @param {number} timeout - Timeout to use in the evaluation.
 * @returns {Promise<[boolean, any]>} A promise that resolves with a tuple. The first element is a boolean indicating success or failure. The second element is the result of the evaluation or null if an error occurred.
 */
async function tryAsyncEval(context = {}, codeString) {
    try {
        const result = await asyncEval(context, codeString);
        return [true, result];
    }
    catch (error) {
        return [false, null];
    }
}
exports.tryAsyncEval = tryAsyncEval;
