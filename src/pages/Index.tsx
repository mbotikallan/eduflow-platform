import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, BarChart3, Users, ArrowRight } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">LMS</span>
          </div>
          <Button onClick={() => navigate("/auth")}>
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4">
        {/* Hero */}
        <section className="py-20 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Modern Learning
              <span className="block text-primary">Management System</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Empower educators and students with a comprehensive platform for sharing,
              accessing, and managing educational resources.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button size="lg" onClick={() => navigate("/auth")}>
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground">Everything you need for effective learning management</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-6 border rounded-xl bg-card hover:shadow-lg transition-shadow">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Resource Library</h3>
              <p className="text-muted-foreground">
                Access videos, images, and PDFs organized by categories. Search, filter,
                and download materials instantly.
              </p>
            </div>

            <div className="p-6 border rounded-xl bg-card hover:shadow-lg transition-shadow">
              <div className="p-3 bg-accent/10 rounded-lg w-fit mb-4">
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Advanced Analytics</h3>
              <p className="text-muted-foreground">
                Track resource views, downloads, and engagement. Visual charts provide
                insights for data-driven decisions.
              </p>
            </div>

            <div className="p-6 border rounded-xl bg-card hover:shadow-lg transition-shadow">
              <div className="p-3 bg-success/10 rounded-lg w-fit mb-4">
                <Users className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-2">Role-Based Access</h3>
              <p className="text-muted-foreground">
                Dedicated interfaces for students, teachers, and administrators with
                appropriate permissions and tools.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <div className="max-w-2xl mx-auto p-8 border rounded-2xl bg-card shadow-lg">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Learning?</h2>
            <p className="text-muted-foreground mb-6">
              Join our platform and experience modern educational resource management
            </p>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Learning Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
