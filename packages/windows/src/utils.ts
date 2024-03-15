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

// Example usage
// const modulePath = 'C:\\path\\to\\your\\Module.psm1'; // Update to your .psm1 file path
// runPowerShellModuleFunction(modulePath, 'Tap-Element', 'SomeAutomationId')
//   .then(output => console.log(output))
//   .catch(error => console.error(error));

export async function getStartMenuApps(): Promise<Map<string, App>> {
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
  }

  return appsMap;
}

export async function getInstalledApps(): Promise<App[]> {
  const apps: App[] = [];
  try {
    // Run the PowerShell command and get the result in JSON format
    const getInstalledAppsResult = await runPowerShellModuleFunction('Get-AllInstalledApps');
    
    // Parse the JSON result into an array of objects
    const resultApps = JSON.parse(getInstalledAppsResult);

    // Map the parsed objects to the App[] array, adapting fields as necessary
    resultApps.forEach((app: any) => {
      const appData: Partial<App> = {
        id: app.PackageFullName || app.UninstallString, // Use PackageFullName for UWP apps, UninstallString for desktop apps
        title: app.DisplayName || app.Name, // Use DisplayName for desktop apps, Name for UWP apps
        description: app.Publisher, // Use Publisher for both app types
        path: app.InstallLocation || app.UninstallString // Use InstallLocation for UWP apps, UninstallString for desktop apps
      };

      // Ensure an ID and title exist before adding to the apps array
      if (appData.id && appData.title) {
        apps.push(appData as App); // Casting as App since we checked for required fields
      }
    });

  } catch (error) {
    console.error("Error fetching installed apps:", error);
  }

  return apps;
}

/**
 * Activates an app on the device.
 *
 * @param app - The app to activate.
 * @returns {Promise<number>} A promise that resolves to the window app handle.
 */
export async function launchAppAsync(app: App): Promise<number> {
  try {
    const winHandle = await runPowerShellModuleFunction('Start-Application', { 
      LaunchPath: app.path,
      AppName: app.title,
    });

    return parseInt(winHandle, 10);
  } catch (error) {
    console.error(`Error launching app: ${app.title}`, error);
  }

  return null;
}

/**
 * Activates an app on the device.
 *
 * @param app - The app to activate.
 * @returns {Promise<void>} A promise that resolves when the app is activated.
 */
export async function takeAppScreenshotAsync(appReference: number): Promise<string> {
  try {
    const screenshot = await runPowerShellModuleFunction('Get-ScreenshotOfAppWindowAsBase64', {
      WindowHandle: appReference
    })

    return screenshot;
  } catch (error) {
    console.error(`Error taking screenshot of window handle: ${appReference}`, error);
  }

  return null;
}