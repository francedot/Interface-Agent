import { Page as PlaywrightPage } from "@playwright/test";

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