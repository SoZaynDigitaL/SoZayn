import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, TruckIcon } from "lucide-react";

export default function ClientOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState("uberdirect");
  
  // Fetch client's orders
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
  });
  
  // Mutation for submitting order to delivery service
  const submitToDeliveryMutation = useMutation({
    mutationFn: async ({ orderId, service }: { orderId: number, service: string }) => {
      const res = await apiRequest("POST", "/api/delivery/submit", { orderId, service });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Success",
        description: "Order submitted to delivery service",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit order",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for checking delivery status
  const checkStatusMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("GET", `/api/delivery/status/${orderId}`, undefined);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: data.message,
        description: data.previousStatus !== data.currentStatus 
          ? `Status updated from ${data.previousStatus} to ${data.currentStatus}` 
          : "No change in status",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check status",
        variant: "destructive",
      });
    }
  });
  
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
      header: "Customer",
      accessorKey: "customerName",
      cell: ({ row }: any) => (
        <div>
          <p>{row.original.customerName}</p>
          {row.original.customerEmail && (
            <p className="text-xs text-muted-foreground">{row.original.customerEmail}</p>
          )}
        </div>
      ),
    },
    {
      header: "Address",
      accessorKey: "shippingAddress",
      cell: ({ row }: any) => (
        <div className="max-w-xs truncate" title={row.original.shippingAddress}>
          {row.original.shippingAddress}
        </div>
      ),
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
      header: "Actions",
      id: "actions",
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          {!row.original.deliveryService && row.original.status === "processing" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedOrderId(row.original.id)}
                >
                  <TruckIcon className="h-4 w-4 mr-1" /> Deliver
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Order to Delivery Service</DialogTitle>
                  <DialogDescription>
                    Choose a delivery service to fulfill this order
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <Select defaultValue="uberdirect" onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a delivery service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uberdirect">UberDirect</SelectItem>
                      <SelectItem value="jetgo">JetGo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedOrderId(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (selectedOrderId) {
                        submitToDeliveryMutation.mutate({
                          orderId: selectedOrderId,
                          service: selectedService
                        });
                      }
                      setSelectedOrderId(null);
                    }}
                    disabled={submitToDeliveryMutation.isPending}
                  >
                    {submitToDeliveryMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {row.original.deliveryService && ["processing", "in_transit"].includes(row.original.status) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => checkStatusMutation.mutate(row.original.id)}
              disabled={checkStatusMutation.isPending}
            >
              {checkStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Update
            </Button>
          )}
          
          {row.original.deliveryTrackingUrl && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(row.original.deliveryTrackingUrl, '_blank')}
            >
              Track
            </Button>
          )}
        </div>
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
                      Your Orders
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
