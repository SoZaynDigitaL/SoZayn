import { 
  Zap,
  MessageSquare,
  ClipboardList,
  Lock,
  RefreshCw,
  Truck,
  Bell,
  BarChart,
  Check
} from "lucide-react";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: string;
}

function Feature({ icon, title, description, color = "bg-primary" }: FeatureProps) {
  return (
    <div className="relative bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-4">
        <div className={`${color} h-14 w-14 rounded-lg flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Features() {
  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Real-time Order Syncing",
      description: "Automatically receive orders from Shopify in real-time via webhooks and manage them in one place.",
      color: "bg-orange-500"
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Multi-Service Integration",
      description: "Connect with UberDirect, JetGo, and more delivery services through a single API integration.",
      color: "bg-primary"
    },
    {
      icon: <ClipboardList className="h-6 w-6" />,
      title: "Status Tracking",
      description: "Monitor delivery status in real-time and get notifications when orders are delivered.",
      color: "bg-blue-500"
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Secure Authentication",
      description: "JWT-based authentication keeps your data secure and ensures only authorized access.",
      color: "bg-emerald-600"
    },
    {
      icon: <RefreshCw className="h-6 w-6" />,
      title: "Automatic Updates",
      description: "Delivery status updates are automatically synced back to your Shopify store.",
      color: "bg-purple-600"
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Delivery Options",
      description: "Choose the best delivery service for each order based on location, cost, and speed.",
      color: "bg-pink-600"
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Notifications",
      description: "Get alerts when orders are placed, picked up, delivered, or if any issues arise.",
      color: "bg-amber-500"
    },
    {
      icon: <BarChart className="h-6 w-6" />,
      title: "Analytics Dashboard",
      description: "View performance metrics, delivery success rates, and optimize your fulfillment process.",
      color: "bg-indigo-600"
    }
  ];

  return (
    <div id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center mb-4 px-3 py-1 rounded-full text-sm font-medium text-primary bg-primary/10">
            <span>Powerful Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
              Everything you need
            </span>{" "}
            to connect delivery services
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Our platform handles the entire process from order receipt to delivery confirmation.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Feature 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              color={feature.color}
            />
          ))}
        </div>
        
        {/* Comparison Section */}
        <div className="mt-24 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="text-center p-8 border-b border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Why Choose DeliverConnect?</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Compared to building custom integrations yourself, DeliverConnect saves time, money and headaches.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="p-8">
              <h4 className="font-semibold text-lg mb-4 text-gray-900">With DeliverConnect</h4>
              <ul className="space-y-3">
                {[
                  "Single integration to multiple carriers",
                  "Ready to use in minutes",
                  "Automatic status updates",
                  "Real-time tracking and analytics",
                  "No maintenance required",
                  "Predictable monthly pricing"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-8">
              <h4 className="font-semibold text-lg mb-4 text-gray-900">Without DeliverConnect</h4>
              <ul className="space-y-3">
                {[
                  "Multiple complex integrations",
                  "Weeks of development time",
                  "Manual status checking",
                  "No unified tracking system",
                  "Constant API maintenance",
                  "Unpredictable development costs"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-8 bg-gray-50">
              <h4 className="font-semibold text-lg mb-4 text-primary">What Our Clients Say</h4>
              <div className="space-y-6">
                <blockquote className="italic text-gray-600 border-l-4 border-primary pl-4 py-1">
                  "DeliverConnect reduced our integration time from months to days. Our delivery operations now run seamlessly."
                  <footer className="text-sm font-medium text-gray-900 mt-1 not-italic">
                    — Shopify Store Owner
                  </footer>
                </blockquote>
                <blockquote className="italic text-gray-600 border-l-4 border-primary pl-4 py-1">
                  "The analytics dashboard alone saved us 20% on delivery costs by helping us choose the right service."
                  <footer className="text-sm font-medium text-gray-900 mt-1 not-italic">
                    — E-commerce Manager
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
