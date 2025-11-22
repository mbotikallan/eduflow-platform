import { ReactNode } from "react";
import { useAuth } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, BookOpen, Upload, BarChart3, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, userRole, signOut } = useAuth();
  const location = useLocation();

  const getNavItems = () => {
    const items = [
      { href: "/dashboard", label: "Resources", icon: BookOpen, roles: ["student", "teacher", "admin"] },
    ];

    if (userRole === "teacher" || userRole === "admin") {
      items.push({ href: "/upload", label: "Upload", icon: Upload, roles: ["teacher", "admin"] });
      items.push({ href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["teacher", "admin"] });
    }

    if (userRole === "admin") {
      items.push({ href: "/users", label: "Users", icon: Users, roles: ["admin"] });
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">LMS</h1>
              <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            {getNavItems().map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-b bg-background p-4">
        <div className="flex gap-2 overflow-x-auto">
          {getNavItems().map((item) => (
            <Button
              key={item.href}
              variant={location.pathname === item.href ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link to={item.href}>
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
};
