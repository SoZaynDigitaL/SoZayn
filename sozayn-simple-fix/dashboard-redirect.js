/**
 * SoZayn Digital Era - Dashboard Redirect
 * 
 * This script automatically redirects authenticated users to the dashboard
 * when they navigate to the homepage or protected routes.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is authenticated
  const checkAuth = function() {
    const userData = localStorage.getItem('sozayn_user');
    const token = localStorage.getItem('sozayn_token');
    
    if (userData && token) {
      // User is logged in, check if we're on a page that should redirect
      const currentPath = window.location.pathname;
      
      // Pages that should redirect to dashboard if logged in
      const publicPages = ['/', '/index.html', '/auth', '/auth.html'];
      
      if (publicPages.includes(currentPath)) {
        console.log('Authenticated user detected, redirecting to dashboard');
        window.location.href = '/dashboard';
        return true;
      }
    } else {
      // User is not logged in, check if we're on a protected page
      const currentPath = window.location.pathname;
      
      // Protected pages that require authentication
      if (currentPath.startsWith('/dashboard') || 
          currentPath.startsWith('/admin') || 
          currentPath.startsWith('/settings')) {
        
        console.log('Unauthenticated user on protected page, redirecting to auth');
        window.location.href = '/auth.html';
        return true;
      }
    }
    
    return false;
  };
  
  // Run auth check immediately
  checkAuth();
});