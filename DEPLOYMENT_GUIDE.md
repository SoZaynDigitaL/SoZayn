# SoZayn Digital Era - Deployment Guide

This guide provides comprehensive instructions for deploying the SoZayn Digital Era application to Heroku, troubleshooting common issues, and verifying the deployment.

## Prerequisites

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- Git installed
- Node.js v18 or later installed
- Basic knowledge of terminal/command line

## Quick Start Deployment

### Option 1: Using the Deployment Package (Recommended)

1. Download the `sozayn-deployment.zip` file provided.

2. Extract the zip file to a local directory:
   ```bash
   unzip sozayn-deployment.zip -d sozayn-deploy
   cd sozayn-deploy
   ```

3. Initialize a git repository:
   ```bash
   git init
   git add .
   git commit -m "Initial deployment"
   ```

4. Login to Heroku:
   ```bash
   heroku login
   ```

5. Create a new Heroku app (or use an existing one):
   ```bash
   # Create new app
   heroku create sozayndigital
   # Or link to existing app
   heroku git:remote -a sozayndigital
   ```

6. Add the PostgreSQL addon:
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

7. Set necessary environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set SESSION_SECRET=your_session_secret
   ```

8. Deploy to Heroku:
   ```bash
   git push heroku main
   ```

9. Open the application:
   ```bash
   heroku open
   ```

### Option 2: Using the Heroku Button

If the application has a proper `app.json` configured (included in the deployment package), you can also deploy with a single click using the Heroku Button.

1. Add the Heroku Button to your README.md:
   ```markdown
   [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/SoZaynDigitaL/SoZayn)
   ```

2. Clicking this button will lead to a Heroku page where you can configure and deploy the application.

## Post-Deployment Verification

### Check Application Status

After deployment, verify the application is running correctly:

1. Open the application in a browser:
   ```bash
   heroku open
   ```

2. Run the health check utility:
   ```bash
   heroku run node health-check.js
   ```

3. Check the application logs:
   ```bash
   heroku logs --tail
   ```

### Common Issues and Solutions

#### Frontend Not Loading

If the frontend doesn't load properly:

1. Check server logs:
   ```bash
   heroku logs --tail
   ```

2. Verify the `dist` directory was deployed correctly:
   ```bash
   heroku run ls -la dist
   ```

3. Check health endpoint for additional diagnostics:
   ```bash
   curl https://yourapp.herokuapp.com/api/health
   ```

#### Database Connection Issues

If the application has trouble connecting to the database:

1. Check database URL:
   ```bash
   heroku config | grep DATABASE_URL
   ```

2. Verify database credentials:
   ```bash
   heroku pg:credentials:url
   ```

3. Check if migrations are needed:
   ```bash
   heroku run "node -e \"require('./health-check.js')\""
   ```

#### Node.js Version Issues

If you encounter Node.js related errors:

1. Check what version is being used:
   ```bash
   heroku run node -v
   ```

2. If needed, specify Node.js version in package.json:
   ```json
   "engines": {
     "node": "18.x"
   }
   ```

## Database Management

### Connecting to the Database

To connect to your Heroku PostgreSQL database:

```bash
heroku pg:psql
```

### Running Database Migrations

If your application requires database migrations:

1. From the health check output, determine if tables exist
2. If needed, initialize the database with:
   ```bash
   heroku run "node -e \"require('./server/db').initDb()\""
   ```

## Scaling and Monitoring

### Scaling the Application

To scale your application:

```bash
# Add more web dynos
heroku ps:scale web=2

# Scale back to one
heroku ps:scale web=1
```

### Monitoring

To monitor your application:

1. View application metrics:
   ```bash
   heroku labs:enable log-runtime-metrics
   heroku logs --tail
   ```

2. Set up Heroku application monitoring:
   ```bash
   heroku addons:create librato:development
   ```

## Custom Domain Setup

To add a custom domain:

1. Purchase and configure a domain name 
2. Add it to your Heroku app:
   ```bash
   heroku domains:add www.yourdomain.com
   ```

3. Update your domain's DNS settings with the CNAME target provided by Heroku

## Maintenance and Updates

For future updates:

1. Make changes to your local code
2. Test thoroughly
3. Commit changes and push to Heroku:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push heroku main
   ```

## Additional Resources

- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Heroku PostgreSQL](https://devcenter.heroku.com/articles/heroku-postgresql)
- [Shopify API Documentation](https://shopify.dev/docs/api)
- [Express.js Documentation](https://expressjs.com/)

## Support

For additional support, please contact the SoZayn Digital Era team.