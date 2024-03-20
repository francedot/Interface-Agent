import { Tool } from '@navaiguide/core';
import { exec } from 'child_process';
import path from 'path';
import { ToolsetMap } from './types';

function extractContentFromMixedOutput(output) {
  // Define regex to match content between the specified start and end markers
  const contentRegex = /#< CLIXML\r\n([\s\S]*?)\r\n\r\n<Objs Version="1\.1\.0\.1"/;
  const match = contentRegex.exec(output);

  if (match && match[1]) {
    // The content has been successfully extracted
    return match[1].trim(); // Trim to remove leading/trailing whitespace
  } else {
    console.error("Content not found in the output.");
    return null;
  }
}

function runPowerShellModuleFunction(functionName: string, namedArgs: { [key: string]: string | number } = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const modulePath = path.join(__dirname, 'WinAutomation.psm1');

    // Construct the PowerShell command script with named parameters
    const commandScript = Object.entries(namedArgs)
                                .map(([key, value]) => `-${key} '${value.toString().replace(/'/g, "''")}'`)
                                .join(' ');

    // Prepare the full command to be executed, incorporating Out-String for plain text output
    const fullCommand = `& {$ProgressPreference = 'SilentlyContinue'; Import-Module -Name '${modulePath}'; ${functionName} ${commandScript} | Out-String}`;

    // Convert the full command to a Base64-encoded string in UTF-16LE format, as expected by PowerShell
    const buffer = Buffer.from(fullCommand, 'utf16le');
    const base64Command = buffer.toString('base64');

    // Construct the PowerShell invocation command, ensuring non-interactive execution and redirecting stderr to stdout
    const command = `powershell -NonInteractive -EncodedCommand ${base64Command} 2>&1`;

    // Execute the command using exec, capturing stdout and stderr in a unified manner
    exec(command, { maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`);
      } else if (stderr && !stdout) {
        // Check if stderr has content but stdout does not, indicating an error
        reject(`PowerShell Error: ${stderr}`);
      } else {
        // Resolve the promise with the trimmed stdout content
        resolve(extractContentFromMixedOutput(stdout.trim()));
      }
    });
  });
}

export async function getAllInstalledTools(): Promise<ToolsetMap> {
  const toolsMap = new Map<string, Tool>();
  try {
    const getInstalledAppsResult = await runPowerShellModuleFunction('Get-AllInstalledApps');
    const resultApps = JSON.parse(getInstalledAppsResult);

    resultApps.forEach((app: any) => {
      const newTool: Tool = {
        id: app.Title, 
        title: app.Title,
        path: app.Path,
        metadata: [app.Type]
      };

      if (newTool) {
        toolsMap.set(newTool.title, newTool);
      }
    });

  } catch (error) {
    console.error("Error fetching installed apps:", error);
    throw error;
  }

  return toolsMap;
}

/**
 * Activates an app on the device.
 *
 * @param app - The app to activate.
 * @returns {Promise<number>} A promise that resolves to the window app handle.
 */
export async function launchToolAsync(tool: Tool): Promise<string> {
  try {
    const winHandle = await runPowerShellModuleFunction('Start-ApplicationAndCaptureHandle', { 
      AppName: tool.title,
      LaunchPath: tool.path,
      Type: tool.metadata[0],
    });

    if (winHandle === null || winHandle === "") {
      throw new Error(`No window handle returned for app: ${tool.title}`);
    }

    console.log(`Launched app: ${tool.title} with window handle: ${winHandle}`)

    return winHandle;
  } catch (error) {
    console.error(`Error launching app: ${tool.title}`, error);
    throw error;
  }
}

/**
 * Activates an app on the device.
 *
 * @param app - The app to activate.
 * @returns {Promise<void>} A promise that resolves when the app is activated.
 */
export async function takeToolScreenshotAsync(winHandle: string): Promise<string> {
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
export async function getWindowUITree(winHandle: string): Promise<string> {
  try {
    const getAppWindowUITreeResult = await runPowerShellModuleFunction('Get-WindowUITree', {
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

export async function performActionType(winHandle: string, xPathSelector: string, text: string, mode: "overwrite" | "append"): Promise<boolean> {
  try {
    const setUIElementTextResult = await runPowerShellModuleFunction('Set-UIElementText', {
      WindowHandle: winHandle,
      XPath: xPathSelector,
      Text: text,
      Mode: mode
    });

    return setUIElementTextResult.toLowerCase() === 'true';
  } catch (error) {
    console.error(`Error performing type action for app: ${winHandle}`, error);
    throw error;
  }
}

// TODO Scroll