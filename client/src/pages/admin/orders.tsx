import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { DataTable } from "@/components/ui/data-table";
import StatusBadge from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function AdminOrders() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  
  // Fetch orders and client list
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
  });
  
  const { data: clients } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Get client name by ID
  const getClientName = (userId: number) => {
    const client = clients?.find(c => c.id === userId);
    return client ? client.name : "Unknown Client";
  };
  
  // Filter orders
  const filteredOrders = orders?.filter(order => {
    // Apply status filter
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }
    
    // Apply service filter
    if (serviceFilter !== "all" && order.deliveryService !== serviceFilter) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.shopifyOrderId?.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.customerEmail?.toLowerCase().includes(query)
      );
    }
    
    return true;
  }) || [];
  
  // Table columns
  const columns = [
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
      header: "Client",
      accessorKey: "userId",
      cell: ({ row }: any) => (
        <span>{getClientName(row.original.userId)}</span>
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
              Order Management
            </h1>
          </div>
        </header>
        
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="mt-8">
              <Card>
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      All Orders
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Input
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="in_transit">In Transit</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={serviceFilter} onValueChange={setServiceFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Services</SelectItem>
                          <SelectItem value="uberdirect">UberDirect</SelectItem>
                          <SelectItem value="jetgo">JetGo</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                          setServiceFilter("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                  
                  {isLoadingOrders ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredOrders.length > 0 ? (
                    <DataTable 
                      columns={columns} 
                      data={filteredOrders}
                    />
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      No orders found matching your filters
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
