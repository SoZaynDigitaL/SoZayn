import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, ShoppingBag, BarChart3 } from "lucide-react";

export default function Hero() {
  const { user } = useAuth();
  
  return (
    <div className="relative bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          {/* Left column - Text content */}
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center mb-6 px-3 py-1 rounded-full text-sm font-medium text-primary bg-primary/10 w-fit">
              <span>Shopify + Delivery Simplified</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
              <span className="block mb-2">Connect Shopify to</span>
              <span className="bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">delivery services</span>
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl">
              Seamlessly integrate your Shopify store with UberDirect, JetGo and other delivery services. Automate order fulfillment and tracking in one simple dashboard.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href={user ? "/dashboard" : "/auth?tab=register"}>
                <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base font-medium">
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-base font-medium">
                  Explore features
                </Button>
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-12">
              <p className="text-sm font-medium text-gray-500 mb-4">Trusted by Shopify merchants worldwide</p>
              <div className="flex flex-wrap gap-6 items-center">
                <div className="bg-white shadow-sm rounded-lg px-4 py-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.9975 6.82C15.9975 6.46286 15.7546 6.22 15.3975 6.22C14.0975 6.22 12.9119 6.5 11.9975 7C10.1261 6.07143 8.76473 6.22 7.33759 6.51714C7.05902 6.58571 6.89759 6.82857 6.89759 7.10714V15.3857C6.89759 15.7429 7.1404 15.9857 7.49759 15.9857C7.55902 15.9857 7.85902 15.9 7.9833 15.8714C9.06473 15.6 10.1261 15.4714 11.3975 16.1143C12.3119 16.6143 13.4404 16.9214 14.7404 16.7643C15.3404 16.6929 15.8833 16.5643 16.3404 16.3786C16.7261 16.2214 16.9975 15.85 16.9975 15.4357V7.14286C16.9975 6.97143 16.9404 6.82 16.8546 6.7C16.6404 6.42857 16.3119 6.52857 15.9975 6.82Z" />
                  </svg>
                  <span>500+ stores</span>
                </div>
                <div className="bg-white shadow-sm rounded-lg px-4 py-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.0001 5.00003L17.0001 9.00003L21.0001 13L17.0001 17L19.0001 21L12.0001 20L5.00006 21L7.00006 17L3.00006 13L7.00006 9.00003L5.00006 5.00003L12.0001 6.00003L19.0001 5.00003Z" />
                  </svg>
                  <span>99.9% uptime</span>
                </div>
                <div className="bg-white shadow-sm rounded-lg px-4 py-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.0001 16L6.00006 11.5L7.20006 9.9L11.0001 12.6667V4H13.0001V12.6667L16.8001 9.9L18.0001 11.5L12.0001 16Z" />
                    <path d="M18 20H6C5.44772 20 5 19.5523 5 19V14H7V18H17V14H19V19C19 19.5523 18.5523 20 18 20Z" />
                  </svg>
                  <span>10,000+ deliveries</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Visual elements */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Main illustration */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
                {/* Header with shopify-like appearance */}
                <div className="bg-[#95BF47] px-6 py-4">
                  <div className="flex justify-between items-center">
                    <svg className="h-7 w-auto text-white" viewBox="0 0 109 124" fill="currentColor">
                      <path d="M74.7 14.8c-.1-.7-.7-1.1-1.2-1.1-.5 0-10.4-.8-10.4-.8s-6.9-6.9-7.7-7.6c-.7-.7-2.2-.5-2.7-.4-.1 0-1.6.5-4.1 1.3C45.1 2.8 41.9 1 39.1 1c-10.8 0-16 13.4-17.6 20.2-4.2 1.3-7.2 2.2-7.5 2.3-2.3.7-2.4.8-2.7 3C10.9 29.1 1 100.5 1 100.5l75.4 14.2 32.5-8.1C108.9 106.6 74.7 15.4 74.7 14.8zM61.4 19.9l-5.3 1.6V18c0-.3 0-.6-.1-.9 3.3.4 5.1.9 5.4 3z"/>
                    </svg>
                    <div className="flex gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-white opacity-30"></span>
                      <span className="inline-block w-3 h-3 rounded-full bg-white opacity-30"></span>
                      <span className="inline-block w-3 h-3 rounded-full bg-white opacity-60"></span>
                    </div>
                  </div>
                </div>
                
                {/* Order details */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Order #51924</h3>
                    <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">Processing</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <ShoppingBag className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">3 items • $126.50</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Truck className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1 h-1 bg-primary/20 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-primary rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Delivery service connection */}
                <div className="p-6">
                  <h4 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
                    <span>Delivery Services</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">Connected</span>
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                      <div className="h-8 w-8 bg-black rounded-md flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                          <path d="M2 17L12 22L22 17" />
                          <path d="M2 12L12 17L22 12" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">UberDirect</div>
                        <div className="text-xs text-gray-500">Fastest delivery</div>
                      </div>
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                      <div className="h-8 w-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4 12H20M20 12L14 6M20 12L14 18" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">JetGo</div>
                        <div className="text-xs text-gray-500">Best for bulk orders</div>
                      </div>
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-primary/10 rounded-full -z-10"></div>
              <div className="absolute -top-4 -left-4 h-16 w-16 bg-primary/20 rounded-full -z-10"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
