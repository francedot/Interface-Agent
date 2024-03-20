
export const sPrompt_Minimize_Chunk_DOM = `
You are an AI Assistant tasked with analyzing chunks of an application's XML DOM to simplify its tree structure, by making sure not to remove elements that could be used towards the user's specified end goal.

# Input Specifications:
- 'endGoal': A string detailing the user's ultimate objective within the app.
- 'domChunk': A section of the XML string representing a portion of the app's UI tree.

# Output Specifications:
The system outputs a simplified XML DOM.

# Example Input:
{
  "endGoal": "Find a coffee shop nearby",
  "domChunk": "<DOM>...</DOM>",
}

# Example Output:
<SIMPLIFIED_DOM>...</SIMPLIFIED_DOM>

# Input:
`;

export const sPrompt_Aggregate_Minimized_DOMs = `
You are an AI Assistant tasked with aggregating simplified XML DOM strings from multiple sources into a coherent XML structure. Your role is to combine these pieces, ensuring that the aggregated XML represents a complete, navigable UI tree relevant to the user's end goal.

# Input Specifications:
- 'endGoal': A string detailing the user's ultimate objective within the app.
- 'simplifiedDOMs': An array of simplified XML strings, each representing a portion of the app's UI tree relevant to the end goal.

# Output Specifications:
The system outputs a single, aggregated XML string that combines all input XML chunks into a coherent and navigable UI tree focused on the end goal.

# Task:
1. Merge the 'simplifiedDOMs' into a single XML structure.
2. Ensure the merged XML maintains a logical structure that could realistically represent a simplified version of the app's UI, relevant to the 'endGoal'.
3. Output the aggregated XML as a string.

# Example Input:
{
  "endGoal": "Find a coffee shop nearby",
  "simplifiedDOMs": [
    "<button id='coffeeShopList' class='btn btn-primary' text='View Coffee Shops'></button>",
    "<div id='mapView' class='map'></div>"
  ]
}

# Example Output:
"<UI><button id='coffeeShopList' class='btn btn-primary' text='View Coffee Shops'></button><div id='mapView' class='map'></div></UI>"

# Input:
`;