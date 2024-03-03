import { spawn } from "child_process";
import { iOSAgent } from "../../ios/src/ios-agent";

describe("Appium-iOS Device Interaction Tests", function() {

  let NavAIGuideBaseAgent: iOSAgent;

  before(async function() {

    // const startiOSDaemon = spawn('./scripts/run-wda.sh', {
    //   detached: true,
    //   stdio: 'ignore'
    // });
    // startiOSDaemon.unref();

    // await new Promise((resolve) => setTimeout(resolve, 10000));

    NavAIGuideBaseAgent = new iOSAgent({
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

  const fitnessPlannerQuery = "I need some help for running a 30-day fitness challenge.";
  it(fitnessPlannerQuery, async function() {
    const results = await NavAIGuideBaseAgent.runAsync({
      query: fitnessPlannerQuery
    });
  });

  const musicNightPlannerQuery = "Let's plan a music night for this Saturday.";
  it(musicNightPlannerQuery, async function() {
    const results = await NavAIGuideBaseAgent.runAsync({
      query: musicNightPlannerQuery
    });
  });

  const wicklowTripPlannerQuery = "Let's plan a trip to Cork for this weekend.";
  it(wicklowTripPlannerQuery, async function() {
    const results = await NavAIGuideBaseAgent.runAsync({
      query: wicklowTripPlannerQuery
    });
  });

  const findLatestMGKQuery = "I'd like to listen the latest MGK single called 'don't let me go' on Spotify.";
  it(findLatestMGKQuery, async function() {
    const results = await NavAIGuideBaseAgent.runAsync({
      query: findLatestMGKQuery
    });
  });

  const sendMessageWhatsappQuery = "Send a message to friend on Instagram telling her 'Bella Ciao'";
  it(sendMessageWhatsappQuery, async function() {
    const results = await NavAIGuideBaseAgent.runAsync({
      query: sendMessageWhatsappQuery
    });
  });

  const turnOffLocationServiceQuery = "Turn off location services in iOS Settings.";
  it(turnOffLocationServiceQuery, async function() {
    const results = await NavAIGuideBaseAgent.runAsync({
      query: turnOffLocationServiceQuery
    });
  });

  const youtubeQuery = "Check the latest news on AI from 'Matt Wolfe' on YouTube.";
  it(youtubeQuery, async function() {
    const results = await NavAIGuideBaseAgent.runAsync({
      query: youtubeQuery
    });
  });

  const twitterQuery = "Check the latest news on AI from 'Matt Wolfe' on Twitter.";
  it(twitterQuery, async function() {
    const results = await NavAIGuideBaseAgent.runAsync({
      query: twitterQuery
    });
  });

  after(async function() {
    // Cleanup code for the entire test suite, if any.
  });
});
