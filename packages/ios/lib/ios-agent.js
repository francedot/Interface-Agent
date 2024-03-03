"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iOSAgent = void 0;
const core_1 = require("@navaiguide/core");
const webdriverio_1 = require("webdriverio");
const utils_1 = require("./utils");
const types_1 = require("./types");
const predict_next_nl_action_1 = require("./prompts/predict-next-nl-action");
const ios_action_handler_1 = require("./ios-action-handler");
const planner_apps_1 = require("./prompts/planner-apps");
/**
 * The iOSAgent class orchestrates the process of performing and reasoning about actions on a mobile screen towards achieving a specified end goal.
 */
class iOSAgent extends core_1.NavAIGuideBaseAgent {
    /**
     * Constructs a new iOSAgent instance.
     * @param fields - Configuration fields including OpenAI and AzureAI inputs and Appium configuration.
     */
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "wdioClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "appiumBaseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "appiumPort", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "iOSVersion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "deviceUdid", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "iOSActionHandler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.appiumBaseUrl = fields?.appiumBaseUrl;
        this.appiumPort = fields?.appiumPort;
        this.iOSVersion = fields?.iOSVersion;
        this.deviceUdid = fields?.deviceUdid;
    }
    /**
     * Runs the agent to achieve a specified end goal using a series of actions.
     * @param query - The query to be achieved.
     * @returns A promise resolving to an array of relevant data strings upon successfully achieving the goal.
     */
    async runAsync({ query }) {
        // TODO: if go-ios not build throw error
        // Initialize the Wdio client
        this.wdioClient = await this.initWdioAsync();
        // Get installed apps
        const apps = await (0, utils_1.getInstalledApps)();
        console.log(`Found ${apps.length} installed apps: ${apps.map(app => app.title).join("\n")}`);
        const appsPlan = await this.navAIGuide.startTaskPlanner_Agent({
            prompt: planner_apps_1.sPrompt_App_Planner,
            userQuery: query,
            appsSource: apps,
        });
        console.log(`Generated plan with ${appsPlan.steps.length} steps: ${appsPlan.description}`);
        for (const appStep of appsPlan.steps) {
            console.log(`App: ${appStep.appId}, Goal: ${appStep.appEndGoal}`);
            await this.runAppStepAsync(appStep);
        }
        return [];
    }
    async runAppStepAsync(appStep) {
        console.log(`Starting at app: ${appStep.appId}`);
        await (0, utils_1.navigateToAppAsync)(this.wdioClient, appStep.appId);
        await new Promise(resolve => setTimeout(resolve, 6000));
        let previousNavAIGuidePage = null;
        let currentNavAIGuidePage = await types_1.AppiumiOSNavAIGuidePage.fromAppiumAsync({
            wdioClient: this.wdioClient,
            location: appStep.appId
        });
        // saveBase64ImageToFile(currentNavAIGuidePage.screens[0].base64Value);
        this.iOSActionHandler = new ios_action_handler_1.iOSActionHandler(this.wdioClient, this.navAIGuide);
        const actions = [];
        while (true) {
            const nextAction = await this.navAIGuide.predictNextNLAction_Visual_Agent({
                prompt: predict_next_nl_action_1.sPrompt_Predict_Next_NL_Action,
                previousPage: previousNavAIGuidePage,
                currentPage: currentNavAIGuidePage,
                endGoal: appStep.appEndGoal,
                keyboardVisible: (0, utils_1.isViewKeyboardVisible)(currentNavAIGuidePage.domContent),
                scrollable: (0, utils_1.isViewScrollable)(currentNavAIGuidePage.domContent),
                previousActions: actions,
            });
            if (nextAction.previousActionSuccess != null) {
                console.log(`The previous action was ${nextAction.previousActionSuccess ? "" : "not "}successful: ${nextAction.previousActionSuccessExplanation}`);
            }
            console.log(`The end goal has ${nextAction.endGoalMet ? "" : "not "}been met: ${nextAction.endGoalMetExplanation}`);
            if (nextAction.endGoalMet) {
                return [];
            }
            console.log(`Predicted next probable action: ${nextAction.actionDescription}`);
            actions.push(nextAction);
            await this.iOSActionHandler.performAction(nextAction, currentNavAIGuidePage);
            // Delay for a few seconds to allow the action to take effect
            await new Promise(resolve => setTimeout(resolve, 4000));
            // saveBase64ImageToFile(currentNavAIGuidePage.screens[0].base64Value);
            const nextNavAIGuidePage = await types_1.AppiumiOSNavAIGuidePage.fromAppiumAsync({
                wdioClient: this.wdioClient,
                location: appStep.appId // Set again as the id of the app
            });
            previousNavAIGuidePage = currentNavAIGuidePage;
            currentNavAIGuidePage = nextNavAIGuidePage;
        }
    }
    async initWdioAsync() {
        const wdioBrowser = await (0, webdriverio_1.remote)({
            baseUrl: this.appiumBaseUrl,
            port: this.appiumPort,
            capabilities: {
                platformName: "iOS",
                "appium:newCommandTimeout": 50000,
                "appium:platformVersion": this.iOSVersion,
                "appium:deviceName": "(can be any value but must be set)",
                "appium:automationName": "XCUITest",
                "appium:udid": this.deviceUdid
            }
        });
        return wdioBrowser;
    }
}
exports.iOSAgent = iOSAgent;
