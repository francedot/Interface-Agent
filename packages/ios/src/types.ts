import { InterfaceAgentPage, PageScreen, reduceXmlDomWithChunks } from "@interface-agent/core";

/**
 * Class representing a InterfaceAgent page as input to InterfaceAgent.
 * This class encapsulates the details of a webpage including its URL, screenshots, and DOM content.
 * It provides a static method to create a InterfaceAgentPage instance from a Playwright Page object.
 */
export class AppiumiOSInterfaceAgentPage extends InterfaceAgentPage {
  
  /**
   * Creates a InterfaceAgentPage instance from a Playwright Page object.
   * This method captures the DOM content and a full-page screenshot of the given Playwright Page.
   * The DOM content and screenshot are then used to create a InterfaceAgentPage instance.
   *
   * @param page - The Playwright Page object.
   * @param reduce - Optional: A flag to determine if DOM should be reduced for grounding.
   * @returns A Promise that resolves to a InterfaceAgentPage instance.
   */
  public static async fromAppiumAsync({
    wdioClient,
    location,
  }: {
    wdioClient: WebdriverIO.Browser;
    location: string;
    reduce?: boolean;
  }): Promise<InterfaceAgentPage> {
    const screenshot = await wdioClient.takeScreenshot();
    const pageScreens = [
      {
        base64Value: screenshot,
        metadata: "TODO: Add metadata here.",
        screenSize: { width: 0, height: 0 },
      } as PageScreen,
    ];
    const domContent = await wdioClient.getPageSource();
    const { reducedDomContent, chunks } = reduceXmlDomWithChunks(domContent);

    return new InterfaceAgentPage({
      location: location,
      screens: pageScreens,
      domContent: domContent,
      reducedDomContent: reducedDomContent,
      reducedDomChunks: chunks
    });
  }
}