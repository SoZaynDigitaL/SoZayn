import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Interface for User object
interface User {
  id: number;
  email: string;
  name: string;
  shopifyDomain?: string;
  shopifyApiKey?: string;
  shopifyApiSecret?: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

// Login credentials interface
interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data interface
interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  shopifyDomain?: string;
  shopifyApiKey?: string;
  shopifyApiSecret?: string;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  loginMutation: UseMutationResult<any, Error, LoginCredentials>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<any, Error, RegisterData>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // State for user, loading state, and error
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Function to fetch the current user
  const fetchUser = async (): Promise<User | null> => {
    try {
      setIsLoading(true);
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('auth_token');
      
      // If we don't have a token, don't even attempt the request
      if (!token) {
        console.log('No auth token available, skipping user fetch');
        setIsLoading(false);
        return null;
      }
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      
      console.log('Attempting to fetch user with token');
      const res = await fetch('/api/user', {
        credentials: "include",
        headers
      });
      
      if (res.status === 401) {
        console.warn('Auth token invalid or expired');
        localStorage.removeItem('auth_token');
        setIsLoading(false);
        return null;
      }
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error fetching user: ${errorText || res.statusText}`);
        setError(new Error(errorText || res.statusText));
        setIsLoading(false);
        return null;
      }
      
      const userData = await res.json();
      console.log('User data retrieved successfully');
      setIsLoading(false);
      return userData;
    } catch (err) {
      console.error('Error in fetchUser:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setIsLoading(false);
      return null;
    }
  };
  
  // Function to refetch the user data
  const refetchUser = async () => {
    const userData = await fetchUser();
    setUser(userData);
    return userData;
  };

  // Initialize user on mount
  useEffect(() => {
    // Immediately check for user on mount
    const initializeUser = async () => {
      console.log("Initializing auth state");
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        console.log("Found token, fetching user");
        const userData = await fetchUser();
        setUser(userData);
      } else {
        console.log("No token found, skipping user fetch");
        setIsLoading(false);
      }
    };
    
    initializeUser();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log("Attempting login with:", credentials.email);
      
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
          credentials: 'include',
        });
        
        console.log("Login response status:", res.status);
        
        if (!res.ok) {
          let errorMessage = 'Login failed';
          try {
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorJson = await res.json();
              if (errorJson.message) {
                errorMessage = errorJson.message;
              }
            } else {
              errorMessage = await res.text() || res.statusText || `Error ${res.status}`;
            }
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await res.json();
        console.log("Login response data:", {
          hasUser: !!data.user,
          hasToken: !!data.token,
          user: data.user ? {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            isAdmin: data.user.isAdmin
          } : null
        });
        
        return data;
      } catch (err) {
        console.error("Error in login fetch:", err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("Login successful!");
      
      // Store token in localStorage
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        console.log("Auth token saved to localStorage");
      } else {
        console.warn("No token received in login response");
      }
      
      // Update the user data
      if (data.user) {
        setUser(data.user);
        console.log("User data updated in state:", data.user.email);
        
        // Force a reload of the application to make sure the auth state is properly recognized
        setTimeout(() => {
          window.location.href = data.user.isAdmin ? '/admin' : '/dashboard';
        }, 500);
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user?.name || data.user?.email || 'User'}!`,
      });
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
      
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      console.log("Registering new user:", userData.email);
      
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });
      
      if (!res.ok) {
        let errorMessage = 'Registration failed';
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorJson = await res.json();
            if (errorJson.message) {
              errorMessage = errorJson.message;
            }
          } else {
            errorMessage = await res.text() || res.statusText || `Error ${res.status}`;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        
        throw new Error(errorMessage);
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Registration successful!");
      
      // Store token in localStorage
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        console.log("Auth token saved to localStorage");
      }
      
      // Update the user data
      if (data.user) {
        setUser(data.user);
        console.log("User data updated in state");
      }
      
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Registration error:", error);
      
      toast({
        title: "Registration failed",
        description: error.message || "Please check your information and try again",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
      localStorage.removeItem("auth_token");
      console.log("Logged out and cleared auth token");
    },
    onSuccess: () => {
      setUser(null);
      console.log("User data cleared from state");
      
      toast({
        title: "Logged out successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      
      // Even if the server logout fails, clear the local auth state
      localStorage.removeItem("auth_token");
      setUser(null);
      
      toast({
        title: "Logout had issues",
        description: "You've been logged out locally, but there was an issue with the server: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Derive admin status from user object
  const isAdmin = user?.isAdmin || false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        isAdmin,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}