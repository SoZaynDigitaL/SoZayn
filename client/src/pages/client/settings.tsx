import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/navbar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, AlertCircle, PackageCheck, Truck, LifeBuoy } from "lucide-react";

// Form schema for profile settings
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional(),
});

// Form schema for Shopify integration
const shopifySchema = z.object({
  shopifyDomain: z.string()
    .min(5, "Domain must be at least 5 characters")
    .regex(/\.myshopify\.com$/, "Domain must end with .myshopify.com"),
  shopifyApiKey: z.string().min(10, "API key must be at least 10 characters").optional(),
  shopifyApiSecret: z.string().min(10, "API secret must be at least 10 characters").optional(),
});

// Form schema for UberDirect integration
const uberDirectSchema = z.object({
  uberDirectApiKey: z.string().min(10, "API key must be at least 10 characters"),
  uberDirectClientId: z.string().min(10, "Client ID must be at least 10 characters"),
  uberDirectClientSecret: z.string().min(10, "Client secret must be at least 10 characters"),
});

// Form schema for JetGo integration
const jetGoSchema = z.object({
  jetGoApiKey: z.string().min(10, "API key must be at least 10 characters"),
  jetGoAccountId: z.string().min(4, "Account ID must be at least 4 characters"),
});

// Form schema for delivery service preferences
const deliveryPreferencesSchema = z.object({
  preferredDeliveryService: z.string().min(1, "Please select a preferred delivery service"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type ShopifyFormValues = z.infer<typeof shopifySchema>;
type UberDirectFormValues = z.infer<typeof uberDirectSchema>;
type JetGoFormValues = z.infer<typeof jetGoSchema>;
type DeliveryPreferencesFormValues = z.infer<typeof deliveryPreferencesSchema>;

export default function ClientSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email,
    },
  });
  
  // Shopify form
  const shopifyForm = useForm<ShopifyFormValues>({
    resolver: zodResolver(shopifySchema),
    defaultValues: {
      shopifyDomain: user?.shopifyDomain || "",
      shopifyApiKey: user?.shopifyApiKey || "",
      shopifyApiSecret: user?.shopifyApiSecret || "",
    },
  });
  
  // UberDirect form
  const uberDirectForm = useForm<UberDirectFormValues>({
    resolver: zodResolver(uberDirectSchema),
    defaultValues: {
      uberDirectApiKey: user?.uberDirectApiKey || "",
      uberDirectClientId: user?.uberDirectClientId || "",
      uberDirectClientSecret: user?.uberDirectClientSecret || "",
    },
  });
  
  // JetGo form
  const jetGoForm = useForm<JetGoFormValues>({
    resolver: zodResolver(jetGoSchema),
    defaultValues: {
      jetGoApiKey: user?.jetGoApiKey || "",
      jetGoAccountId: user?.jetGoAccountId || "",
    },
  });
  
  // Delivery preferences form
  const deliveryPreferencesForm = useForm<DeliveryPreferencesFormValues>({
    resolver: zodResolver(deliveryPreferencesSchema),
    defaultValues: {
      preferredDeliveryService: user?.preferredDeliveryService || "",
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });
  
  // Update Shopify settings mutation
  const updateShopifyMutation = useMutation({
    mutationFn: async (data: ShopifyFormValues) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Shopify settings updated",
        description: "Your Shopify integration settings have been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update Shopify settings",
        variant: "destructive",
      });
    },
  });
  
  // Setup Shopify webhooks mutation
  const setupWebhooksMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/setup-shopify-webhooks", {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Webhooks setup initiated",
        description: "Shopify webhooks are being set up. This may take a few moments.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to setup webhooks",
        variant: "destructive",
      });
    },
  });
  
  // Submit profile form
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  // Submit Shopify form
  const onShopifySubmit = (data: ShopifyFormValues) => {
    updateShopifyMutation.mutate(data);
  };
  
  // Update UberDirect settings mutation
  const updateUberDirectMutation = useMutation({
    mutationFn: async (data: UberDirectFormValues) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "UberDirect settings updated",
        description: "Your UberDirect integration settings have been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update UberDirect settings",
        variant: "destructive",
      });
    },
  });
  
  // Update JetGo settings mutation
  const updateJetGoMutation = useMutation({
    mutationFn: async (data: JetGoFormValues) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "JetGo settings updated",
        description: "Your JetGo integration settings have been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update JetGo settings",
        variant: "destructive",
      });
    },
  });
  
  // Update delivery preferences mutation
  const updateDeliveryPreferencesMutation = useMutation({
    mutationFn: async (data: DeliveryPreferencesFormValues) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Delivery preferences updated",
        description: "Your preferred delivery service has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update delivery preferences",
        variant: "destructive",
      });
    },
  });
  
  // Submit UberDirect form
  const onUberDirectSubmit = (data: UberDirectFormValues) => {
    updateUberDirectMutation.mutate(data);
  };
  
  // Submit JetGo form
  const onJetGoSubmit = (data: JetGoFormValues) => {
    updateJetGoMutation.mutate(data);
  };
  
  // Submit delivery preferences form
  const onDeliveryPreferencesSubmit = (data: DeliveryPreferencesFormValues) => {
    updateDeliveryPreferencesMutation.mutate(data);
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Account Settings
            </h1>
          </div>
        </header>
        
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="mt-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-8">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="shopify">Shopify</TabsTrigger>
                  <TabsTrigger value="uberdirect">UberDirect</TabsTrigger>
                  <TabsTrigger value="jetgo">JetGo</TabsTrigger>
                  <TabsTrigger value="delivery-prefs">Preferences</TabsTrigger>
                </TabsList>
                
                {/* Profile Settings */}
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                          <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="your@email.com" 
                                    {...field} 
                                    disabled 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Email cannot be changed
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save Changes
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Shopify Integration */}
                <TabsContent value="shopify">
                  <Card>
                    <CardHeader>
                      <CardTitle>Shopify Integration</CardTitle>
                      <CardDescription>
                        Connect your Shopify store to enable order syncing
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Alert className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription>
                          You'll need to create a private app in your Shopify store to get the API credentials.
                          Make sure to grant write access to Orders and Fulfillment services.
                        </AlertDescription>
                      </Alert>
                      
                      <Form {...shopifyForm}>
                        <form onSubmit={shopifyForm.handleSubmit(onShopifySubmit)} className="space-y-6">
                          <FormField
                            control={shopifyForm.control}
                            name="shopifyDomain"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Shopify Store Domain</FormLabel>
                                <FormControl>
                                  <Input placeholder="your-store.myshopify.com" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Enter your full Shopify domain including .myshopify.com
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={shopifyForm.control}
                            name="shopifyApiKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>API Key</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Your Shopify API key"
                                    type="password" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  From your private app in Shopify admin
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={shopifyForm.control}
                            name="shopifyApiSecret"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>API Secret</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Your Shopify API secret" 
                                    type="password"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  From your private app in Shopify admin
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex flex-col sm:flex-row gap-4">
                            <Button 
                              type="submit" 
                              className="flex-1"
                              disabled={updateShopifyMutation.isPending}
                            >
                              {updateShopifyMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Save Settings
                            </Button>
                            
                            <Button 
                              type="button" 
                              variant="outline"
                              className="flex-1"
                              onClick={() => setupWebhooksMutation.mutate()}
                              disabled={setupWebhooksMutation.isPending || !user?.shopifyDomain}
                            >
                              {setupWebhooksMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Setup Webhooks
                            </Button>
                          </div>
                          
                          {!user?.shopifyDomain && (
                            <p className="text-sm text-muted-foreground">
                              Save your Shopify settings before setting up webhooks
                            </p>
                          )}
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* UberDirect Integration */}
                <TabsContent value="uberdirect">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <PackageCheck className="mr-2 h-5 w-5" />
                        UberDirect Integration
                      </CardTitle>
                      <CardDescription>
                        Connect to UberDirect for real-time delivery services
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Alert className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription>
                          You'll need to create an account with UberDirect and generate API credentials.
                          Contact your UberDirect account manager if you need assistance.
                        </AlertDescription>
                      </Alert>
                      
                      <Form {...uberDirectForm}>
                        <form onSubmit={uberDirectForm.handleSubmit(onUberDirectSubmit)} className="space-y-6">
                          <FormField
                            control={uberDirectForm.control}
                            name="uberDirectApiKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>API Key</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Your UberDirect API key"
                                    type="password" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  The API key provided by UberDirect
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={uberDirectForm.control}
                            name="uberDirectClientId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client ID</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Your UberDirect client ID" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  The client ID for your UberDirect account
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={uberDirectForm.control}
                            name="uberDirectClientSecret"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client Secret</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Your UberDirect client secret" 
                                    type="password"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  The client secret for your UberDirect account
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={updateUberDirectMutation.isPending}
                          >
                            {updateUberDirectMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save UberDirect Settings
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* JetGo Integration */}
                <TabsContent value="jetgo">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Truck className="mr-2 h-5 w-5" />
                        JetGo Integration
                      </CardTitle>
                      <CardDescription>
                        Connect to JetGo for premium delivery services
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Alert className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription>
                          You'll need to sign up for a JetGo account and request API access.
                          Your account manager will provide the necessary credentials.
                        </AlertDescription>
                      </Alert>
                      
                      <Form {...jetGoForm}>
                        <form onSubmit={jetGoForm.handleSubmit(onJetGoSubmit)} className="space-y-6">
                          <FormField
                            control={jetGoForm.control}
                            name="jetGoApiKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>API Key</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Your JetGo API key"
                                    type="password" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  The API key provided by JetGo
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={jetGoForm.control}
                            name="jetGoAccountId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account ID</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Your JetGo account ID" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  The account ID for your JetGo account
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={updateJetGoMutation.isPending}
                          >
                            {updateJetGoMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save JetGo Settings
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Delivery Preferences */}
                <TabsContent value="delivery-prefs">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <LifeBuoy className="mr-2 h-5 w-5" />
                        Delivery Preferences
                      </CardTitle>
                      <CardDescription>
                        Choose your preferred delivery service for automatic routing
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...deliveryPreferencesForm}>
                        <form onSubmit={deliveryPreferencesForm.handleSubmit(onDeliveryPreferencesSubmit)} className="space-y-6">
                          <FormField
                            control={deliveryPreferencesForm.control}
                            name="preferredDeliveryService"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel>Preferred Delivery Service</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                  >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="uber_direct" />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        UberDirect (faster for urban areas)
                                      </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="jet_go" />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        JetGo (better for suburban/rural areas)
                                      </FormLabel>
                                    </FormItem>
                                  </RadioGroup>
                                </FormControl>
                                <FormDescription>
                                  This service will be used by default for all deliveries
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={updateDeliveryPreferencesMutation.isPending}
                          >
                            {updateDeliveryPreferencesMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save Preferences
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
