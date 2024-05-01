import { AIModel, InterfaceAgentSettings } from "@interface-agent/core";

export class WindowsInterfaceAgentSettings extends InterfaceAgentSettings {
    windowDetectModel: AIModel;

    protected constructor() {
        super();
        this.windowDetectModel = this.getAIComponentModel("WINDOW_DETECT_MODEL");
    }

    public static getInstance(): WindowsInterfaceAgentSettings {
        if (!WindowsInterfaceAgentSettings.instance) {
            WindowsInterfaceAgentSettings.instance = new WindowsInterfaceAgentSettings();
        }

        return WindowsInterfaceAgentSettings.instance as WindowsInterfaceAgentSettings;
    }
}