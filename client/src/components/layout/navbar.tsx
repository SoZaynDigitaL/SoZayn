import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Loader2, User, Menu, LogOut, Settings, LayoutDashboard, Package } from "lucide-react";

export default function Navbar() {
  const { user, isLoading, isAdmin, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation("/");
  };
  
  // Check if route is active
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };
  
  // Links based on user role
  const getNavLinks = () => {
    if (!user) {
      return [
        { href: "/", label: "Home" },
        { href: "/auth", label: "Login" },
      ];
    }
    
    if (isAdmin) {
      return [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/clients", label: "Clients" },
        { href: "/admin/orders", label: "Orders" },
      ];
    }
    
    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/orders", label: "Orders" },
      { href: "/settings", label: "Settings" },
    ];
  };
  
  const navLinks = getNavLinks();
  
  // Render different navbar based on authentication status
  const renderNavbarContent = () => {
    // Loading state
    if (isLoading) {
      return (
        <div className="flex justify-between w-full items-center">
          <Link href="/" className="text-primary font-bold text-xl">
            SoZayn
          </Link>
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      );
    }
    
    // Landing page navigation (unauthenticated)
    if (!user && location === "/") {
      return (
        <>
          <div className="flex items-center">
            <Link href="/" className="text-primary font-bold text-xl">
              SoZayn
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a href="#features" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Features
              </a>
              <a href="#pricing" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Pricing
              </a>
              <a href="#about" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                About
              </a>
            </div>
          </div>
          <div className="hidden sm:flex sm:items-center">
            <Link href="/auth" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Log in
            </Link>
            <Link href="/auth?tab=register">
              <Button>Register</Button>
            </Link>
          </div>
          <div className="sm:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>SoZayn</SheetTitle>
                </SheetHeader>
                <div className="py-4 flex flex-col gap-2">
                  <a 
                    href="#features" 
                    className="px-4 py-2 text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Features
                  </a>
                  <a 
                    href="#pricing" 
                    className="px-4 py-2 text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Pricing
                  </a>
                  <a 
                    href="#about" 
                    className="px-4 py-2 text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    About
                  </a>
                  <Link 
                    href="/auth" 
                    className="px-4 py-2 text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link 
                    href="/auth?tab=register" 
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button className="mx-4 mt-2">
                      Register
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </>
      );
    }
    
    // Authenticated navigation
    return (
      <>
        <div className="flex items-center">
          <Link 
            href={isAdmin ? "/admin" : "/dashboard"} 
            className="text-primary font-bold text-xl"
          >
            SoZayn
          </Link>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`${
                  isActive(link.href)
                    ? "border-primary text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="hidden sm:flex sm:items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user && (
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs font-normal text-gray-500">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
              )}
              <DropdownMenuSeparator />
              
              {isAdmin ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/clients" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Clients</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/orders" className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Orders</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="sm:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>
                  {user && (
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs font-normal text-gray-500">{user.email}</span>
                    </div>
                  )}
                </SheetTitle>
              </SheetHeader>
              <div className="py-4 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={`px-4 py-2 text-sm ${
                      isActive(link.href) ? "bg-gray-100 text-primary" : ""
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t my-2"></div>
                <button 
                  className="px-4 py-2 text-sm flex items-center text-red-600"
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {logoutMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Log out
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </>
    );
  };
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {renderNavbarContent()}
        </div>
      </div>
    </nav>
  );
}
