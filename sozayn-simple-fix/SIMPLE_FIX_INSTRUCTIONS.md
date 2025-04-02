# SoZayn Digital Era - Simple Fix Instructions

Follow these steps to update your Heroku deployment with the button fixes and standalone auth page.

## What This Fix Includes

1. A standalone `auth.html` page that matches your site's design
2. A `fix-buttons.js` script that redirects `/auth` navigation to the standalone auth page
3. An enhanced `simple-server.js` that injects the fix script and serves the auth page

## Deployment Steps

1. Download these files from Replit:
   - `simple-server.js`
   - `auth.html`
   - `fix-buttons.js`
   - `Procfile`

2. Create a new directory for your fixed deployment:
   ```
   mkdir sozayn-deploy
   cd sozayn-deploy
   ```

3. Copy the downloaded files to your new directory.

4. Initialize a Git repository:
   ```
   git init
   ```

5. Create a package.json file:
   ```
   echo '{
     "name": "sozayn-digital-era",
     "version": "1.0.0",
     "description": "SoZayn Digital Era - Shopify to Delivery service middleware",
     "main": "simple-server.js",
     "dependencies": {
       "express": "^4.18.2"
     },
     "engines": {
       "node": "20.x"
     }
   }' > package.json
   ```

6. Create a new dist directory and copy your built files there:
   ```
   mkdir dist
   ```

7. Copy your built frontend files to the dist directory (from your existing app).

8. Add all files to Git:
   ```
   git add .
   git commit -m "Fix for auth navigation and standalone auth page"
   ```

9. Create a new Heroku app or use your existing one:
   ```
   # For existing app
   heroku git:remote -a sozayndigital
   ```

10. Push to Heroku:
    ```
    git push heroku main
    ```

11. Verify your deployment:
    ```
    heroku open
    ```

## Verification Steps

1. Visit your homepage and click any login/signup buttons
2. You should be redirected to the standalone auth page
3. Try both the login and register tabs
4. Verify the design matches your application's theme
5. Test logging in with one of your test accounts

If you encounter any issues, check the Heroku logs:
```
heroku logs --tail
```