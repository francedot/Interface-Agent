"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isViewScrollable = exports.isViewKeyboardVisible = exports.sendWdaCommand = exports.navigateToAppAsync = exports.getInstalledApps = void 0;
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const http = __importStar(require("http"));
const execPromisified = util_1.default.promisify(child_process_1.exec);
/**
 * Executes the 'go-ios' command to get all installed apps and returns the output as a JSON object.
 *
 * @returns {Promise<any>} A promise that resolves to a JSON object representing all installed apps. If an error occurs, it logs the error and returns null.
 */
async function getInstalledApps() {
    try {
        const { stdout } = await execPromisified('bin/go-ios apps --list');
        const lines = stdout.split('\n').slice(1); // Skip the first line
        const apps = lines.map(line => {
            const [id, ...titleParts] = line.split(' ');
            const title = titleParts.join(' ');
            return { id, title };
        })
            .filter(app => app.id !== '');
        return apps;
    }
    catch (error) {
        console.error(`Error executing command: ${error}`);
        return null;
    }
}
exports.getInstalledApps = getInstalledApps;
/**
 * Activates an app on the device.
 *
 * @param wdioClient - The WebdriverIO client.
 * @param appId - The ID of the app to activate.
 * @returns {Promise<void>} A promise that resolves when the app is activated.
 */
async function navigateToAppAsync(wdioClient, appId) {
    return wdioClient.activateApp(appId);
}
exports.navigateToAppAsync = navigateToAppAsync;
/**
 * Sends a command to the WebDriverAgent.
 *
 * @param sessionId - The session ID.
 * @param command - The command to send as a JSON object.
 * @returns {Promise<any>} A promise that resolves to the response from the WebDriverAgent.
 */
function sendWdaCommand(sessionId, command) {
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
exports.sendWdaCommand = sendWdaCommand;
function isViewKeyboardVisible(XCUIDom) {
    // This checks for the keyboard element and its visibility attribute being true.
    const keyboardVisiblePattern = /<XCUIElementTypeKeyboard[^>]+visible="true"/;
    return keyboardVisiblePattern.test(XCUIDom);
}
exports.isViewKeyboardVisible = isViewKeyboardVisible;
function isViewScrollable(XCUIDom) {
    // Check for the presence of scrollable element types in the XML string.
    const scrollableElements = ['XCUIElementTypeTable', 'XCUIElementTypeScrollView'];
    // Return true if any scrollable element types are found in the XML string.
    return scrollableElements.some(element => XCUIDom.includes(element));
}
exports.isViewScrollable = isViewScrollable;
