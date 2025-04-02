# SoZayn Digital Era - Button Fix

This package fixes the button functionality on the SoZayn Digital Era landing page without changing the design.

## What's Included

- `button-fix.js`: JavaScript that adds proper auth page redirection to all buttons
- `server.js`: Robust Express server that serves static files with multiple path checking
- `Procfile`: Heroku configuration file
- `package.json`: Node.js project configuration

## How to Use

### Option 1: Deploy to Heroku

1. Create a new Heroku app or use your existing app
2. Initialize a Git repository (if not already done):
   ```
   git init
   git add .
   git commit -m "Button fix implementation"
   ```
3. Set Heroku as remote and push:
   ```
   heroku git:remote -a your-app-name
   git push heroku master --force
   ```

### Option 2: Manual Implementation

1. Copy the `button-fix.js` file to your website's static files directory
2. Add this line to your `index.html` file, right before the closing `</body>` tag:
   ```html
   <script src="button-fix.js"></script>
   ```
3. Deploy your updated files to your hosting provider

## What This Fix Does

- Makes "Get Started" buttons redirect to `/auth?tab=register`
- Makes "Sign in" buttons redirect to `/auth?tab=login`
- Makes "Start connecting now" button redirect to `/auth?tab=register`
- Makes "View Dashboard" button redirect to `/auth?tab=login`
- Makes "Create account" button redirect to `/auth?tab=register`

## Important Notes

This fix does not change the visual design of your landing page. It only adds the necessary JavaScript to make the buttons work correctly.