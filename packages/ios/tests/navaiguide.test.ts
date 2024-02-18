import { AppiumiOSAgent } from "../src/appium-ios-agent";

describe("Appium-iOS Device Interaction Tests", function() {

  let navAIGuideAgent: AppiumiOSAgent;

  before(async function() {
    navAIGuideAgent = new AppiumiOSAgent({
      appiumBaseUrl: 'http://127.0.0.1',
      appiumPort: 4723,
      iOSVersion: "17.3.0",
      deviceUdid: "00008030-00120DA4110A802E"
    });
  });

  beforeEach(async function() {
    // This runs before each test. Initializing the Appium client here if needed for each test.
  });

  afterEach(async function() {
    // This runs after each test. Clean up resources, like closing the Appium session.
  });

  const findResearchPaperQuery = "Help me view the research paper titled 'Set-of-Mark Prompting Unleashes Extraordinary Visual Grounding in GPT-4V' and download its pdf.";
  it(findResearchPaperQuery, async function() {
    // Perform assertions or checks here as necessary.
    // Example: await expect(client).toHaveAppInstalled('com.apple.Preferences');
    // Note: The above assertion depends on the assertion library being used.

    const results = await navAIGuideAgent.runAsync({
      query: findResearchPaperQuery
    });
    
    for (const result of results) {
      console.log(result);
    }

  });

  // Additional tests would go here.

  after(async function() {
    // Cleanup code for the entire test suite, if any.
  });
});
