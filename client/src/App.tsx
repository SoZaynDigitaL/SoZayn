import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminClients from "@/pages/admin/clients";
import AdminOrders from "@/pages/admin/orders";
import ClientDashboard from "@/pages/client/dashboard";
import ClientOrders from "@/pages/client/orders";
import ClientSettings from "@/pages/client/settings";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin Routes */}
      <ProtectedRoute 
        path="/admin" 
        component={AdminDashboard} 
        requireAdmin={true} 
      />
      <ProtectedRoute 
        path="/admin/clients" 
        component={AdminClients} 
        requireAdmin={true} 
      />
      <ProtectedRoute 
        path="/admin/orders" 
        component={AdminOrders} 
        requireAdmin={true} 
      />
      
      {/* Client Routes */}
      <ProtectedRoute 
        path="/dashboard" 
        component={ClientDashboard} 
      />
      <ProtectedRoute 
        path="/orders" 
        component={ClientOrders} 
      />
      <ProtectedRoute 
        path="/settings" 
        component={ClientSettings} 
      />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
