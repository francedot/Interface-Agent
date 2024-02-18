// import { NavAIGuide } from "../src/navaiguide";
// import { NavAIGuidePage } from "../src/types";
// import { readFileFromAssets, readImageBase64FromAssets } from "../src/utils";

// describe("NavAIGuide", () => {
//   let navAIGuide: NavAIGuide;

//   beforeEach(() => {
//     navAIGuide = new NavAIGuide({
//       // openAIApiKey: "API_KEY",
//     });
//   });

//   it("Textual Grounding - Go to arxiv.org, and list all the tasks in NL", async () => {

//     const inputPage = await NavAIGuidePage.create({
//       url: 'https://arxiv.org/abs/2312.13298',
//       domContent: await readFileFromAssets("test-page-dom.html"),
//       screens: [await readImageBase64FromAssets("test-screen.png")]
//     });

//     const nextAction = await navAIGuide.predictNextNLAction({
//       page: inputPage,
//       endGoal: "Download the paper in PDF format",
//       mode: "textual",
//     });

//     console.log(nextAction);
//   });

//   it("Visual Grounding - Go to arxiv.org, and list all the tasks in NL", async () => {

//     const inputPage = await NavAIGuidePage.create({
//       url: 'https://arxiv.org/abs/2312.13298',
//       domContent: await readFileFromAssets("test-page-dom.html"),
//       screens: [await readImageBase64FromAssets("test-screen.png")]
//     });

//     const nextAction = await navAIGuide.predictNextNLAction({
//       page: inputPage,
//       endGoal: "Download the paper in PDF format",
//       mode: "visual",
//     });

//     console.log(nextAction);
//   });

//   it("Go to arxiv.org, ask to download the paper, and list all the matching tasks in NL", async () => {

//     const inputPage = await NavAIGuidePage.create({
//       url: 'https://arxiv.org/abs/2312.13298',
//       domContent: await readFileFromAssets("test-page-dom.html"),
//       screens: [await readImageBase64FromAssets("test-screen.png")]
//     });

//     const nextAction = await navAIGuide.predictNextNLAction({
//       page: inputPage,
//       endGoal: "Download the paper in PDF format",
//     });
  
//     console.log(nextAction);
//   });

//   it("Go to arxiv.org, query 'Download the paper in PDF' and infer the coded tasks", async () => {

//     const inputPage = await NavAIGuidePage.create({
//       url: 'https://arxiv.org/abs/2312.13298',
//       domContent: await readFileFromAssets("test-page-dom.html"),
//       screens: [await readImageBase64FromAssets("test-screen.png")]
//     });

//     const nextAction = await navAIGuide.predictNextNLAction({
//       page: inputPage,
//       endGoal: "Download the paper in PDF format",
//     });
  
//     const codeActions = await navAIGuide.generateCodeActions({
//       page: inputPage,
//       nextAction: nextAction,
//       endGoal: "Download the paper in PDF format"
//     });
  
//     console.log(codeActions);
//   });

// });
