import { 
  Zap,
  MessageSquare,
  ClipboardList,
  Lock,
  RefreshCw,
  Truck,
  Bell,
  BarChart 
} from "lucide-react";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function Feature({ icon, title, description }: FeatureProps) {
  return (
    <div className="relative">
      <dt>
        <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
          {icon}
        </div>
        <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{title}</p>
      </dt>
      <dd className="mt-2 ml-16 text-base text-gray-500">
        {description}
      </dd>
    </div>
  );
}

export default function Features() {
  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Real-time Order Syncing",
      description: "Automatically receive orders from Shopify in real-time via webhooks and manage them in one place."
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Multi-Service Integration",
      description: "Connect with UberDirect, JetGo, and more delivery services through a single API integration."
    },
    {
      icon: <ClipboardList className="h-6 w-6" />,
      title: "Status Tracking",
      description: "Monitor delivery status in real-time and get notifications when orders are delivered."
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Secure Authentication",
      description: "JWT-based authentication keeps your data secure and ensures only authorized access."
    },
    {
      icon: <RefreshCw className="h-6 w-6" />,
      title: "Automatic Updates",
      description: "Delivery status updates are automatically synced back to your Shopify store."
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Delivery Options",
      description: "Choose the best delivery service for each order based on location, cost, and speed."
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Notifications",
      description: "Get alerts when orders are placed, picked up, delivered, or if any issues arise."
    },
    {
      icon: <BarChart className="h-6 w-6" />,
      title: "Analytics Dashboard",
      description: "View performance metrics, delivery success rates, and optimize your fulfillment process."
    }
  ];

  return (
    <div id="features" className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to connect delivery services
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Our platform handles the entire process from order receipt to delivery confirmation.
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            {features.slice(0, 4).map((feature, index) => (
              <Feature 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
