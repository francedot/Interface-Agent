import * as cheerio from "cheerio";
import fs from "fs";
import { decode } from "html-entities";
import * as path from "path";
import { Page as PlaywrightPage } from "@playwright/test";
import { CheerioAPI, Element } from "cheerio";

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

  const chunks = chunkifyHtmlDom(html, chunkMinTokens, chunkMaxTokens);
  return {
    reducedDomContent: html,
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
 * @param {string} htmlDom - The HTML document to chunkify.
 * @param {number} minChunkTokenSize - The minimum size of a chunk in tokens.
 * @param {number} maxChunkTokenSize - The maximum size of a chunk in tokens.
 * @returns {string[]} An array of chunks.
 */
function chunkifyHtmlDom(htmlDom: string, minChunkTokenSize: number, maxChunkTokenSize: number): string[] {
  const minChunkSize = minChunkTokenSize * 4;
  const maxChunkSize = maxChunkTokenSize * 4;

  if (minChunkSize >= maxChunkSize || htmlDom.length <= minChunkSize) {
    return [htmlDom];
  }

  const chunks: string[] = [];
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
): Promise<[boolean, any]> {
  try {
    const result = await asyncEval(context, codeString);
    return [true, result];
  } catch (error) {
    return [false, null];
  }
}

/**
 * Retrieves the outer HTML of a page, retrying up to a maximum number of attempts if the outer HTML is empty.
 *
 * @param {Page} plPage - The page from which to retrieve the outer HTML.
 * @param {number} [maxAttempts=3] - The maximum number of attempts to retrieve the outer HTML.
 * @param {number} [delay=1000] - The delay in milliseconds between attempts.
 * @returns {Promise<string>} A promise that resolves with the outer HTML of the page.
 * @throws Will throw an error if the operation fails after the maximum number of attempts.
 */
export async function getOuterHTMLWithRetry(
  plPage: PlaywrightPage,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<string> {
  let attempts = 0;

  const executeOperation = async (): Promise<string> => {
    try {
      const html = await plPage.evaluate(
        () => document.documentElement.outerHTML
      );

      // Check if the outerHTML is empty and consider it as a condition to retry
      if (html.trim() === "") {
        throw new Error("Document outerHTML is empty");
      }

      return html; // Return the outerHTML if it's not empty
    } catch (error) {
      if (attempts < maxAttempts) {
        attempts++;
        console.log(
          `Attempt ${attempts} failed (${
            error instanceof Error ? error.message : String(error)
          }), retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay)); // Wait for a specified delay before retrying
        return await executeOperation(); // Retry the operation
      } else {
        throw new Error(
          `Operation failed after ${maxAttempts} attempts: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  };

  return await executeOperation();
}

/**
 * Navigates to a specified URL on a page and then waits for a specified timeout.
 *
 * @param {Page} plPage - The page to navigate.
 * @param {string} url - The URL to navigate to.
 * @param {number} [timeout=5000] - The amount of time in milliseconds to wait after navigation.
 * @returns {Promise<void>} A promise that resolves when the navigation and timeout are complete.
 */
export async function gotoWaitForTimeout(
  plPage: PlaywrightPage,
  url: string,
  timeout: number = 5000
): Promise<void> {
  await plPage.goto(url, { waitUntil: "domcontentloaded" } );
  await plPage.waitForTimeout(timeout);
}
