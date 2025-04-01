import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { insertUserSchema } from "@shared/schema";

// Login schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(false),
});

// Registration schema - using the shared schema directly
const registerSchema = insertUserSchema;

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  
  // If user is already logged in, redirect them
  useEffect(() => {
    if (user) {
      if (user.isAdmin) {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, setLocation]);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });
  
  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      shopifyDomain: "",
      shopifyApiKey: "",
      shopifyApiSecret: "",
      isAdmin: false,
      isActive: true
    },
  });
  
  // Submit login form
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };
  
  // Submit register form
  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Logging form data to debug
    console.log('Form data for registration:', {
      ...data,
      password: '***REDACTED***',
      confirmPassword: '***REDACTED***'
    });
    
    // Ensure empty strings for optional fields rather than undefined
    const userData = {
      email: data.email,
      password: data.password,
      name: data.name,
      shopifyDomain: data.shopifyDomain || '',
      shopifyApiKey: data.shopifyApiKey || '',
      shopifyApiSecret: data.shopifyApiSecret || '',
      isAdmin: false, // Regular users cannot register as admins
      isActive: true,
      confirmPassword: data.confirmPassword
    };
    
    // Log the final data being sent
    console.log('Final registration data structure:', {
      ...userData,
      password: '***REDACTED***',
      confirmPassword: '***REDACTED***'
    });
    
    registerMutation.mutate(userData);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Left side - Auth forms */}
        <div className="w-full md:w-1/2 p-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              DeliverConnect
            </h2>
            <p className="text-gray-600">
              Connect your Shopify store to delivery services
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            {/* Login form */}
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center justify-between">
                    <FormField
                      control={loginForm.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-medium">Remember me</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <a href="#" className="text-sm text-primary hover:text-indigo-700">
                      Forgot password?
                    </a>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Sign in
                  </Button>
                  
                  <div className="text-center mt-2">
                    <span className="text-sm text-gray-600">
                      Don't have an account?{" "}
                      <button 
                        type="button"
                        className="text-primary hover:text-indigo-700 font-medium"
                        onClick={() => setActiveTab("register")}
                      >
                        Register
                      </button>
                    </span>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            {/* Register form */}
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="shopifyDomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shopify Store Domain (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="your-store.myshopify.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Create Account
                  </Button>
                  
                  <div className="text-center mt-2">
                    <span className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <button 
                        type="button"
                        className="text-primary hover:text-indigo-700 font-medium"
                        onClick={() => setActiveTab("login")}
                      >
                        Sign in
                      </button>
                    </span>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right side - Hero */}
        <div className="hidden md:block w-1/2 bg-indigo-600 text-white p-12 flex flex-col justify-center">
          <h1 className="text-4xl font-bold mb-6">
            Connect Shopify to delivery services in minutes
          </h1>
          <p className="text-lg mb-6">
            DeliverConnect integrates your Shopify store with UberDirect, JetGo, and other delivery services to streamline your fulfillment process.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <svg className="h-6 w-6 mr-2 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Real-time order syncing
            </li>
            <li className="flex items-center">
              <svg className="h-6 w-6 mr-2 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Automatic delivery dispatching
            </li>
            <li className="flex items-center">
              <svg className="h-6 w-6 mr-2 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Live tracking and notifications
            </li>
            <li className="flex items-center">
              <svg className="h-6 w-6 mr-2 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Status updates to your Shopify store
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
