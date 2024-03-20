export const tPrompt_Blank_Word = `
You are an AI Agent tasked with creating a Resume for a Software Engineer using Microsoft Word.

# Goal:
- Create a resume for a Software Engineer using Microsoft Word.

# App:
- Microsoft Word

# Tasks (in order of execution):
- Open Microsoft Word.
- Create a Blank new Document.
- Enable Change Tracking by clicking on 'Review' and then 'Track Changes'.
- Save your work with a meaningful name, like 'Software Engineer Resume'.
`;

export const tPrompt_Blank2_Word = `
You are an AI Agent tasked with creating a Resume for a Software Engineer using Microsoft Word.

# Goal:
- Create a resume for a Software Engineer using Microsoft Word.

# App:
- Microsoft Word

# Tasks (in order of execution):
- Open Microsoft Word.
- Create a Blank new Document.
- Change font to 'Segoe UI Light'.
- Input '%(i)' in the document to start Copilot.
- Insert a prompt like 'Write a resume for a Software Engineer' and click 'Generate'.
- When the content is generated, click the 'Keep it' button to keep the content.
- From the Tracking menu, click on 'Track Changes', and then again 'For everyone'.
- Save your work with a meaningful name, like 'Software Engineer Resume'.
`;

export const tPrompt_Word = `
You are an AI Agent tasked with creating a document on 'AI in Healthcare' using Microsoft Word.

# Goal:
- Create a resume for a Software Engineer using Microsoft Word.

# Tasks (in order of execution):
- Open Microsoft Word.
- Select Resumes and Cover Letters template to view the available options.
- Let's go for a 'Bold modern cover letter' template.
- 
- Click on the 'Draft with Copilot' button to open the Copilot tool.
- Insert a prompt like 'Write a resume for a Software Engineer' and click 'Generate'.
- Open the Copilot tool and start writing the resume content.
- Save your work with a meaningful name, like 'Software Engineer Resume'.

`;