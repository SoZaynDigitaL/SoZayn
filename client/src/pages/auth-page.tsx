import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Eye, EyeOff, Loader2 } from "lucide-react";

// Login schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Registration schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  shopifyDomain: z.string().optional(),
  shopifyApiKey: z.string().optional(),
  shopifyApiSecret: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Debug logs for auth state
  useEffect(() => {
    console.log("Auth page mounted, user state:", user ? "logged in" : "not logged in");
    
    if (user) {
      console.log("User already logged in, preparing to redirect");
      setIsRedirecting(true);
    }
    
    return () => {
      console.log("Auth page unmounted");
    };
  }, [user]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      shopifyDomain: "",
      shopifyApiKey: "",
      shopifyApiSecret: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    console.log("Login form submitted:", { email: data.email, password: "***REDACTED***" });
    
    try {
      await loginMutation.mutateAsync(data);
      console.log("Login mutation completed successfully");
    } catch (error) {
      console.error("Login mutation failed:", error);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    console.log("Register form submitted:", { 
      email: data.email,
      name: data.name,
      // Don't log sensitive information
      password: "***REDACTED***",
      confirmPassword: "***REDACTED***",
      shopifyDomain: data.shopifyDomain,
      shopifyApiKey: data.shopifyApiKey ? "***PRESENT***" : "***EMPTY***",
      shopifyApiSecret: data.shopifyApiSecret ? "***PRESENT***" : "***EMPTY***"
    });
    
    try {
      await registerMutation.mutateAsync(data);
      console.log("Registration mutation completed successfully");
    } catch (error) {
      console.error("Registration mutation failed:", error);
    }
  };

  // Redirect when authenticated
  useEffect(() => {
    if (user && isRedirecting) {
      // Small delay to ensure the redirect happens after state updates
      const redirectTimer = setTimeout(() => {
        if (user.isAdmin) {
          setLocation("/admin");
        } else {
          setLocation("/dashboard");
        }
      }, 300);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, isRedirecting, setLocation]);

  if (user && isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600 mb-2">SoZayn Digital Era</h1>
          <p className="text-gray-600">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        {isLogin ? (
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...loginForm.register("email")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email address"
              />
              {loginForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...loginForm.register("password")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing in...
                </span>
              ) : (
                "Login"
              )}
            </button>
            
            {loginMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                {(loginMutation.error as Error)?.message || "Failed to login. Please try again."}
              </div>
            )}
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                {...registerForm.register("name")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
              />
              {registerForm.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.name.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                {...registerForm.register("email")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email address"
              />
              {registerForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...registerForm.register("password")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
              {registerForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                {...registerForm.register("confirmPassword")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm password"
              />
              {registerForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            
            <div className="space-y-4 pt-2">
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-gray-700">
                  Shopify Store Details (Optional)
                </summary>
                <div className="pt-3 space-y-3">
                  <div>
                    <label htmlFor="shopifyDomain" className="block text-sm font-medium text-gray-700 mb-1">
                      Shopify Domain
                    </label>
                    <input
                      id="shopifyDomain"
                      type="text"
                      {...registerForm.register("shopifyDomain")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="yourstorename.myshopify.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="shopifyApiKey" className="block text-sm font-medium text-gray-700 mb-1">
                      Shopify API Key
                    </label>
                    <input
                      id="shopifyApiKey"
                      type="text"
                      {...registerForm.register("shopifyApiKey")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="API Key"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="shopifyApiSecret" className="block text-sm font-medium text-gray-700 mb-1">
                      Shopify API Secret
                    </label>
                    <input
                      id="shopifyApiSecret"
                      type="text"
                      {...registerForm.register("shopifyApiSecret")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="API Secret"
                    />
                  </div>
                </div>
              </details>
            </div>
            
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registerMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating account...
                </span>
              ) : (
                "Register"
              )}
            </button>
            
            {registerMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                {(registerMutation.error as Error)?.message || "Failed to create account. Please try again."}
              </div>
            )}
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Debug section - help us diagnose any issues */}
        <div className="mt-8 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Debug Information</h3>
          <div className="text-xs text-gray-600">
            <p>Login mutation state: {loginMutation.isPending ? 'pending' : loginMutation.isError ? 'error' : loginMutation.isSuccess ? 'success' : 'idle'}</p>
            <p>Register mutation state: {registerMutation.isPending ? 'pending' : registerMutation.isError ? 'error' : registerMutation.isSuccess ? 'success' : 'idle'}</p>
            <p>User state: {user ? `Logged in as ${user.email}` : 'Not logged in'}</p>
            <p>Token in localStorage: {localStorage.getItem('auth_token') ? 'Present' : 'Not present'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}