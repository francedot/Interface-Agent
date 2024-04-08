import prompts from 'prompts';
import { WindowsAgent } from '@osagent/windows';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({
  path: path.resolve(__dirname, '../', '.env.local'),
});

const main = async () => {
  const osAgent = new WindowsAgent();
  await osAgent.initAsync();

  osAgent.onClarifyingInfoRequested = async (clarifyingInfo) => {
    const userResponse = await prompts({
      type: 'text',
      name: 'clarifyingInfoAnswer',
      message: clarifyingInfo.message
    });
    clarifyingInfo.callback(userResponse.clarifyingInfoAnswer);
  }

  const userResponse = await prompts({
    type: 'text',
    name: 'query',
    message: 'OSAgent: your AI assistant for Windows. How can I help you today?'
  });

  const query = userResponse.query;
  await osAgent.runAsync({ query });

  // const movieNightPlan: ToolsetPlan = {
  //   description: "A plan for a movie night: download a movie and order some pizza",
  //   steps: [
  //     // {
  //     //   toolId: "Microsoft.ZuneVideo_8wekyb3d8bbwe",
  //     //   toolPrompt: tPrompt_Movies_App
  //     // },
  //     {
  //       toolId: "Microsoft Edge",
  //       toolPrompt: tPrompt_Edge_JustEat_App
  //     }
  //   ]
  // };

  // const results = await osAgent.runFromPlanAsync({
  //   plan: movieNightPlan
  // });

  // console.log(results);
};

main();
