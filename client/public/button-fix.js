// SoZayn Button Fix - Only adds redirects without changing theme
document.addEventListener('DOMContentLoaded', function() {
  console.log("SoZayn button fix script loaded");
  
  // Function to update button links
  function updateButtons() {
    // Update all "Sign in" buttons
    document.querySelectorAll('a').forEach(function(link) {
      if (link.textContent.trim() === 'Sign in') {
        link.href = "/auth?tab=login";
        console.log("Fixed Sign in button");
      }
    });
    
    // Update all "Get Started" buttons
    document.querySelectorAll('a').forEach(function(link) {
      if (link.textContent.trim() === 'Get Started') {
        link.href = "/auth?tab=register";
        console.log("Fixed Get Started button");
      }
    });
    
    // Update the "Start connecting now" button
    document.querySelectorAll('a').forEach(function(link) {
      if (link.textContent.includes('Start connecting now')) {
        link.href = "/auth?tab=register";
        console.log("Fixed Start connecting now button");
      }
    });
    
    // Update the "View Dashboard" button
    document.querySelectorAll('a').forEach(function(link) {
      if (link.textContent.trim() === 'View Dashboard') {
        link.href = "/auth?tab=login";
        console.log("Fixed View Dashboard button");
      }
    });
    
    // Update "Create account" button
    document.querySelectorAll('a').forEach(function(link) {
      if (link.textContent.trim() === 'Create account') {
        link.href = "/auth?tab=register";
        console.log("Fixed Create account button");
      }
    });
    
    // Fix pricing page "Get Started" buttons
    document.querySelectorAll('.pricing-card a.btn').forEach(function(link) {
      if (link.textContent.trim() === 'Get Started') {
        link.href = "/auth?tab=register";
        console.log("Fixed pricing card Get Started button");
      }
    });
  }
  
  // Run the button fix immediately
  updateButtons();
  
  // Also run after a short delay to handle any dynamically loaded content
  setTimeout(updateButtons, 1000);
});