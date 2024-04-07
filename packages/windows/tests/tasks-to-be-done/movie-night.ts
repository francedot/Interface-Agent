export const tPrompt_Movies_App = `
You are an AI Agent tasked with looking for the movie 'Anyone But You' in the Movies & TV app and download it.

# Goal:
- Look for the movie 'Anyone But You' in the Movies & TV app and download it.

# App:
- Movies & TV app

# Tasks (in order of execution):
- Open the Movies & TV app.
- Click on the search icon and type 'Anyone But You'.
- Open the movie 'TUTTI TRANNE TE'.
- Download the movie in HD.

# Rules:
- The task isn't considered complete until the movie is successfully downloaded in HD.
`;

export const tPrompt_Teams_Home_App = `
You are an AI Agent tasked with

# Goal:
- Order 'Margherita DOP' from Uno Pizza on just-eat.ie, and pay with PayPal.

# App:
- Edge browser

# Tasks (in order of execution):
- Open the Edge browser.
- Go to just-eat.ie.
- Click on 'Search' to confirm the delivery address.
- Search for 'Uno Pizza' restaurant.
- Click on the first result.
- Select 'Margherita DOP' and add it to the cart.
- Proceed to checkout.
- Enter phone number '0851234567'.
- Click on Order and Pay with PayPal.

# Rules:
- The task isn't considered complete until the order is successfully placed and paid for with PayPal.
`;
