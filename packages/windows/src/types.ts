import { NavAIGuidePage, PageScreen, reduceXmlDomWithChunks } from "@navaiguide/core";
import { takeAppScreenshotAsync } from "./utils";

/**
 * Class representing a NavAIGuide page as input to NavAIGuide.
 * This class encapsulates the details of a webpage including its URL, screenshots, and DOM content.
 * It provides a static method to create a NavAIGuidePage instance from a Playwright Page object.
 */
export class WindowsNavAIGuidePage extends NavAIGuidePage {
  
    /**
     * Creates a NavAIGuidePage instance from a Playwright Page object.
     * This method captures the DOM content and a full-page screenshot of the given Playwright Page.
     * The DOM content and screenshot are then used to create a NavAIGuidePage instance.
     *
     * @param page - The Playwright Page object.
     * @param reduce - Optional: A flag to determine if DOM should be reduced for grounding.
     * @returns A Promise that resolves to a NavAIGuidePage instance.
     */
    public static async fromUIAutomationAsync({
      location,
      windowHandle
    }: {
      location: string;
      windowHandle: number;
      reduce?: boolean;
    }): Promise<NavAIGuidePage> {
    const screenshot = await takeAppScreenshotAsync(windowHandle);
    console.log(`Took screenshot of window handle: ${screenshot}`);
    //   const pageScreens = [
    //     {
    //       base64Value: screenshot,
    //       metadata: "TODO: Add metadata here.",
    //       screenSize: { width: 0, height: 0 },
    //     } as PageScreen,
    //   ];
    //   const domContent = await wdioClient.getPageSource();
    //   const { reducedDomContent, chunks } = reduceXmlDomWithChunks(domContent);
  
      return new NavAIGuidePage({
        location: location,
        screens: [],
        domContent: "",
        reducedDomContent: "",
        reducedDomChunks: []
      });
    }
  }