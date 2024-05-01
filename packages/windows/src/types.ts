import { InterfaceAgentPage, PageScreen, Tool, reduceXmlDomWithChunks } from "@interface-agent/core";
import { getWindowUITree, takeToolScreenshotAsync } from "./utils";

export type ToolsetMap = Map<string, Tool>;

export interface Window {
  handle: number;
  title: string;
  relevanceScore: number;
}

/**
 * Class representing a InterfaceAgent page as input to InterfaceAgent.
 * This class encapsulates the details of a webpage including its URL, screenshots, and DOM content.
 * It provides a static method to create a InterfaceAgentPage instance from a Playwright Page object.
 */
export class WindowsInterfaceAgentPage extends InterfaceAgentPage {

    winHandle: string;

    constructor({ winHandle, location, screens, domContent, reducedDomContent, reducedDomChunks, minimizedDomContent }: {
      winHandle: string;
      location: string;
      screens: PageScreen[];
      domContent: string;
      reducedDomContent: string;
      reducedDomChunks: string[];
      minimizedDomContent?: string;
  }) {
      super({ location, screens, domContent, reducedDomContent, reducedDomChunks, minimizedDomContent });
      this.winHandle = winHandle;
    }
  
    /**
     * Creates a InterfaceAgentPage instance from a Win32 Window handle object.
     * This method captures the DOM content and a full-page screenshot of the given window.
     * The DOM content and screenshot are then used to create a InterfaceAgentPage instance.
     *
     * @param location - A location identifier for the page.
     * @param windowHandle - A Win32 Window handle object.
     * @returns A Promise that resolves to a InterfaceAgentPage instance.
     */
    public static async fromUIAutomationAsync({
      location,
      winHandle,
      isVisualMode = false,
    }: {
      location: string;
      winHandle: string;
      isVisualMode?: boolean;
    }): Promise<WindowsInterfaceAgentPage> {

      let pageScreens: PageScreen[] = [];
      if (isVisualMode) {
        const screenshot = await takeToolScreenshotAsync(winHandle);
        pageScreens = [
          {
            base64Value: screenshot,
            metadata: "TODO: Add metadata here.",
            screenSize: { width: 0, height: 0 },
          } as PageScreen,
        ];
      }

      const domContent = await getWindowUITree(winHandle);
      const { reducedDomContent, chunks } = reduceXmlDomWithChunks(domContent);
  
      return new WindowsInterfaceAgentPage({
        winHandle: winHandle,
        location: location,
        screens: pageScreens,
        domContent: domContent,
        reducedDomContent: reducedDomContent,
        reducedDomChunks: chunks
      });
    }
  }