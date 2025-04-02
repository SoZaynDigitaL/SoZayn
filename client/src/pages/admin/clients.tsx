import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/navbar";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, MoreHorizontal } from "lucide-react";

export default function AdminClients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Toggle user active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/users/${userId}/toggle-active`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "Client status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update client status",
        variant: "destructive",
      });
    },
  });
  
  // Filter clients
  const filteredClients = (clients as any[] || []).filter((client: any) => {
    // Exclude admin users
    if (client.isAdmin) return false;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.shopifyDomain?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Table columns
  const columns = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Shopify Domain",
      accessorKey: "shopifyDomain",
      cell: ({ row }: any) => (
        <span>
          {row.original.shopifyDomain || "Not configured"}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: ({ row }: any) => (
        <Badge variant={row.original.isActive ? "default" : "destructive"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }: any) => (
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <AlertDialogTrigger asChild>
                <DropdownMenuItem>
                  {row.original.isActive ? "Disable Account" : "Enable Account"}
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {row.original.isActive 
                  ? "Are you sure you want to disable this account?" 
                  : "Are you sure you want to enable this account?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {row.original.isActive 
                  ? "This will prevent the user from accessing the platform and their orders will not be processed."
                  : "This will allow the user to access the platform and their orders will be processed."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => toggleActiveMutation.mutate(row.original.id)}
                disabled={toggleActiveMutation.isPending}
              >
                {toggleActiveMutation.isPending && 
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                }
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
  ];
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Client Management
            </h1>
          </div>
        </header>
        
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="mt-8">
              <Card>
                <div className="p-6">
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                      All Clients
                    </h2>
                    
                    <div className="mt-3 sm:mt-0">
                      <Input
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-64"
                      />
                    </div>
                  </div>
                  
                  {isLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredClients.length > 0 ? (
                    <DataTable 
                      columns={columns} 
                      data={filteredClients}
                    />
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      {searchQuery 
                        ? "No clients found matching your search" 
                        : "No clients found"}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
