import prompts from 'prompts';
import { WindowsAgent } from '@interface-agent/windows';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({
  path: path.resolve(__dirname, '../', '.env.local'),
});

const main = async () => {
  const iAgent = new WindowsAgent();
  await iAgent.initAsync();

  iAgent.onClarifyingInfoRequested = async (clarifyingInfo) => {
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
    message: 'InterfaceAgent: your AI assistant for Windows. How can I help you today?'
  });

  const query = userResponse.query;
  await iAgent.runAsync({ query });

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

  // const results = await InterfaceAgent.runFromPlanAsync({
  //   plan: movieNightPlan
  // });

  // console.log(results);
};

main();
