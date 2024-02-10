/**
 * Class representing a NavAIGuide page as input to NavAIGuide.
 * This class encapsulates the details of a webpage including its URL, screenshots, and DOM content.
 */
export class PNavAIGuidePage {
  
    /**
     * Creates a NavAIGuidePage instance from a Playwright Page object.
     * @param page - The Playwright Page object.
     * @param reduce - Optional: A flag to determine if DOM should be reduced for grounding.
     * @returns A Promise that resolves to a NavAIGuidePage instance.
     */
    public static async fromPlaywrightAsync({
      page,
    }: {
      page: Page;
      reduce?: boolean;
    }): Promise<NavAIGuidePage> {
      let domContent = await getOuterHTMLWithRetry(page);
      const screenBuffer = await page.screenshot({ fullPage: true, type: "png" });
      const screenBufferBase64 = screenBuffer.toString("base64");
      
      return super.create({
        url: page.url(),
        domContent,
        screens: [screenBufferBase64],
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
    static create({
      url,
      domContent,
      screens
    }: {
      url: string;
      domContent: string;
      screens: string[];
    }): NavAIGuidePage {
      if (!domContent) {
        throw new Error("DOM content is null or empty");
      }
  
      const { reducedDomContent, chunks } = reduceHtmlDomWithChunks(domContent);
      
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