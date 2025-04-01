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
import { Loader2, AlertCircle } from "lucide-react";

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

type ProfileFormValues = z.infer<typeof profileSchema>;
type ShopifyFormValues = z.infer<typeof shopifySchema>;

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
                <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="shopify">Shopify Integration</TabsTrigger>
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
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
