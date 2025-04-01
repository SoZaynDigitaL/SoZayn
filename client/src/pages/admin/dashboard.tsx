import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import StatusBadge from "@/components/ui/status-badge";
import { Loader2, Users, Package } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Fetch admin stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/stats'],
    retry: false,
  });
  
  // Fetch recent orders
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
    retry: false,
  });
  
  // Fetch user list for clients
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
    retry: false,
  });
  
  const recentOrders = orders?.slice(0, 5) || [];
  const recentClients = users?.filter(u => !u.isAdmin).slice(0, 5) || [];
  
  // Columns for orders table
  const ordersColumns = [
    {
      header: "Order ID",
      accessorKey: "shopifyOrderId",
      cell: ({ row }: any) => (
        <span className="font-medium text-primary">
          #{row.original.shopifyOrderId.slice(0, 8)}
        </span>
      ),
    },
    {
      header: "Customer",
      accessorKey: "customerName",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: any) => (
        <StatusBadge status={row.original.status} />
      ),
    },
    {
      header: "Delivery Service",
      accessorKey: "deliveryService",
    },
    {
      header: "Date",
      accessorKey: "createdAt",
      cell: ({ row }: any) => (
        <span>
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];
  
  // Columns for clients table
  const clientsColumns = [
    {
      header: "Client",
      accessorKey: "name",
      cell: ({ row }: any) => (
        <div>
          <p className="font-medium text-primary">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.shopifyDomain || "No Shopify domain"}</p>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: ({ row }: any) => (
        <Badge variant={row.original.isActive ? "success" : "destructive"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
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
              Admin Dashboard
            </h1>
          </div>
        </header>
        
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {/* Stats Section */}
            <div className="mt-8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 truncate">
                        Total Clients
                      </span>
                      {isLoadingStats ? (
                        <Loader2 className="h-4 w-4 animate-spin mt-2" />
                      ) : (
                        <span className="mt-1 text-3xl font-semibold text-gray-900">
                          {stats?.totalClients || 0}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 truncate">
                        Active Orders
                      </span>
                      {isLoadingStats ? (
                        <Loader2 className="h-4 w-4 animate-spin mt-2" />
                      ) : (
                        <span className="mt-1 text-3xl font-semibold text-gray-900">
                          {stats?.activeOrders || 0}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 truncate">
                        Delivery Success Rate
                      </span>
                      {isLoadingStats ? (
                        <Loader2 className="h-4 w-4 animate-spin mt-2" />
                      ) : (
                        <span className="mt-1 text-3xl font-semibold text-gray-900">
                          {stats?.successRate || 0}%
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Clients Section */}
            <div className="mt-8">
              <Card>
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Client Accounts
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Recently added client accounts
                    </p>
                  </div>
                  <Link href="/admin/clients">
                    <Button>View All Clients</Button>
                  </Link>
                </div>
                
                <CardContent className="p-0">
                  {isLoadingUsers ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : recentClients.length > 0 ? (
                    <DataTable 
                      columns={clientsColumns} 
                      data={recentClients}
                      pagination={false}
                    />
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      No clients found
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Orders Section */}
            <div className="mt-8">
              <Card>
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      <Package className="mr-2 h-5 w-5" />
                      Recent Orders
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Most recent orders processed through the system
                    </p>
                  </div>
                  <Link href="/admin/orders">
                    <Button>View All Orders</Button>
                  </Link>
                </div>
                
                <CardContent className="p-0">
                  {isLoadingOrders ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : recentOrders.length > 0 ? (
                    <DataTable 
                      columns={ordersColumns} 
                      data={recentOrders}
                      pagination={false}
                    />
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      No orders found
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
