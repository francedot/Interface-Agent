import { App, NavAIGuidePage, PageScreen, reduceXmlDomWithChunks } from "@navaiguide/core";
import { getAppWindowUITree, takeAppScreenshotAsync } from "./utils";

/**
 * Class representing a NavAIGuide page as input to NavAIGuide.
 * This class encapsulates the details of a webpage including its URL, screenshots, and DOM content.
 * It provides a static method to create a NavAIGuidePage instance from a Playwright Page object.
 */
export class WindowsNavAIGuidePage extends NavAIGuidePage {

    winHandle: string;

    constructor({ winHandle, location, screens, domContent, reducedDomContent, reducedDomChunks }: {
      winHandle: string;
      location: string;
      screens: PageScreen[];
      domContent: string;
      reducedDomContent: string;
      reducedDomChunks: string[];
  }) {
      super({ location, screens, domContent, reducedDomContent, reducedDomChunks});
      this.winHandle = winHandle;
    }
  
    /**
     * Creates a NavAIGuidePage instance from a Win32 Window handle object.
     * This method captures the DOM content and a full-page screenshot of the given window.
     * The DOM content and screenshot are then used to create a NavAIGuidePage instance.
     *
     * @param location - A location identifier for the page.
     * @param windowHandle - A Win32 Window handle object.
     * @returns A Promise that resolves to a NavAIGuidePage instance.
     */
    public static async fromUIAutomationAsync({
      location,
      winHandle
    }: {
      location: string;
      winHandle: string;
    }): Promise<WindowsNavAIGuidePage> {
      const screenshot = await takeAppScreenshotAsync(winHandle);
      const pageScreens = [
        {
          base64Value: screenshot,
          metadata: "TODO: Add metadata here.",
          screenSize: { width: 0, height: 0 },
        } as PageScreen,
      ];
      const domContent = await getAppWindowUITree(winHandle);
      const { reducedDomContent, chunks } = reduceXmlDomWithChunks(domContent);
  
      return new WindowsNavAIGuidePage({
        winHandle: winHandle,
        location: location,
        screens: pageScreens,
        domContent: domContent,
        reducedDomContent: reducedDomContent,
        reducedDomChunks: chunks
      });
    }
  }