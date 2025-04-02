// Client-side startup script for Heroku deployment
(function() {
  const MAX_RETRIES = 5;
  const RETRY_INTERVAL = 3000; // 3 seconds
  let retries = 0;
  
  // Function to check if the application is ready
  function checkApplicationStatus() {
    fetch('/api/health')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Health check failed');
      })
      .then(data => {
        console.log('Application is ready:', data);
        window.location.reload();
      })
      .catch(error => {
        console.log('Application not ready yet:', error.message);
        retries++;
        
        if (retries < MAX_RETRIES) {
          // Update the status indicator
          const statusIndicator = document.querySelector('.status-indicator');
          if (statusIndicator) {
            statusIndicator.classList.add('loading');
          }
          
          // Try again after interval
          setTimeout(checkApplicationStatus, RETRY_INTERVAL);
        } else {
          // Max retries reached, update UI to show error
          const statusIndicator = document.querySelector('.status-indicator');
          if (statusIndicator) {
            statusIndicator.classList.remove('loading');
            statusIndicator.style.backgroundColor = '#ef4444'; // Red color
          }
          
          const cardTitle = document.querySelector('.card-title');
          if (cardTitle) {
            cardTitle.textContent = 'Application Failed to Start';
          }
          
          const cardContent = document.querySelector('.card-content');
          if (cardContent) {
            cardContent.innerHTML = `
              <p>The SoZayn Digital Era application could not start properly. This might be due to:</p>
              <ul style="list-style-type: disc; margin-left: 20px; margin-bottom: 15px;">
                <li>The server is still initializing</li>
                <li>Database connection issues</li>
                <li>Configuration problems</li>
              </ul>
              <p>Please wait a moment and try again, or contact support if the issue persists.</p>
              <button class="button" onclick="window.location.reload()">Try Again</button>
            `;
          }
        }
      });
  }
  
  // Start checking after the page loads
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(checkApplicationStatus, 2000); // Give the app 2 seconds to start
  });
})();