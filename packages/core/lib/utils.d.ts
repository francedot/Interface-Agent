import { BoundingBox, ScreenSize } from "./types";
/**
 * Returns the value of the specified environment variable.
 *
 * @param name - The name of the environment variable.
 * @returns The value of the environment variable, or undefined if it doesn't exist.
 */
export declare function getEnvironmentVariable(name: string): string | undefined;
/**
 * Encodes the specified image file as a base64 string.
 *
 * @param imagePath - The path to the image file.
 * @returns A Promise that resolves to the base64 string.
 */
export declare function readImageBase64(imagePath: string): Promise<string>;
/**
 * Read from file as a utf-8 string.
 *
 * @param filePath - The path to the file.
 * @returns A Promise that resolves to the utf-8 string.
 */
export declare function readFile(filePath: string): Promise<string>;
/**
 * Encodes the specified image file from the assets directory as a base64 string.
 *
 * @param imageName - The name of the image file in the assets directory.
 * @returns A Promise that resolves to the base64 string.
 */
export declare function readImageBase64FromAssets(imageName: string): Promise<string>;
/**
 * Read the file from the assets directory as a utf-8 string.
 *
 * @param fileName - The name of the file in the assets directory.
 * @returns A Promise that resolves to the base64 string.
 */
export declare function readFileFromAssets(fileName: string): Promise<string>;
/**
 * Parses the specified JSON file from the assets directory.
 *
 * @param fileName - The name of the JSON file in the assets directory.
 * @returns A Promise that resolves to the parsed JSON object.
 */
export declare function parseJsonFromAssets<T>(fileName: string): Promise<T>;
/**
 * Reduces the DOM by removing non-essential elements and attributes,
 * and minifies the HTML.
 *
 * @param dom - The HTML string representing the DOM.
 * @returns A Promise that resolves to the reduced and minified HTML string.
 */
export declare function reduceHtmlDomWithChunks(dom: string): {
    reducedDomContent: string;
    chunks: string[];
};
/**
 * Reduces the DOM by removing non-essential elements and attributes,
 * and minifies the HTML.
 *
 * @param dom - The HTML string representing the DOM.
 * @returns A Promise that resolves to the reduced and minified HTML string.
 */
export declare function reduceXmlDomWithChunks(dom: string): {
    reducedDomContent: string;
    chunks: string[];
};
/**
 * Extracts links from a given DOM and URL, and returns an array of full URLs.
 *
 * @param url - The URL of the page.
 * @param dom - The HTML string representing the DOM.
 * @param withinDomain - A boolean flag indicating whether to extract links only within the same domain.
 * @returns An array of full URLs based on the 'withinDomain' flag.
 */
export declare function extractNavigationLinks(url: string, dom: string, withinDomain: boolean): string[];
/**
 * Unescapes the specified string by removing backslashes before quotes and backslashes.
 *
 * @param input - The string to unescape.
 * @returns The unescaped string.
 */
export declare function unescapeString(input: string): string;
/**
 * Evaluates the specified code string in the context of the specified variables.
 *
 * @param context - The context variables.
 * @param codeString - The code to evaluate.
 * @returns A Promise that resolves to the result of the evaluation.
 */
export declare function asyncEval(context: {}, codeString: string): Promise<any>;
/**
 * Tries to evaluate a code string asynchronously within a given context.
 *
 * @param {Object} [context={}] - The context in which to evaluate the code.
 * @param {string} codeString - The code to evaluate.
 * @param {number} timeout - Timeout to use in the evaluation.
 * @returns {Promise<[boolean, any]>} A promise that resolves with a tuple. The first element is a boolean indicating success or failure. The second element is the result of the evaluation or null if an error occurred.
 */
export declare function tryAsyncEval(context: {}, codeString: string): Promise<boolean>;
/**
 * Gets the dimensions of an image from a base64 string.
 *
 * @param base64String - The base64 string of the image.
 * @returns A Promise that resolves to an object containing the width and height of the image.
 * @throws Will throw an error if the image fails to load.
 */
export declare function getImageDimensionsFromBase64(base64String: string): {
    width: number;
    height: number;
};
/**
 * Transforms a bounding box from the original screen size to the target screen size.
 *
 * @param originalScreenSize - The original screen size.
 * @param boundingBox - The bounding box to be transformed. It is an array [topLeftX, topLeftY, width, height].
 * @param targetScreenSize - The target screen size.
 * @returns A new bounding box that has been scaled to fit the target screen size.
 */
export declare function transformBoundingBox(originalScreenSize: ScreenSize, boundingBox: BoundingBox, targetScreenSize: ScreenSize): BoundingBox;
/**
 * Calculates the center point of a bounding box.
 *
 * @param boundingBox - The bounding box to calculate the center of. It is an array [topLeftX, topLeftY, width, height].
 * @returns An object with the x and y coordinates of the center of the bounding box.
 */
export declare function calculateBoundingBoxCenter(boundingBox: BoundingBox): {
    centerX: number;
    centerY: number;
};
/**
 * Draws a bounding box on an image and returns the updated image as a base64 string.
 *
 * @param base64Image The base64-encoded image on which to draw.
 * @param boundingBox The bounding box specified as [topX, topY, width, height].
 * @returns A Promise that resolves to the base64-encoded image with the bounding box drawn.
 */
export declare function drawBoundingBoxOnImage(base64Image: string, boundingBox: BoundingBox): Promise<string>;
/**
 * Inserts text into the bottom-left corner of an image.
 *
 * @param base64Image The base64-encoded image into which to insert the text.
 * @param text The text to insert.
 * @returns A Promise that resolves to the base64-encoded image with the text inserted.
 */
export declare function insertTextIntoImage(base64Image: string, text: string): Promise<string>;
export declare function saveBase64ImageToFile(base64Image: string): Promise<void>;
