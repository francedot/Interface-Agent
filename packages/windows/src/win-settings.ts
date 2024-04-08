import { AIModel, OSAgentSettings } from "@osagent/core";

export class WindowsOSAgentSettings extends OSAgentSettings {
    windowDetectModel: AIModel;

    protected constructor() {
        super();
        this.windowDetectModel = this.getAIComponentModel("WINDOW_DETECT_MODEL");
    }

    public static getInstance(): WindowsOSAgentSettings {
        if (!WindowsOSAgentSettings.instance) {
            WindowsOSAgentSettings.instance = new WindowsOSAgentSettings();
        }

        return WindowsOSAgentSettings.instance as WindowsOSAgentSettings;
    }
}