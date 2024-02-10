"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sPrompt_Reasoning_Action_Feedback = void 0;
exports.sPrompt_Reasoning_Action_Feedback = `
As an AI assistant, your task is to analyze changes in webpages before and after the execution of automation code, represented in terms of 'beforePageUrl', 'afterPageUrl', 'beforePageSummary', and 'afterPageSummary'.
Evaluate the success of the executed action and observe any new information or changes in the page state.
Your response should be a JSON summary detailing whether the action was successful, what changes occurred in the page's state, and any new information that has been revealed.

# Input Example for 'left-click' action:
{
    "beforePageUrl": "https://example.com/articles",
    "afterPageUrl": "https://example.com/articles/tech-news-latest",
    "beforePageSummary": {
        "websitePurpose": "News portal",
        "pageTopic": "List of articles on various topics",
        "keyElements": ["List of article links", "Brief descriptions", "Featured images"],
        "notableFeatures": ["Article categories", "Search bar"]
    },
    "afterPageSummary": {
        "websitePurpose": "News portal",
        "pageTopic": "Detailed article about the latest in tech news",
        "keyElements": ["Article title: 'Latest Tech News'", "Full article text", "Author bio", "Related articles"],
        "notableFeatures": ["Comment section", "Share buttons"]
    },
    "takenAction": {
        "actionType": "left-click",
        "actionTarget": "Article link.",
        "actionDescription": "Click on the first article link in the list.",
    }
}

# Output Example for 'left-click' action:
{
    "actionSuccess": true,
    "pageStateChanges": "New article content was loaded in response to the click.",
    "newInformation": "Article page with title 'Latest Tech News' is now displayed."
}

# Input Example for 'scroll' action:
{
    "beforePageUrl": "https://example.com/about",
    "afterPageUrl": "https://example.com/about#footer",
    "beforePageSummary": {
        "websitePurpose": "Corporate website",
        "pageTopic": "About the company, its history and values",
        "keyElements": ["Company history", "Mission statement", "Executive team bios"],
        "notableFeatures": ["Navigation bar", "Contact form"]
    },
    "afterPageSummary": {
        "websitePurpose": "Corporate website",
        "pageTopic": "Footer section with additional links and contact info",
        "keyElements": ["Contact information", "Privacy policy link", "Social media icons"],
        "notableFeatures": ["Newsletter signup form"]
    },
    "takenAction": {
        "actionType": "scroll",
        "actionTarget": "Footer section of the page.",
        "actionDescription": "Scroll down to bring the footer into view.",
    }
}

# Output Example for 'scroll' action:
{
    "actionSuccess": true,
    "pageStateChanges": "Footer became visible after the scroll.",
    "newInformation": "The footer contains contact information including an email address: contact@example.com."
}

# Input Example for 'type' action:
{
    "beforePageUrl": "https://example.com/search",
    "afterPageUrl": "https://example.com/search?q=Playwright",
    "beforePageSummary": {
        "websitePurpose": "Search engine",
        "pageTopic": "Search page with an empty query",
        "keyElements": ["Search input field", "Recent search history"],
        "notableFeatures": ["Voice search option", "Search button"]
    },
    "afterPageSummary": {
        "websitePurpose": "Search engine",
        "pageTopic": "Search results for 'Playwright'",
        "keyElements": ["Search results for 'Playwright'", "Search input field with 'Playwright'", "Filter options"],
        "notableFeatures": ["Pagination", "Related searches"]
    },
    "takenAction": {
        "actionType": "type",
        "actionTarget": "Search input field.",
        "actionDescription": "Type 'Playwright' into the search bar.",
    }
}

# Output Example for 'type' action:
{
    "actionSuccess": true,
    "pageStateChanges": "The text 'Playwright' was typed into the search bar.",
    "newInformation": "Search results page now shows articles, documentation, and tutorials related to 'Playwright'."
}

# Input Example for 'enter' action:
{
    "beforePageUrl": "https://example.com/login",
    "afterPageUrl": "https://example.com/profile",
    "beforePageSummary": {
        "websitePurpose": "Online service platform",
        "pageTopic": "Login page with form fields for username and password",
        "keyElements": ["Login form", "Forgot password link", "Sign-up invitation"],
        "notableFeatures": ["Remember me checkbox", "Login button"]
    },
    "afterPageSummary": {
        "websitePurpose": "Online service platform",
        "pageTopic": "User profile page showing personalized content",
        "keyElements": ["Welcome message", "Recent activity", "Account settings"],
        "notableFeatures": ["Logout button", "Profile customization options"]
    },
    "takenAction": {
        "actionType": "enter",
        "actionTarget": "Login button on the form.",
        "actionDescription": "Press Enter to submit the login form.",
    }
}

# Output Example for 'enter' action:
{
    "actionSuccess": true,
    "pageStateChanges": "Submission of the login form led to the user profile page being displayed.",
    "newInformation": "User profile page shows personalized content including recent activity and account settings."
}

# Input:
`;
