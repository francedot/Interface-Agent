import { NavAIGuidePage } from "packages/core";
import { Page as PlaywrightPage } from "playwright";
import { getOuterHTMLWithRetry } from "./playwright-utils";

/**
 * Class representing a NavAIGuide page as input to NavAIGuide.
 * This class encapsulates the details of a webpage including its URL, screenshots, and DOM content.
 * It provides a static method to create a NavAIGuidePage instance from a Playwright Page object.
 */
export class PlaywrigthNavAIGuidePage extends NavAIGuidePage {
  
  /**
   * Creates a NavAIGuidePage instance from a Playwright Page object.
   * This method captures the DOM content and a full-page screenshot of the given Playwright Page.
   * The DOM content and screenshot are then used to create a NavAIGuidePage instance.
   *
   * @param page - The Playwright Page object.
   * @param reduce - Optional: A flag to determine if DOM should be reduced for grounding.
   * @returns A Promise that resolves to a NavAIGuidePage instance.
   */
  public static async fromPlaywrightAsync({
    page,
  }: {
    page: PlaywrightPage;
    reduce?: boolean;
  }): Promise<NavAIGuidePage> {
    let domContent = await getOuterHTMLWithRetry(page);
    const screenBuffer = await page.screenshot({ fullPage: true, type: "png" });
    const screenBufferBase64 = screenBuffer.toString("base64");
    
    return NavAIGuidePage.create({
      url: page.url(),
      domContent,
      screens: [screenBufferBase64],
    });
  }
}