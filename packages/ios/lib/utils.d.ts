import { App } from '@navaiguide/core';
/**
 * Executes the 'go-ios' command to get all installed apps and returns the output as a JSON object.
 *
 * @returns {Promise<any>} A promise that resolves to a JSON object representing all installed apps. If an error occurs, it logs the error and returns null.
 */
export declare function getInstalledApps(): Promise<App[]>;
/**
 * Activates an app on the device.
 *
 * @param wdioClient - The WebdriverIO client.
 * @param appId - The ID of the app to activate.
 * @returns {Promise<void>} A promise that resolves when the app is activated.
 */
export declare function navigateToAppAsync(wdioClient: WebdriverIO.Browser, appId: string): Promise<void>;
/**
 * Sends a command to the WebDriverAgent.
 *
 * @param sessionId - The session ID.
 * @param command - The command to send as a JSON object.
 * @returns {Promise<any>} A promise that resolves to the response from the WebDriverAgent.
 */
export declare function sendWdaCommand(sessionId: string, command: any): Promise<any>;
export declare function isViewKeyboardVisible(XCUIDom: string): boolean;
export declare function isViewScrollable(XCUIDom: string): boolean;
