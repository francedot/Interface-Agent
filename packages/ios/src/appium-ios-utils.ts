import { exec } from 'child_process';
import util from 'util';
import { iOSApp } from './types';

const execPromisified = util.promisify(exec);

/**
 * Executes the 'go-ios' command to get all installed apps and returns the output as a JSON object.
 *
 * @returns {Promise<any>} A promise that resolves to a JSON object representing all installed apps. If an error occurs, it logs the error and returns null.
 */
export async function getInstalledApps(): Promise<iOSApp[]> {
    try {
      const { stdout } = await execPromisified('bin/go-ios apps --list');
      const lines = stdout.split('\n').slice(1); // Skip the first line
      const apps = lines.map(line => {
        const [id, ...titleParts] = line.split(' ');
        const title = titleParts.join(' ');
        return { id, title } as iOSApp;
      })
      .filter(app => app.id !== '');
      return apps;
    } catch (error) {
      console.error(`Error executing command: ${error}`);
      return null;
    }
  }