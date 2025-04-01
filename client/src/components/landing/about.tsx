import { BookOpen, Award, Users, Globe } from "lucide-react";

export default function About() {
  const stats = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      value: "500+",
      label: "Merchants",
      description: "Trusted by hundreds of Shopify merchants globally"
    },
    {
      icon: <Globe className="h-8 w-8 text-primary" />,
      value: "25+",
      label: "Countries",
      description: "Supporting deliveries across North America, Europe, and Asia"
    },
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      value: "99.9%",
      label: "Uptime",
      description: "Enterprise-grade reliability for your business"
    },
    {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      value: "2 Years",
      label: "Experience",
      description: "Building delivery solutions since 2023"
    }
  ];

  return (
    <div id="about" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left column - Content */}
          <div>
            <div className="inline-flex items-center mb-6 px-3 py-1 rounded-full text-sm font-medium text-primary bg-primary/10">
              <span>Our Story</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
                Built by e-commerce veterans
              </span>{" "}
              for Shopify merchants
            </h2>
            
            <div className="space-y-6 text-gray-600">
              <p>
                DeliverConnect was founded in 2023 by a team of e-commerce and logistics experts who saw a critical gap in the market: Shopify merchants struggling with delivery integrations.
              </p>
              <p>
                What started as a simple middleware to connect Shopify with UberDirect has evolved into a comprehensive platform supporting multiple delivery services and providing advanced analytics.
              </p>
              <p>
                Our mission is simple: make delivery integration effortless for e-commerce businesses of all sizes. We believe that logistics shouldn't be a barrier to growth.
              </p>
              <p>
                Today, we're proud to serve hundreds of merchants worldwide, processing thousands of deliveries daily while maintaining enterprise-grade reliability.
              </p>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a href="#" className="text-primary font-medium hover:underline flex items-center">
                <span>Meet the team</span>
                <svg className="ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a href="#" className="text-primary font-medium hover:underline flex items-center">
                <span>Read our blog</span>
                <svg className="ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* Right column - Stats */}
          <div className="mt-12 lg:mt-0">
            <div className="grid grid-cols-2 gap-8">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                >
                  <div className="mb-4">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-primary mb-2">
                    {stat.label}
                  </div>
                  <p className="text-sm text-gray-600">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Partners</h3>
              <div className="flex flex-wrap justify-center gap-8">
                {/* Shopify logo */}
                <div className="flex items-center justify-center">
                  <svg className="h-8 w-auto text-[#95BF47]" viewBox="0 0 109 124" fill="currentColor">
                    <path d="M74.7 14.8c-.1-.7-.7-1.1-1.2-1.1-.5 0-10.4-.8-10.4-.8s-6.9-6.9-7.7-7.6c-.7-.7-2.2-.5-2.7-.4-.1 0-1.6.5-4.1 1.3C45.1 2.8 41.9 1 39.1 1c-10.8 0-16 13.4-17.6 20.2-4.2 1.3-7.2 2.2-7.5 2.3-2.3.7-2.4.8-2.7 3C10.9 29.1 1 100.5 1 100.5l75.4 14.2 32.5-8.1C108.9 106.6 74.7 15.4 74.7 14.8z"/>
                  </svg>
                </div>
                
                {/* UberDirect styled logo */}
                <div className="flex items-center justify-center">
                  <div className="h-8 w-auto bg-black rounded-md px-3 flex items-center">
                    <span className="text-white text-sm font-bold">UberDirect</span>
                  </div>
                </div>
                
                {/* JetGo styled logo */}
                <div className="flex items-center justify-center">
                  <div className="h-8 w-auto bg-blue-500 rounded-md px-3 flex items-center">
                    <span className="text-white text-sm font-bold">JetGo</span>
                  </div>
                </div>
                
                {/* Other potential partners */}
                <div className="flex items-center justify-center">
                  <div className="h-8 w-auto rounded-md border border-gray-300 px-3 flex items-center">
                    <span className="text-gray-700 text-sm font-medium">DeliveryAPI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Company values */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900">Our Values</h3>
            <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
              The principles that guide us in building the best delivery integration platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Reliability First",
                description: "Our infrastructure is built to ensure your delivery operations run smoothly 24/7 without interruption."
              },
              {
                title: "Customer-Driven Development",
                description: "We actively listen to our merchants and build features that solve real delivery challenges."
              },
              {
                title: "Transparent Pricing",
                description: "No hidden fees or complex pricing structures. You always know exactly what you're paying for."
              }
            ].map((value, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">{index + 1}</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h4>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}