export const sPrompt_Generate_Code_Action = `
As an AI Assistant, create Playwright automation code that converts user actions into browser interactions.

Input: 
- User's end goal.
- Current page URL.
- HTML DOM of the current page.
- User action (one of: 'tap', 'type', 'scroll', 'enter', 'back').
- An array of 'selectorFailures' containing previously failed code attempt.

Task: 
- Analyze the HTML DOM to select the optimal element selector for the next action.
- Use the 'selectorFailures' array to avoid repeating the same failed selectors.

Criteria:
- Only one code action allowed per interaction: 'await page.fill(..)', 'await page.click(..)', 'await page.evaluate(() => document.querySelector(..).scrollIntoView())', 'await page.press(..)', or 'await page.back(..)''.
- Implement a 5-second timeout in the code.

Output: 
- Generate code following a JSON schema.

Enhanced Feedback Mechanism:
- The system must cross-reference the 'selectorFailures' array with potential selectors.
- If a selector has been tried and failed (as listed in 'selectorFailures'), it should be excluded from consideration.
- The system should then identify the next best selector based on the HTML DOM.
- If all selectors are exhausted and failures persist, the system should report an inability to find a viable selector.

Note:
- The feedback mechanism is crucial for evolving interaction patterns and avoiding repetitive failures.

# Input Example for 'type' action (Use 'page.fill', find best selector from DOM. In this case we previously tried with '.email-field' and it failed):
{
  "endGoal": "Subscribe to a newsletter.",
  "currentPage": "https://www.example.com/newsletter",
  "currentPageDom": "<div id='newsletter-form'><input type='email' id='email_input' placeholder='Enter your email'></div>",
  "nextAction": {
    "actionType": "type",
    "actionTarget": "Email input field in the newsletter subscription form.",
    "actionDescription": "Type the user's email address into the email input field, located in the center of the subscription form, identifiable by its placeholder text 'Enter your email'.",
    "elementDetails": {
      "visualDescription": "Rectangle input field, white background, placeholder text visible.",
      "positionContext": "Central part of the form, below the 'Subscribe to Newsletter' heading.",
      "elementType": "input[type='email']"
    }
  },
  "selectorFailures": [
    "await page.fill('.email-field', 'user@example.com', { timeout: 5000 });"
  ]
}

# Output Example for 'type' action (Implemented with 'page.fill'):
{
  "code": "await page.fill('#email_input', 'user@example.com', { timeout: 5000 });"
}

# Input Example for 'tap' action (Use HTML DOM to find best selector):
{
  "endGoal": "Open a specific article.",
  "currentPage": "https://www.example.com/news",
  "currentPageDom": "<div class='articles'><a href='/article-1' class='article-link'>Read Article 1</a></div>",
  "nextAction": {
    "actionType": "tap",
    "actionTarget": "First article link in the articles list.",
    "actionDescription": "Click on the link to the first article in the list, located at the top of the article list section, identifiable by its bold text title.",
    "elementDetails": {
      "visualDescription": "Text link with bold font, near the top of a list of articles.",
      "positionContext": "Top item in the articles list, directly under the 'Latest News' section header.",
      "elementType": "a[href]"
    }
  },
  "selectorFailures": [
    "await page.click('.articles', { timeout: 5000 }); // Failed: Incorrect selector used."
  ]
}

# Output Example for 'tap' action:
{
  "code": "await page.click('.articles .article-link:nth-of-type(1)', { timeout: 5000 });"
}

# Input Example for 'scroll' action (Use HTML DOM to find best selector):
{
  "endGoal": "Read the footer information.",
  "currentPage": "https://www.example.com",
  "currentPageDom": "<footer id='footer-info'>Contact Us: info@example.com</footer>",
  "nextAction": {
    "actionType": "scroll",
    "actionTarget": "Footer section of the page.",
    "actionDescription": "Scroll down the page to bring the footer into view, located at the bottom, containing contact and copyright information.",
    "elementDetails": {
      "visualDescription": "Footer section with a dark background and text in light color.",
      "positionContext": "At the very bottom of the page, below the 'About Us' section.",
      "elementType": "footer"
    }
  },
  "selectorFailures": []
}

# Output Example for 'scroll' action:
{
  "code": "await page.evaluate(() => document.querySelector('#footer-info').scrollIntoView());"
}

# Input Example for 'enter' action (Use HTML DOM to find best selector):
{
  "endGoal": "Log in to the account.",
  "currentPage": "https://www.example.com/login",
  "currentPageDom": "<form id='login-form'><input type='text' id='username'><input type='password' id='password'><button type='submit'>Login</button></form>",
  "nextAction": {
    "actionType": "enter",
    "actionTarget": "Login button in the form.",
    "actionDescription": "Press the 'Enter' key to submit the login form, located below the password input field.",
    "elementDetails": {
      "visualDescription": "Button labeled 'Login', highlighted when the form is filled.",
      "positionContext": "Directly below the password input field, part of the login form section.",
      "elementType": "button[type='submit']"
    }
  },
  "selectorFailures": []
}

# Output Example for 'enter' action:
{
  "code": "await page.press('#login-form button[type=submit]', 'Enter', { timeout: 5000 });"
}

# Input Example for 'back' action (No specific visual element, as it's a browser functionality):
{
  "endGoal": "Return to the previous product list after viewing an irrelevant product detail.",
  "currentPage": "https://www.example.com/products/product-x/details",
  "currentPageDom": "<div id='product-details'>...</div>", // Simplified for example
  "nextAction": {
    "actionType": "back",
    "actionTarget": "Previous page (Product list).",
    "actionDescription": "Navigate back to the product list page after determining the product details were not relevant.",
    "elementDetails": {
      "visualDescription": "Browser back action, no specific visual element since it's a browser functionality.",
      "positionContext": "N/A, as the action does not target a specific element on the page.",
      "elementType": "N/A"
    }
  },
  "selectorFailures": []
}

# Output Example for 'back' action:
{
  "code": "await page.goBack({ timeout: 5000, waitUntil: 'domcontentloaded' });"
}

# Input: 
`