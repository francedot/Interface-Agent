// import { remote, RemoteOptions } from 'webdriverio';

// let appiumPort = 4723;
// const envAppiumPort = process.env.APPIUM_PORT;
// if (envAppiumPort != null) {
//   appiumPort = parseInt(envAppiumPort, 10);
// }

// const appiumOptions: RemoteOptions = {
//   hostname: process.env.APPIUM_HOST ?? '127.0.0.1',
//   port: appiumPort,
//   logLevel: 'info',
//   capabilities: {},
// };

// export class AppiumApp {
//   private driver: WebdriverIO.Browser | undefined;

//   async init(capabilities: any) {
//     appiumOptions.capabilities = capabilities;

//     this.driver = await remote(appiumOptions);
//   }

//   async quit() {
//     if (this.driver == null) {
//       return;
//     }

//     await this.driver.pause(1000);
//     await this.driver.deleteSession();
//   }

//   async findElement(selector: string) {
//     if (this.driver == null) {
//       throw new Error('Driver is not initialized');
//     }

//     return await this.driver.$(selector);
//   }
// }

// export { AppiumApp as App };