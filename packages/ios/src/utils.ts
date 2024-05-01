import { exec } from 'child_process';
import util from 'util';
import * as http from "http";
import { App } from '@interface-agent/core';
import path from "path";

const execPromisified = util.promisify(exec);

/**
 * Executes the 'go-ios' command to get all installed apps and returns the output as a JSON object.
 *
 * @returns {Promise<any>} A promise that resolves to a JSON object representing all installed apps. If an error occurs, it logs the error and returns null.
 */
export async function getInstalledApps(): Promise<App[]> {
  try {
    const goIosPath = path.join(__dirname, '..', 'bin', 'go-ios');
    const { stdout } = await execPromisified(`${goIosPath} apps --list`);
    const lines = stdout.split('\n').slice(1); // Skip the first line
    const apps = lines.map(line => {
      const [id, ...titleParts] = line.split(' ');
      const title = titleParts.join(' ');
      return { id, title } as App;
    })
    .filter(app => app.id !== '');
    return apps;
  } catch (error) {
    console.error(`Error executing command: ${error}`);
    return null;
  }
}

/**
 * Activates an app on the device.
 *
 * @param wdioClient - The WebdriverIO client.
 * @param appId - The ID of the app to activate.
 * @returns {Promise<void>} A promise that resolves when the app is activated.
 */
export async function launchAppAsync(wdioClient: WebdriverIO.Browser, appId: string): Promise<void> {
  return wdioClient.activateApp(appId);
}

/**
 * Sends a command to the WebDriverAgent.
 *
 * @param sessionId - The session ID.
 * @param command - The command to send as a JSON object.
 * @returns {Promise<any>} A promise that resolves to the response from the WebDriverAgent.
 */
export function sendWdaCommand(sessionId: string, command: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(command);

    const options = {
      hostname: '0.0.0.0',
      port: 4723,
      path: `/session/${sessionId}/actions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = http.request(options, res => {
      let responseData = '';

      res.on('data', chunk => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve(JSON.parse(responseData));
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

export function isViewKeyboardVisible(XCUIDom: string): boolean {
  // This checks for the keyboard element and its visibility attribute being true.
  const keyboardVisiblePattern = /<XCUIElementTypeKeyboard[^>]+visible="true"/;
  return keyboardVisiblePattern.test(XCUIDom);
}

export function isViewScrollable(XCUIDom: string): boolean {
  // Check for the presence of scrollable element types in the XML string.
  const scrollableElements = ['XCUIElementTypeTable', 'XCUIElementTypeScrollView'];
  // Return true if any scrollable element types are found in the XML string.
  return scrollableElements.some(element => XCUIDom.includes(element));
}
