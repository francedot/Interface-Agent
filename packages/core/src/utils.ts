import * as cheerio from "cheerio";
import fs from "fs";
import { decode } from "html-entities";
import * as path from "path";
import { CheerioAPI, Element } from "cheerio";
import sizeOf from 'image-size';
import { AIModel, AIModelEnum, BoundingBox, ClaudeAIEnum, OpenAIEnum, ScreenSize } from "./types";
import Jimp from 'jimp';
import { v4 as uuidv4 } from 'uuid';

/**
 * Delays the execution of the current function by the specified number of milliseconds.
 * @param ms 
 * @returns 
 */
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries the specified operation with exponential backoff.
 * @param operation The operation to retry.
 * @param shouldRetry A function that returns true if the operation should be retried.
 * @param maxRetries The maximum number of retries.
 * @param retryDelay The initial delay between retries in milliseconds.
 * @param maxDelay The maximum delay between retries in milliseconds.
 * @returns 
 */
export async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: any) => boolean, // Added a function to check if we should retry
  maxRetries: number = 5,
  retryDelay: number = 1000,
  maxDelay: number = 32000
): Promise<T> {
  let retryCount = 0;

  const executeOperation = async (): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      const canRetry = shouldRetry(error);

      if (!canRetry || retryCount >= maxRetries) throw error; // Check if we should retry

      console.log(`Operation failed, retrying in ${retryDelay}ms. Error: ${error}`);
      await delay(retryDelay);

      // Prepare for the next retry
      retryCount++;
      retryDelay = Math.min(retryDelay * 2, maxDelay); // Exponential backoff with a cap

      return executeOperation(); // Retry operation
    }
  };

  return executeOperation();
}

/**
 * Returns the value of the specified environment variable.
 *
 * @param name - The name of the environment variable.
 * @returns The value of the environment variable, or undefined if it doesn't exist.
 */
export function getEnvironmentVariable(name: string): string | undefined {
  try {
    return typeof process !== "undefined" ? process.env?.[name] : undefined;
  } catch (e) {
    return undefined;
  }
}

/**
 * Encodes the specified image file as a base64 string.
 *
 * @param imagePath - The path to the image file.
 * @returns A Promise that resolves to the base64 string.
 */
export async function readImageBase64(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(imagePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.toString("base64"));
      }
    });
  });
}

/**
 * Read from file as a utf-8 string.
 *
 * @param filePath - The path to the file.
 * @returns A Promise that resolves to the utf-8 string.
 */
export async function readFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.toString("utf-8"));
      }
    });
  });
}

/**
 * Encodes the specified image file from the assets directory as a base64 string.
 *
 * @param imageName - The name of the image file in the assets directory.
 * @returns A Promise that resolves to the base64 string.
 */
export async function readImageBase64FromAssets(
  imageName: string
): Promise<string> {
  const imagePath = path.join(__dirname, "assets", imageName);
  return await readImageBase64(imagePath);
}

/**
 * Read the file from the assets directory as a utf-8 string.
 *
 * @param fileName - The name of the file in the assets directory.
 * @returns A Promise that resolves to the base64 string.
 */
export async function readFileFromAssets(fileName: string): Promise<string> {
  const filePath = path.join(__dirname, "assets", fileName);
  return await readFile(filePath);
}

/**
 * Parses the specified JSON file from the assets directory.
 *
 * @param fileName - The name of the JSON file in the assets directory.
 * @returns A Promise that resolves to the parsed JSON object.
 */
export async function parseJsonFromAssets<T>(fileName: string): Promise<T> {
  const filePath = path.join(__dirname, "assets", fileName);
  const fileContent = await fs.promises.readFile(filePath, "utf-8");
  return JSON.parse(fileContent) as T;
}

/**
 * Reduces the DOM by removing non-essential elements and attributes,
 * and minifies the HTML.
 *
 * @param dom - The HTML string representing the DOM.
 * @returns A Promise that resolves to the reduced and minified HTML string.
 */
export function reduceHtmlDomWithChunks(dom: string): {
  reducedDomContent: string;
  chunks: string[];
} {
  const $ = cheerio.load(dom);

  // Remove unwanted tags and attributes in one go, don't remove [style] attribute
  // $("script, style, link, [style], [hidden]").remove();
  $("script, style, link, [hidden]").remove();
  $("meta")
    .not(
      '[name^="description"], [name^="keywords"], [name^="robots"], [property^="og:"], [name^="twitter:"]'
    )
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

  const chunks = chunkifyDom(html, chunkMinTokens, chunkMaxTokens);
  return {
    reducedDomContent: html,
    chunks: chunks,
  };
}

/**
 * Reduces the DOM by removing non-essential elements and attributes,
 * and minifies the HTML.
 *
 * @param dom - The HTML string representing the DOM.
 * @returns A Promise that resolves to the reduced and minified HTML string.
 */
export function reduceXmlDomWithChunks(dom: string): {
  reducedDomContent: string;
  chunks: string[];
} {
  const chunkMinTokens = 6500;
  const chunkMaxTokens = 7500;

  const chunks = chunkifyDom(dom, chunkMinTokens, chunkMaxTokens);
  return {
    reducedDomContent: dom,
    chunks: chunks,
  };
}

/**
 * Removes empty and unnecessary elements from the HTML document.
 *
 * @param {CheerioAPI} $ - The Cheerio object representing the HTML document.
 */
function removeEmptyAndUnnecessaryElements($: CheerioAPI) {
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
      const elementAttribs = (element as Element).attribs; // Cast to Element to access attribs
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
    .filter(
      (_, element) =>
        $(element).is(":empty") && !$(element).is("img, input, br, hr")
    )
    .remove();
}

/**
 * Minifies and decodes the HTML document.
 *
 * @param {CheerioAPI} $ - The Cheerio object representing the HTML document.
 */
function minifyAndDecodeHtml($: cheerio.CheerioAPI) {
  let html = $.html();
  html = html
    .replace(/\s{2,}/g, " ")
    .replace(/\n/g, " ")
    .trim();
  html = decode(html);
  $.root().html(html);
}

/**
 * Splits the HTML document into chunks of a specified size.
 *
 * @param {string} dom - The HTML document to chunkify.
 * @param {number} minChunkTokenSize - The minimum size of a chunk in tokens.
 * @param {number} maxChunkTokenSize - The maximum size of a chunk in tokens.
 * @returns {string[]} An array of chunks.
 */
function chunkifyDom(dom: string, minChunkTokenSize: number, maxChunkTokenSize: number): string[] {
  const minChunkSize = minChunkTokenSize * 4;
  const maxChunkSize = maxChunkTokenSize * 4;

  if (minChunkSize >= maxChunkSize || dom.length <= minChunkSize) {
    return [dom];
  }

  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < dom.length) {
    let nextChunkBoundary = findNextChunkBoundary(dom, currentIndex, minChunkSize, maxChunkSize);
    let chunk = dom.substring(currentIndex, nextChunkBoundary);

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
function findNextChunkBoundary(html: string, startIndex: number, minChunkSize: number, maxChunkSize: number): number {
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
export function extractNavigationLinks(
  url: string,
  dom: string,
  withinDomain: boolean
): string[] {
  try {
    // Parse the provided URL
    const baseUrl = new URL(url);

    // Load the DOM using cheerio
    const $ = cheerio.load(dom);

    // Extract all links from the DOM
    const links: string[] = [];

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
  } catch (error) {
    throw new Error(
      `Error while extracting links from DOM and URL: ${error.message}`
    );
  }
}

/**
 * Unescapes the specified string by removing backslashes before quotes and backslashes.
 *
 * @param input - The string to unescape.
 * @returns The unescaped string.
 */
export function unescapeString(input: string): string {
  return input.replace(/\\(["'\\])/g, "$1");
}

/* Playwright-specific */

/**
 * Evaluates the specified code string in the context of the specified variables.
 *
 * @param context - The context variables.
 * @param codeString - The code to evaluate.
 * @returns A Promise that resolves to the result of the evaluation.
 */
export async function asyncEval(
  context = {},
  codeString: string,
): Promise<any> {
  // Create a function that includes the context variables and the code to execute
  const func = new Function(
    ...Object.keys(context),
    `return (async () => { 
      try {
        ${codeString}
      } catch (error) {
        throw error;
      }
    })()`
  );

  try {
    // Call the function with the context values
    console.log("Evaluating code string: " + codeString)
    await func(...Object.values(context));
    console.log("Successfully evaluated code string: " + codeString)
  } catch (error) {
    // Handle any errors that occur during evaluation
    console.error("Error during evaluation: " + codeString, error);
    throw error; // Re-throw the error if you want to propagate it
  }
}

/**
 * Tries to evaluate a code string asynchronously within a given context.
 *
 * @param {Object} [context={}] - The context in which to evaluate the code.
 * @param {string} codeString - The code to evaluate.
 * @param {number} timeout - Timeout to use in the evaluation.
 * @returns {Promise<[boolean, any]>} A promise that resolves with a tuple. The first element is a boolean indicating success or failure. The second element is the result of the evaluation or null if an error occurred.
 */
export async function tryAsyncEval(
  context = {},
  codeString: string,
): Promise<boolean> {
  try {
    await asyncEval(context, codeString);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the dimensions of an image from a base64 string.
 *
 * @param base64String - The base64 string of the image.
 * @returns A Promise that resolves to an object containing the width and height of the image.
 * @throws Will throw an error if the image fails to load.
 */
export function getImageDimensionsFromBase64(base64String: string): { width: number, height: number } {
  const buffer = Buffer.from(base64String, 'base64');
  const dimensions = sizeOf(buffer);
  return {
    width: dimensions.width,
    height: dimensions.height
  };
}

/**
 * Transforms a bounding box from the original screen size to the target screen size.
 *
 * @param originalScreenSize - The original screen size.
 * @param boundingBox - The bounding box to be transformed. It is an array [topLeftX, topLeftY, width, height].
 * @param targetScreenSize - The target screen size.
 * @returns A new bounding box that has been scaled to fit the target screen size.
 */
export function transformBoundingBox(
  originalScreenSize: ScreenSize,
  boundingBox: BoundingBox,
  targetScreenSize: ScreenSize
): BoundingBox {


  // Calculate scale factors
  const scaleFactorWidth = targetScreenSize.width / originalScreenSize.width;
  const scaleFactorHeight = targetScreenSize.height / originalScreenSize.height;

  // Apply scale factors to bounding box
  const transformedBoundingBox: BoundingBox = [
    boundingBox[0] * scaleFactorWidth, // Scaled topLeftX
    boundingBox[1] * scaleFactorHeight, // Scaled topLeftY
    boundingBox[2] * scaleFactorWidth, // Scaled width
    boundingBox[3] * scaleFactorHeight, // Scaled height
  ];

  return transformedBoundingBox;
}

/**
 * Calculates the center point of a bounding box.
 *
 * @param boundingBox - The bounding box to calculate the center of. It is an array [topLeftX, topLeftY, width, height].
 * @returns An object with the x and y coordinates of the center of the bounding box.
 */
export function calculateBoundingBoxCenter(boundingBox: BoundingBox): { centerX: number; centerY: number } {
  const [topLeftX, topLeftY, width, height] = boundingBox;

  // Calculate center X and Y
  const centerX = topLeftX + width / 2;
  const centerY = topLeftY + height / 2;

  return { centerX, centerY };
}

/**
 * Draws a bounding box on an image and returns the updated image as a base64 string.
 * 
 * @param base64Image The base64-encoded image on which to draw.
 * @param boundingBox The bounding box specified as [topX, topY, width, height].
 * @returns A Promise that resolves to the base64-encoded image with the bounding box drawn.
 */
export async function drawBoundingBoxOnImage(base64Image: string, boundingBox: BoundingBox): Promise<string> {
  // Load the image from the base64 string
  const image = await Jimp.read(Buffer.from(base64Image, 'base64'));

  // Extract the bounding box coordinates
  const [topX, topY, width, height] = boundingBox;

  // Define the color and width of the bounding box's border
  const color = Jimp.cssColorToHex('#FF0000'); // Red color
  const borderWidth = 2; // You can adjust the border width

  // Draw the top and bottom lines
  image.scan(topX, topY, width, borderWidth, function (x, y, idx) {
    this.bitmap.data[idx + 0] = (color >> 24) & 255; // Red
    this.bitmap.data[idx + 1] = (color >> 16) & 255; // Green
    this.bitmap.data[idx + 2] = (color >> 8) & 255;  // Blue
    this.bitmap.data[idx + 3] = color & 255;         // Alpha
  });

  image.scan(topX, topY + height - borderWidth, width, borderWidth, function (x, y, idx) {
    this.bitmap.data[idx + 0] = (color >> 24) & 255; // Red
    this.bitmap.data[idx + 1] = (color >> 16) & 255; // Green
    this.bitmap.data[idx + 2] = (color >> 8) & 255;  // Blue
    this.bitmap.data[idx + 3] = color & 255;         // Alpha
  });

  // Draw the left and right lines
  image.scan(topX, topY, borderWidth, height, function (x, y, idx) {
    this.bitmap.data[idx + 0] = (color >> 24) & 255; // Red
    this.bitmap.data[idx + 1] = (color >> 16) & 255; // Green
    this.bitmap.data[idx + 2] = (color >> 8) & 255;  // Blue
    this.bitmap.data[idx + 3] = color & 255;         // Alpha
  });

  image.scan(topX + width - borderWidth, topY, borderWidth, height, function (x, y, idx) {
    this.bitmap.data[idx + 0] = (color >> 24) & 255; // Red
    this.bitmap.data[idx + 1] = (color >> 16) & 255; // Green
    this.bitmap.data[idx + 2] = (color >> 8) & 255;  // Blue
    this.bitmap.data[idx + 3] = color & 255;         // Alpha
  });

  // Get the modified image as a base64 string
  return new Promise((resolve, reject) => {
    image.getBase64(Jimp.MIME_PNG, (err, base64) => {
      if (err) reject(err);
      else resolve(base64.split(',')[1]); // Return the base64 content without the MIME type prefix
    });
  });
}

/**
 * Inserts text into the bottom-left corner of an image.
 * 
 * @param base64Image The base64-encoded image into which to insert the text.
 * @param text The text to insert.
 * @returns A Promise that resolves to the base64-encoded image with the text inserted.
 */
export async function insertTextIntoImage(base64Image: string, text: string): Promise<string> {
  // Load the image from the base64 string
  const image = await Jimp.read(Buffer.from(base64Image, 'base64'));

  // Load a font
  const font = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE); // Choose the font size and color

  // Calculate text width
  const textWidth = Jimp.measureText(font, text);

  // Define the position for the text (top-left corner)
  // const x = (image.bitmap.width - textWidth) / 2; // Center the text horizontally
  const x = 10; // Margin from the left edge, adjust as needed
  const y = 10; // Margin from the top edge, adjust as needed

  // Insert the text into the image
  image.print(font, x, y, text);

  // Get the modified image as a base64 string
  return new Promise((resolve, reject) => {
    image.getBase64(Jimp.MIME_PNG, (err, base64) => {
      if (err) reject(err);
      else resolve(base64.split(',')[1]); // Return the base64 content without the MIME type prefix
    });
  });
}

export async function saveBase64ImageToFile(base64Image: string) {
  // Remove base64 prefix if present
  const base64Data = base64Image.replace(/^data:image\/png;base64,/, "");

  // Generate a random GUID for the file name
  const fileName = `${uuidv4()}.png`;

  // Convert base64 to binary data
  const buffer = Buffer.from(base64Data, 'base64');

  // Save the image to the current folder
  fs.writeFileSync(fileName, buffer);
}

// function findInEnums<T>(predicate: (enumObj: any) => T): T | null {
//   let result = predicate(OpenAIEnum);
//   if (result !== null) return result;

//   result = predicate(ClaudeAIEnum);
//   if (result !== null) return result;

//   return null;
// }

// export function getAIModelEnumValueFromKey(key: string): AIModelEnum | null {
//   return findInEnums((enumObj) => key in enumObj ? enumObj[key as keyof typeof enumObj] : null);
// }

// export function getAIModelEnumKeyFromValue(value: AIModelEnum): string | null {
//   return findInEnums((enumObj) => {
//     for (let key in enumObj) {
//       if (enumObj[key as keyof typeof enumObj] === value) {
//         return key;
//       }
//     }
//     return null;
//   });
// }