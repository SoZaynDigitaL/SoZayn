/**
 * SoZayn Digital Era - Button Fix
 * 
 * This script fixes the navigation buttons by intercepting clicks to /auth
 * and redirecting them to the appropriate standalone auth page.
 */

(function() {
  document.addEventListener('click', function(event) {
    // Find the closest anchor element if the click was on a child element
    let el = event.target;
    while (el && el.tagName !== 'A') {
      el = el.parentElement;
    }
    
    // If we found an anchor and it should be redirected
    if (el && shouldRedirect(el)) {
      event.preventDefault();
      
      // Get the auth tab if specified
      const tab = getAuthTab(el);
      
      // Redirect to the auth page with the appropriate tab
      window.location.href = '/auth.html' + (tab ? '?tab=' + tab : '');
    }
  });
  
  function shouldRedirect(el) {
    // Check if this is a link to the auth page
    const href = el.getAttribute('href');
    return href === '/auth' || 
           href === '/auth.html' || 
           href === '#auth' ||
           href === '#login' ||
           href === '#register' ||
           el.classList.contains('auth-link') ||
           el.textContent.trim().toLowerCase() === 'sign in' ||
           el.textContent.trim().toLowerCase() === 'get started';
  }
  
  function getAuthTab(el) {
    // Determine which tab to show based on the link
    const href = el.getAttribute('href');
    const text = el.textContent.trim().toLowerCase();
    
    if (href === '#register' || 
        text === 'get started' || 
        text === 'sign up' ||
        text === 'register' ||
        el.classList.contains('register-link')) {
      return 'register';
    } else if (href === '#login' || 
               text === 'sign in' || 
               text === 'login' ||
               el.classList.contains('login-link')) {
      return 'login';
    }
    
    // No specific tab
    return '';
  }
})();