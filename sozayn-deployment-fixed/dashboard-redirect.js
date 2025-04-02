/**
 * SoZayn Digital Era - Dashboard Redirect
 * 
 * This script automatically redirects authenticated users to the dashboard
 * when they navigate to the homepage or protected routes.
 */

(function() {
    // Check if user is authenticated
    function isAuthenticated() {
        return !!localStorage.getItem('auth_token');
    }
    
    // Determine if current page requires auth
    function isProtectedPage() {
        const path = window.location.pathname;
        // Add all protected routes here
        const protectedRoutes = [
            '/profile',
            '/settings',
            '/orders',
            '/connections',
            '/analytics'
        ];
        
        return protectedRoutes.some(route => path.startsWith(route));
    }
    
    // Determine if we are on the landing page
    function isLandingPage() {
        const path = window.location.pathname;
        return path === '/' || path === '/index.html';
    }
    
    // Determine if we are on the auth page
    function isAuthPage() {
        const path = window.location.pathname;
        return path === '/auth.html' || path === '/auth';
    }
    
    // Simple check on page load
    document.addEventListener('DOMContentLoaded', function() {
        // If the user is on auth page and already authenticated, redirect to dashboard
        if (isAuthPage() && isAuthenticated()) {
            window.location.href = '/dashboard.html';
            return;
        }
        
        // If user is on a protected page but not authenticated, redirect to auth
        if (isProtectedPage() && !isAuthenticated()) {
            window.location.href = '/auth.html';
            return;
        }
    });
})();