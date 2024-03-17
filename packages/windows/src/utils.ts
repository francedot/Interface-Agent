import { App } from '@navaiguide/core';
import { exec } from 'child_process';
import path from 'path';

function runPowerShellModuleFunction(functionName: string, namedArgs: {[key: string]: string | number} = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const modulePath = path.join(__dirname, 'WinAutomation.psm1');
    
    // Construct the command arguments string with named parameters
    const commandArgs = Object.entries(namedArgs)
                              .map(([key, value]) => `-${key} "${value.toString().replace(/ /g, '%20').replace(/"/g, '\\"')}"`)
                              .join(' ');
    
    const command = `powershell -Command "& {Import-Module -Name '${modulePath}'; ${functionName} ${commandArgs}}"`;

    exec(command, { maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      if (error) {
        reject(error.message);
      } else if (stderr) {
        reject(stderr);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export async function getAllInstalledApps(): Promise<Map<string, App>> {
  const appsMap = new Map<string, App>();
  try {
    const getInstalledAppsResult = await runPowerShellModuleFunction('Get-AllInstalledApps');
    const resultApps = JSON.parse(getInstalledAppsResult);

    resultApps.forEach((app: any) => {
      const newApp: App = {
        id: app.Title, // Placeholder, ideally use a unique identifier
        title: app.Title,
        path: app.Path,
        metadata: [app.Type]
      };

      if (newApp) {
        appsMap.set(newApp.title, newApp);
      }
    });

  } catch (error) {
    console.error("Error fetching installed apps:", error);
    throw error;
  }

  return appsMap;
}

/**
 * Activates an app on the device.
 *
 * @param app - The app to activate.
 * @returns {Promise<number>} A promise that resolves to the window app handle.
 */
export async function launchAppAsync(app: App): Promise<string> {
  try {
    const winHandle = await runPowerShellModuleFunction('Start-ApplicationAndCaptureHandle', { 
      AppName: app.title,
      LaunchPath: app.path,
      Type: app.metadata[0],
    });

    if (winHandle === null || winHandle === "") {
      throw new Error(`No window handle returned for app: ${app.title}`);
    }

    console.log(`Launched app: ${app.title} with window handle: ${winHandle}`)

    return winHandle;
  } catch (error) {
    console.error(`Error launching app: ${app.title}`, error);
    throw error;
  }
}

/**
 * Activates an app on the device.
 *
 * @param app - The app to activate.
 * @returns {Promise<void>} A promise that resolves when the app is activated.
 */
export async function takeAppScreenshotAsync(winHandle: string): Promise<string> {
  try {
    const screenshot = await runPowerShellModuleFunction('Get-ScreenshotOfAppWindowAsBase64', {
      WindowHandle: winHandle
    });

    return screenshot;
  } catch (error) {
    console.error(`Error taking screenshot of app: ${winHandle}`, error);
    throw error;
  }
}

/**
 * Activates an app on the device.
 *
 * @param app - The app to activate.
 * @returns {Promise<void>} A promise that resolves when the app is activated.
 */
export async function getAppWindowUITree(winHandle: string): Promise<string> {
  try {
    // const winHandle = await runPowerShellModuleFunction('Start-ApplicationAndCaptureHandle', { 
    //   AppName: app.title,
    //   LaunchPath: app.path,
    //   Type: app.metadata[0],
    // });
    // Get-RootAutomationElementFromHandle
    const getAppWindowUITreeResult = await runPowerShellModuleFunction('Get-AppWindowUITree', {
      WindowHandle: winHandle
    });

    return getAppWindowUITreeResult;
  } catch (error) {
    console.error(`Error getting UI tree for app: ${winHandle}`, error);
    throw error;
  }
}

export async function performActionTap(winHandle: string, xPathSelector: string): Promise<boolean> {
  try {
    const invokeUIElementTapResult = await runPowerShellModuleFunction('Invoke-UIElementTap', {
      WindowHandle: winHandle,
      XPath: xPathSelector,
    });

    return invokeUIElementTapResult.toLowerCase() === 'true';
  } catch (error) {
    console.error(`Error performing tap action for app: ${winHandle}`, error);
    throw error;
  }
}

export async function performActionType(winHandle: string, xPathSelector: string, text: string): Promise<boolean> {
  try {
    const setUIElementTextResult = await runPowerShellModuleFunction('Set-UIElementText', {
      WindowHandle: winHandle,
      XPath: xPathSelector,
      Text: text,
    });

    return setUIElementTextResult.toLowerCase() === 'true';
  } catch (error) {
    console.error(`Error performing type action for app: ${winHandle}`, error);
    throw error;
  }
}

// TODO Scroll