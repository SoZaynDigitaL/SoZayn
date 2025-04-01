import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { InsertUser, User, LoginUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  loginMutation: UseMutationResult<{ user: User, token: string }, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<{ user: User, token: string }, Error, InsertUser>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (data: { user: User, token: string }) => {
      // Store token in localStorage for API requests
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["/api/user"], data.user);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      console.log('Registering user with data:', {
        ...userData,
        password: '***REDACTED***',
        shopifyApiKey: userData.shopifyApiKey ? '***PRESENT***' : '***EMPTY***',
        shopifyApiSecret: userData.shopifyApiSecret ? '***PRESENT***' : '***EMPTY***'
      });
      
      try {
        const res = await apiRequest("POST", "/api/register", userData);
        const data = await res.json();
        console.log('Registration successful, received data:', {
          userId: data.user?.id,
          userEmail: data.user?.email,
          hasToken: !!data.token
        });
        return data;
      } catch (err) {
        console.error('Registration request failed:', err);
        throw err;
      }
    },
    onSuccess: (data: { user: User, token: string }) => {
      console.log('Registration mutation success, storing token and user data');
      // Store token in localStorage for API requests
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["/api/user"], data.user);
      
      toast({
        title: "Registration successful",
        description: "Your account has been created",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error('Registration mutation error:', error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
      // Remove token from localStorage
      localStorage.removeItem("auth_token");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isAdmin = user?.isAdmin || false;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
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
