/**
 * SoZayn Digital Era - Button Fix
 * 
 * This script fixes the navigation buttons by intercepting clicks to /auth
 * and redirecting them to the appropriate standalone auth page.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get all navigation buttons and links
  const buttons = document.querySelectorAll('a, button');
  
  // Function to determine if element should trigger auth redirection
  function shouldRedirect(el) {
    // Check for links to /auth
    if (el.tagName === 'A' && (el.href.endsWith('/auth') || el.href.includes('/auth?'))) {
      return true;
    }
    
    // Check for buttons that might navigate to auth
    if (el.tagName === 'BUTTON') {
      const text = el.textContent.trim().toLowerCase();
      if (text.includes('sign in') || 
          text.includes('login') || 
          text.includes('log in') || 
          text.includes('get started') || 
          text.includes('register') || 
          text.includes('sign up')) {
        return true;
      }
    }
    
    return false;
  }
  
  // Function to get the appropriate auth tab
  function getAuthTab(el) {
    const text = el.textContent.trim().toLowerCase();
    
    if (text.includes('sign in') || text.includes('login') || text.includes('log in')) {
      return 'login';
    }
    
    if (text.includes('register') || text.includes('sign up') || text.includes('get started')) {
      return 'register';
    }
    
    // Default to login
    return 'login';
  }
  
  // Add click handlers
  buttons.forEach(function(el) {
    if (shouldRedirect(el)) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        
        const tab = getAuthTab(el);
        window.location.href = `/auth.html?tab=${tab}`;
      });
    }
  });
});