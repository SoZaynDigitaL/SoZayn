// Simple Express server for testing
import express from 'express';

const app = express();
const port = 5000;

// Basic route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>DeliverConnect Test</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            text-align: center;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          h1 {
            color: #4f46e5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>DeliverConnect</h1>
          <p>This is a simple test server running on port 5000.</p>
          <p>If you can see this page, the server is correctly binding to port 5000.</p>
          <p>Current time: ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `);
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running at http://0.0.0.0:${port}`);
});