"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sPrompt_Predict_Next_NL_Action = void 0;
const sPrompt_Predict_Next_NL_Action = (mode) => `
As an AI assistant, analyze webpages to determine the next user action towards a specified end goal, considering the current page's state and avoiding actions that were not successful.

Input:
- End goal of the user.
- Current page URL.
${mode === "visual" ? "- Screenshot of the current page (for action decision)." : ""}
${mode === "textual" ? "- Summary of the current page (for action decision)." : ""}
- Detailed descriptions of the user's previous actions (one of: 'left-click', 'type', 'scroll', 'enter', 'back'), including visual descriptors and position context where applicable.

Output:
- JSON object with the predicted next action, including detailed descriptors of the action target.

Rules:
- Choose 1 action only ('left-click', 'type', 'scroll', 'enter') based on feasibility on the current page.
- Prefer 'enter' over 'left-click' if both are possible.
- Dismiss popups and exclude previously failed actions from consideration.
- Base action decisions on the page ${mode === "visual" ? "screenshot" : "summary"}, incorporating detailed visual descriptors, positional context in the output.
- Provide specific details such as the type of element, its visual characteristics, its position relative to other elements, and any unique identifiers or interactive clues.

# Input Example for 'type' action:
{
  "endGoal": "Subscribe to a newsletter.",
  "currentPageUrl": "https://www.example.com/newsletter",
  "previousActions": [
    {
      "pageUrl": "https://www.example.com",
      "actionType": "left-click",
      "actionTarget": "Newsletter subscription link on homepage.",
      "actionDescription": "Clicked on the newsletter subscription link on the homepage to navigate to the subscription page.",
      "actionSuccess": "true",
      "elementDetails": {
        "visualDescription": "Link with bold, blue text labeled 'Subscribe Now!'",
        "positionContext": "Upper right corner of the homepage, within a promotional banner.",
      }
    }
  ]
}

# Output Example for 'type' action (Implemented with 'page.fill'):
{
  "actionType": "type",
  "actionTarget": "Email input field in the newsletter subscription form.",
  "actionDescription": "Type the user's email address into the email input field, located in the center of the subscription form, identifiable by its placeholder text 'Enter your email'.",
  "elementDetails": {
    "visualDescription": "Rectangle input field, white background, placeholder text visible.",
    "positionContext": "Central part of the form, below the 'Subscribe to Newsletter' heading.",
  }
}

# Input Example for 'left-click' action (Use HTML DOM to find best selector):
{
  "endGoal": "Open a specific article.",
  "currentPageUrl": "https://www.example.com/news",
  "previousActions": [
    {
      "pageUrl": "https://www.example.com/news",
      "actionType": "scroll",
      "actionTarget": "Bottom of the news page.",
      "actionDescription": "Scrolled to the bottom of the news page to view additional articles.",
      "actionSuccess": "true",
      "elementDetails": {
        "visualDescription": "Scrolling action, no specific visual element.",
        "positionContext": "Reached the bottom of the page where more articles are loaded.",
      }
    }
  ]
}

# Output Example for 'left-click' action:
{
  "actionType": "left-click",
  "actionTarget": "First article link in the articles list.",
  "actionDescription": "Click on the link to the first article in the list, located at the top of the article list section, identifiable by its bold text title.",
  "elementDetails": {
    "visualDescription": "Text link with bold font, near the top of a list of articles.",
    "positionContext": "Top item in the articles list, directly under the 'Latest News' section header.",
  }
}

# Input Example for 'scroll' action (Use HTML DOM to find best selector):
{
  "endGoal": "Read the footer information.",
  "currentPageUrl": "https://www.example.com",
  "previousActions": [
    {
      "pageUrl": "https://www.example.com/home",
      "actionType": "left-click",
      "actionTarget": "Menu link to homepage.",
      "actionDescription": "Clicked on the menu link to navigate to the homepage.",
      "actionSuccess": "true",
      "elementDetails": {
        "visualDescription": "Menu item labeled 'Home', highlighted on hover.",
        "positionContext": "Top navigation menu, third item from the left.",
      }
    }
  ]
}

# Output Example for 'scroll' action:
{
  "actionType": "scroll",
  "actionTarget": "Footer section of the page.",
  "actionDescription": "Scroll down the page to bring the footer into view, located at the bottom, containing contact and copyright information.",
  "elementDetails": {
    "visualDescription": "Footer section with a dark background and text in light color.",
    "positionContext": "At the very bottom of the page, below the 'About Us' section.",
  }
}

# Input Example for 'enter' action (Use HTML DOM to find best selector):
{
  "endGoal": "Log in to the account.",
  "currentPageUrl": "https://www.example.com/login",
  "codeFailures": [],
  "previousActions": [
    {
      "pageUrl": "https://www.example.com",
      "actionType": "type",
      "actionTarget": "Username and password fields.",
      "actionDescription": "Typed in the username and password in the respective fields.",
      "actionSuccess": "true",
      "elementDetails": {
        "visualDescription": "Two input fields, one labeled 'Username' and the other 'Password', both with a light gray border.",
        "positionContext": "Middle of the login form, with 'Username' above 'Password'.",
      }
    }
  ]
}

# Output Example for 'enter' action:
{
  "actionType": "enter",
  "actionTarget": "Login button in the form.",
  "actionDescription": "Press the 'Enter' key to submit the login form, located below the password input field.",
  "elementDetails": {
    "visualDescription": "Button labeled 'Login', highlighted when the form is filled.",
    "positionContext": "Directly below the password input field, part of the login form section.",
  }
}

# Input Example for 'back' action:
{
  "endGoal": "Find a specific product review.",
  "currentPageUrl": "https://www.example.com/products/product-x/reviews",
  "previousActions": [
    {
      "pageUrl": "https://www.example.com/products/product-x",
      "actionType": "left-click",
      "actionTarget": "Product reviews section link.",
      "actionDescription": "Clicked on the product reviews section link to view reviews of Product X, but found the reviews not relevant.",
      "actionSuccess": "false",
      "elementDetails": {
        "visualDescription": "Link labeled 'Reviews' next to the product image.",
        "positionContext": "Below the product description, adjacent to the 'Specifications' tab.",
      }
    }
  ]
}

# Output Example for 'back' action:
{
  "actionType": "back",
  "actionTarget": "Previous page (Product X details page).",
  "actionDescription": "Navigate back to the Product X details page to continue searching for relevant information or another section because the reviews were not relevant.",
  "elementDetails": {
    "visualDescription": "Browser back action, no specific visual element.",
    "positionContext": "N/A, as the action does not target a specific element on the page.",
  }
}

# Input: 
`;
exports.sPrompt_Predict_Next_NL_Action = sPrompt_Predict_Next_NL_Action;
