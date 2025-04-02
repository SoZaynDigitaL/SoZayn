/**
 * SoZayn Digital Era - Button Fix
 * 
 * This script fixes the navigation buttons by intercepting clicks to /auth
 * and redirecting them to the appropriate standalone auth page.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get all buttons and links that might navigate to auth
  const authLinks = document.querySelectorAll('a[href*="/auth"]');
  const buttons = document.querySelectorAll('button');
  
  // Function to check if we should redirect
  function shouldRedirect(el) {
    // Check if it's a link to /auth
    if (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href').includes('/auth')) {
      return true;
    }
    
    // Check if it's a button with text that matches login/register keywords
    if (el.tagName === 'BUTTON' || el.classList.contains('btn')) {
      const text = el.textContent.toLowerCase();
      if (text.includes('sign in') || 
          text.includes('login') || 
          text.includes('log in') ||
          text.includes('sign up') ||
          text.includes('register') ||
          text.includes('create account') ||
          text.includes('get started')) {
        return true;
      }
    }
    
    return false;
  }
  
  // Function to determine the auth tab from element
  function getAuthTab(el) {
    const text = el.textContent.toLowerCase();
    const href = el.getAttribute('href') || '';
    
    // Check URL first
    if (href.includes('register') || href.includes('signup')) {
      return 'register';
    }
    
    // Then check text content
    if (text.includes('register') || 
        text.includes('sign up') || 
        text.includes('create account') ||
        text.includes('get started')) {
      return 'register';
    }
    
    // Default to login
    return 'login';
  }
  
  // Process all auth links
  authLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      if (shouldRedirect(link)) {
        e.preventDefault();
        const tab = getAuthTab(link);
        window.location.href = `/auth.html?tab=${tab}`;
      }
    });
  });
  
  // Process all buttons
  buttons.forEach(function(button) {
    button.addEventListener('click', function(e) {
      if (shouldRedirect(button)) {
        e.preventDefault();
        const tab = getAuthTab(button);
        window.location.href = `/auth.html?tab=${tab}`;
      }
    });
  });
  
  console.log('SoZayn Digital Era - Button fix initialized');
});