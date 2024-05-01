import { AIModel, AIModels } from "./types";
import { getEnvironmentVariable } from "./utils";

export abstract class InterfaceAgentSettings {
    protected static instance: InterfaceAgentSettings;

    ambiguityHandlingScore: number;
    toolsPlannerModel: AIModel;
    predictNextActionVisualModel: AIModel;
    generateCodeSelectorModel: AIModel;
    
    protected constructor() {
        this.ambiguityHandlingScore = parseFloat(getEnvironmentVariable("AMBIGUITY_HANDLING_SCORE") ?? "0");

        // Models
        this.toolsPlannerModel = this.getAIComponentModel("TOOLS_PLANNER_MODEL");
        this.predictNextActionVisualModel = this.getAIComponentModel("PREDICT_NEXT_ACTION_VISUAL_MODEL");
        this.generateCodeSelectorModel = this.getAIComponentModel("GENERATE_CODE_SELECTOR_MODEL");
    }

    public getAIComponentModel(aiComponent: string): AIModel {
        const modelName = getEnvironmentVariable(aiComponent); // CLAUDE_3_HAIKU
        const aiModel = AIModels.getModel(modelName);
        if (aiModel) {
            return aiModel;
        }

        throw new Error(`Model ${modelName} not found.`);
    }
}
   