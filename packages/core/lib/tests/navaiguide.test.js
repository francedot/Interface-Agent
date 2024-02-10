"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const navaiguide_1 = require("../navaiguide");
const types_1 = require("../types");
const utils_1 = require("../utils");
describe("NavAIGuide", () => {
    let navAIGuide;
    beforeEach(() => {
        navAIGuide = new navaiguide_1.NavAIGuide({
        // openAIApiKey: "API_KEY",
        });
    });
    it("Textual Grounding - Go to arxiv.org, and list all the tasks in NL", async () => {
        const inputPage = await types_1.NavAIGuidePage.create({
            url: 'https://arxiv.org/abs/2312.13298',
            domContent: await (0, utils_1.readFileFromAssets)("test-page-dom.html"),
            screens: [await (0, utils_1.readImageBase64FromAssets)("test-screen.png")]
        });
        const nextAction = await navAIGuide.predictNextNLAction({
            page: inputPage,
            endGoal: "Download the paper in PDF format",
            mode: "textual",
        });
        console.log(nextAction);
    });
    it("Visual Grounding - Go to arxiv.org, and list all the tasks in NL", async () => {
        const inputPage = await types_1.NavAIGuidePage.create({
            url: 'https://arxiv.org/abs/2312.13298',
            domContent: await (0, utils_1.readFileFromAssets)("test-page-dom.html"),
            screens: [await (0, utils_1.readImageBase64FromAssets)("test-screen.png")]
        });
        const nextAction = await navAIGuide.predictNextNLAction({
            page: inputPage,
            endGoal: "Download the paper in PDF format",
            mode: "visual",
        });
        console.log(nextAction);
    });
    it("Go to arxiv.org, ask to download the paper, and list all the matching tasks in NL", async () => {
        const inputPage = await types_1.NavAIGuidePage.create({
            url: 'https://arxiv.org/abs/2312.13298',
            domContent: await (0, utils_1.readFileFromAssets)("test-page-dom.html"),
            screens: [await (0, utils_1.readImageBase64FromAssets)("test-screen.png")]
        });
        const nextAction = await navAIGuide.predictNextNLAction({
            page: inputPage,
            endGoal: "Download the paper in PDF format",
        });
        console.log(nextAction);
    });
    it("Go to arxiv.org, query 'Download the paper in PDF' and infer the coded tasks", async () => {
        const inputPage = await types_1.NavAIGuidePage.create({
            url: 'https://arxiv.org/abs/2312.13298',
            domContent: await (0, utils_1.readFileFromAssets)("test-page-dom.html"),
            screens: [await (0, utils_1.readImageBase64FromAssets)("test-screen.png")]
        });
        const nextAction = await navAIGuide.predictNextNLAction({
            page: inputPage,
            endGoal: "Download the paper in PDF format",
        });
        const codeActions = await navAIGuide.generateCodeActions({
            page: inputPage,
            nextAction: nextAction,
            endGoal: "Download the paper in PDF format"
        });
        console.log(codeActions);
    });
});
