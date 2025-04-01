import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Hero() {
  const { user } = useAuth();
  
  return (
    <div className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 lg:mt-16 lg:px-8 xl:mt-20">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Connect Shopify to</span>
                <span className="block text-primary">delivery services</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Seamlessly integrate your Shopify store with UberDirect, JetGo and other delivery services. Automate order fulfillment and tracking in one simple dashboard.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link href={user ? "/dashboard" : "/auth?tab=register"}>
                    <Button size="lg" className="w-full px-8 py-3">
                      Get started
                    </Button>
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link href="#features">
                    <Button variant="outline" size="lg" className="w-full px-8 py-3">
                      Learn more
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-gray-100 flex items-center justify-center p-8">
        <svg 
          viewBox="0 0 520 520" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="h-64 w-auto sm:h-72 md:h-80 lg:h-96"
        >
          <rect width="520" height="520" rx="10" fill="#F3F4F6" />
          <rect x="120" y="120" width="280" height="280" rx="20" fill="#4F46E5" fillOpacity="0.1" />
          <rect x="140" y="140" width="240" height="140" rx="8" fill="white" />
          <rect x="160" y="160" width="120" height="12" rx="2" fill="#4F46E5" />
          <rect x="160" y="180" width="80" height="8" rx="2" fill="#D1D5DB" />
          <rect x="160" y="200" width="180" height="8" rx="2" fill="#D1D5DB" />
          <rect x="160" y="220" width="150" height="8" rx="2" fill="#D1D5DB" />
          <rect x="160" y="240" width="100" height="20" rx="4" fill="#4F46E5" />
          <rect x="140" y="300" width="240" height="80" rx="8" fill="white" />
          <path d="M160 320L180 340L160 360" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="200" y="325" width="140" height="10" rx="2" fill="#4F46E5" fillOpacity="0.6" />
          <rect x="200" y="345" width="100" height="6" rx="2" fill="#D1D5DB" />
        </svg>
      </div>
    </div>
  );
}
