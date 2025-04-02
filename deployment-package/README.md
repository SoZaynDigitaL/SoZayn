# SoZayn Digital Era - Deployment Package

This package contains all necessary files to deploy the SoZayn Digital Era middleware application, which connects Shopify stores with third-party delivery services.

## Contents

- `server.js`: The Express server that serves the static frontend and handles API requests
- `dist/`: The built frontend files
- `health-check.js`: A utility to check the health of your deployed application
- `Procfile`: Instructions for Heroku on how to start the application
- `package.json`: Project configuration and dependencies

## Deployment Instructions

### Option 1: Heroku Deployment (Recommended)

1. Make sure you have the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed and logged in.

2. Create a new Heroku app (if you haven't already):
   ```bash
   heroku create sozayndigital
   ```

3. Add the PostgreSQL addon:
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set SESSION_SECRET=your_session_secret
   ```

5. Deploy this package:
   ```bash
   git init
   git add .
   git commit -m "Initial deployment"
   heroku git:remote -a sozayndigital
   git push heroku main
   ```

6. Open the application:
   ```bash
   heroku open
   ```

7. Check application health:
   ```bash
   heroku run node health-check.js
   ```

### Option 2: Alternative Deployment

If you're having trouble with Heroku deployment, you can:

1. Clone the repository to your local machine
2. Copy the contents of this deployment package into your repository
3. Commit and push the changes
4. Use Heroku CLI to deploy:
   ```bash
   git push heroku main
   ```

## Troubleshooting

If you encounter any issues:

1. Check the logs:
   ```bash
   heroku logs --tail
   ```

2. Run the health check:
   ```bash
   heroku run node health-check.js
   ```

3. Make sure all environment variables are set correctly:
   ```bash
   heroku config
   ```

4. If the app is not loading, try restarting the dynos:
   ```bash
   heroku dyno:restart
   ```

## Important Notes

- The server expects a PostgreSQL database to be configured.
- Make sure your NODE_ENV is set to 'production' in your hosting environment.
- The frontend is prebuilt in the `dist/` directory.
- Ensure your Heroku stack is set to 'heroku-20' or newer.