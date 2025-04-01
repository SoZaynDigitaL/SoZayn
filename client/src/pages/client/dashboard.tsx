import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import StatusBadge from "@/components/ui/status-badge";
import { Loader2, Package } from "lucide-react";

export default function ClientDashboard() {
  const { user } = useAuth();
  
  // Fetch client stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/client-stats'],
    retry: false,
  });
  
  // Fetch client's orders
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
    retry: false,
  });
  
  const recentOrders = orders?.slice(0, 5) || [];
  
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
      cell: ({ row }: any) => (
        <span className="capitalize">
          {row.original.deliveryService || "Not assigned"}
        </span>
      ),
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
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Client Dashboard
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
                        Today's Orders
                      </span>
                      {isLoadingStats ? (
                        <Loader2 className="h-4 w-4 animate-spin mt-2" />
                      ) : (
                        <span className="mt-1 text-3xl font-semibold text-gray-900">
                          {stats?.todayOrders || 0}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 truncate">
                        Orders In Transit
                      </span>
                      {isLoadingStats ? (
                        <Loader2 className="h-4 w-4 animate-spin mt-2" />
                      ) : (
                        <span className="mt-1 text-3xl font-semibold text-gray-900">
                          {stats?.inTransitOrders || 0}
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
            
            {/* Recent Orders Section */}
            <div className="mt-8">
              <Card>
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      <Package className="mr-2 h-5 w-5" />
                      Recent Orders
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Your most recent delivery orders
                    </p>
                  </div>
                  <Link href="/orders">
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
            
            {/* Setup Guide Card */}
            {!user?.shopifyDomain && (
              <div className="mt-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Complete Your Setup
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Configure your Shopify store settings to start receiving orders
                      </p>
                      <Link href="/settings">
                        <Button>
                          Go to Settings
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
