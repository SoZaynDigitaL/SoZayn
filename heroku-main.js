// A simplified client-side entry point for Heroku
// This is designed to provide basic functionality when the main
// module resolution fails in the Heroku environment

document.addEventListener('DOMContentLoaded', () => {
  // Output status message for debugging on Heroku
  console.log('Loaded heroku-main.js fallback script');
  
  // Create a placeholder element if the React app fails to load
  const appElement = document.getElementById('root');
  
  if (!appElement || !appElement.childElementCount) {
    console.log('Found root element, attempting to render React app');
    // React app loaded successfully
  } else {
    console.warn('React app failed to load, showing fallback content');
    
    // Create fallback content
    const fallbackDiv = document.createElement('div');
    fallbackDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    fallbackDiv.style.maxWidth = '800px';
    fallbackDiv.style.margin = '40px auto';
    fallbackDiv.style.padding = '20px';
    fallbackDiv.style.textAlign = 'center';
    
    fallbackDiv.innerHTML = `
      <h1 style="font-size: 2rem; margin-bottom: 1rem; color: #333;">Digital Era - Delivery Service</h1>
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="font-size: 1.5rem; margin-bottom: 0.75rem; color: #4b5563;">Application is Starting</h2>
        <p style="color: #6b7280; margin-bottom: 1rem;">
          The application is currently initializing. This may take a minute or two on first load.
        </p>
        <p style="color: #6b7280;">
          If this message persists, please contact support at <strong>admin@sozayn.com</strong>.
        </p>
      </div>
      <button id="reload-btn" style="
        background-color: #2563eb;
        color: white;
        font-weight: 500;
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
      ">
        Reload Application
      </button>
    `;
    
    // Append to body or replace the root element's contents
    if (appElement) {
      appElement.innerHTML = '';
      appElement.appendChild(fallbackDiv);
    } else {
      document.body.appendChild(fallbackDiv);
    }
    
    // Add reload functionality
    document.getElementById('reload-btn').addEventListener('click', () => {
      window.location.reload();
    });
  }
});