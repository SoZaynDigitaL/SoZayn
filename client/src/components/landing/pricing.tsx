import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface PricingTierProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
}

function PricingTier({ 
  name, 
  price, 
  description, 
  features, 
  highlighted = false,
  ctaText
}: PricingTierProps) {
  const { user } = useAuth();
  
  return (
    <div className={`
      relative flex flex-col p-8 rounded-2xl shadow-sm overflow-hidden
      ${highlighted 
        ? 'bg-white border-2 border-primary shadow-lg' 
        : 'bg-white border border-gray-200'
      }
    `}>
      {highlighted && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-medium px-4 py-1 rounded-b-md">
          MOST POPULAR
        </div>
      )}
      
      <div className="mb-5">
        <h3 className="text-xl font-bold text-gray-900">{name}</h3>
        <p className="mt-1 text-gray-500">{description}</p>
      </div>
      
      <div className="mt-2 mb-8 flex items-baseline">
        <span className="text-4xl font-extrabold text-gray-900">{price}</span>
        <span className="ml-2 text-gray-500">/month</span>
      </div>
      
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className={`h-5 w-5 mt-0.5 flex-shrink-0 ${highlighted ? 'text-primary' : 'text-gray-500'}`} />
            <span className="text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Link href={user ? "/dashboard" : "/auth?tab=register"}>
        <Button 
          variant={highlighted ? "default" : "outline"}
          className="w-full"
          size="lg"
        >
          {ctaText}
        </Button>
      </Link>
    </div>
  );
}

export default function Pricing() {
  return (
    <div id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center mb-4 px-3 py-1 rounded-full text-sm font-medium text-primary bg-primary/10">
            <span>Simple Pricing</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
              Pay only
            </span>{" "}
            for what you need
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Choose the plan that suits your delivery volume with no hidden fees or long-term contracts.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
          <PricingTier
            name="Starter"
            price="$99"
            description="Perfect for new Shopify stores with low order volume"
            features={[
              "Up to 100 orders/month",
              "Connect to 2 delivery services",
              "Basic order tracking",
              "Email support",
              "Shopify app integration"
            ]}
            ctaText="Start with Starter"
          />
          
          <PricingTier
            name="Growth"
            price="$249"
            description="For growing businesses with moderate delivery needs"
            features={[
              "Up to 500 orders/month",
              "Connect to all delivery services",
              "Advanced order tracking",
              "Priority email & chat support",
              "Delivery analytics dashboard",
              "Automated status updates"
            ]}
            highlighted={true}
            ctaText="Choose Growth"
          />
          
          <PricingTier
            name="Enterprise"
            price="$599"
            description="For high-volume Shopify Plus merchants"
            features={[
              "Unlimited orders",
              "Custom delivery integrations",
              "Advanced analytics & reporting",
              "Dedicated account manager",
              "API access for custom development",
              "Service level agreement (SLA)",
              "Multiple user accounts"
            ]}
            ctaText="Contact Sales"
          />
        </div>
        
        {/* FAQ Section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                question: "Do you offer a free trial?",
                answer: "Yes, we offer a 14-day free trial on all plans with no credit card required. You can experience all features before committing."
              },
              {
                question: "Can I switch plans later?",
                answer: "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle."
              },
              {
                question: "Are there any setup fees?",
                answer: "No, there are no setup fees or hidden costs. The price you see is what you pay monthly."
              },
              {
                question: "How does billing work?",
                answer: "We bill monthly, and you can cancel anytime. We accept all major credit cards and can provide invoices for accounting purposes."
              },
              {
                question: "What delivery services do you support?",
                answer: "We currently support UberDirect and JetGo, with more services being added regularly. Enterprise plans can request custom integrations."
              },
              {
                question: "Do I need technical knowledge to use DeliverConnect?",
                answer: "Not at all. Our platform is designed to be user-friendly with an intuitive interface. No coding required to get started."
              }
            ].map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.question}</h4>
                <p className="text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <a 
              href="#" 
              className="text-primary font-medium hover:underline"
            >
              Contact our sales team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}